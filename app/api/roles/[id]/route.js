import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { requireDeveloper } from "../../../../lib/guard";

// Core roles that must never be deleted — the app's permission model depends on them.
const PROTECTED_ROLE_SLUGS = ["developer", "admin", "client"];

// Developer-only: replace a role's app-menu access. Body: { menuSlugs: string[] }.
// Only real app menus are honored; the Developer role can't be edited (it always
// has every menu).
export async function PUT(req, { params }) {
  const gate = await requireDeveloper();
  if (gate.error) return NextResponse.json({ error: gate.error }, { status: gate.status });

  const id = Number(params.id);
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: "Invalid role id." }, { status: 400 });
  }

  const role = await prisma.role.findUnique({ where: { id } });
  if (!role) {
    return NextResponse.json({ error: "Role not found." }, { status: 404 });
  }
  if (role.slug === "developer") {
    return NextResponse.json({ error: "The Developer role always has access to every menu." }, { status: 400 });
  }

  const body = await req.json().catch(() => ({}));
  const requested = Array.isArray(body.menuSlugs) ? body.menuSlugs : [];

  // Restrict to real app menus.
  const appMenus = await prisma.menu.findMany({ where: { menuGroup: "app" }, select: { id: true, slug: true } });
  const bySlug = Object.fromEntries(appMenus.map((m) => [m.slug, m]));
  const validSlugs = [...new Set(requested)].filter((s) => bySlug[s]);

  await prisma.$transaction(async (tx) => {
    await tx.roleMenu.deleteMany({ where: { roleSlug: role.slug } });
    for (const s of validSlugs) {
      await tx.roleMenu.create({ data: { roleSlug: role.slug, menuId: bySlug[s].id } });
    }
  });

  return NextResponse.json({ ok: true, menuSlugs: validSlugs });
}

// Developer-only: delete a role by id. Its role_menu rows cascade; any users
// holding the role have their role cleared (FK set null).
export async function DELETE(_request, { params }) {
  const gate = await requireDeveloper();
  if (gate.error) return NextResponse.json({ error: gate.error }, { status: gate.status });

  const id = Number(params.id);
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: "Invalid role id." }, { status: 400 });
  }

  const role = await prisma.role.findUnique({ where: { id } });
  if (!role) {
    return NextResponse.json({ error: "Role not found." }, { status: 404 });
  }
  if (PROTECTED_ROLE_SLUGS.includes(role.slug)) {
    return NextResponse.json({ error: `The "${role.slug}" role is protected and cannot be deleted.` }, { status: 400 });
  }

  await prisma.role.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
