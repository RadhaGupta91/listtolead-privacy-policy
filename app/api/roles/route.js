import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { requireDeveloper } from "../../../lib/guard";
import { slugify } from "../../../lib/slug";

// Developer-only: list roles plus the app-menu columns, so the UI can render an
// access matrix (which role can access which menu).
// `roles` is an ADMIN_ONLY_SLUGS menu, so Admin is intentionally excluded.
export async function GET() {
  const gate = await requireDeveloper();
  if (gate.error) return NextResponse.json({ error: gate.error }, { status: gate.status });

  const appMenus = await prisma.menu.findMany({
    where: { menuGroup: "app" },
    orderBy: { order: "asc" },
    select: { slug: true, name: true },
  });
  const allSlugs = appMenus.map((m) => m.slug);

  const roles = await prisma.role.findMany({
    orderBy: { id: "asc" },
    include: { roleMenus: { include: { menu: { select: { slug: true } } } } },
  });

  return NextResponse.json({
    appMenus,
    roles: roles.map((r) => ({
      id: r.id,
      name: r.name,
      slug: r.slug,
      description: r.description,
      // Developer always sees every app menu regardless of role_menu rows,
      // so its access is shown as all-granted and locked.
      locked: r.slug === "developer",
      menuSlugs: r.slug === "developer" ? allSlugs : r.roleMenus.map((rm) => rm.menu.slug),
    })),
  });
}

// Developer-only: create a new role. Body: { name, description? }.
// The slug is derived from the name and must be unique.
export async function POST(req) {
  const gate = await requireDeveloper();
  if (gate.error) return NextResponse.json({ error: gate.error }, { status: gate.status });

  const { name, description } = await req.json();
  if (!name || !name.trim()) {
    return NextResponse.json({ error: "Name is required." }, { status: 400 });
  }

  const slug = slugify(name);
  if (!slug) {
    return NextResponse.json({ error: "Name must contain letters or numbers." }, { status: 400 });
  }

  const existing = await prisma.role.findUnique({ where: { slug } });
  if (existing) {
    return NextResponse.json({ error: `A role with slug "${slug}" already exists.` }, { status: 409 });
  }

  const role = await prisma.role.create({
    data: { name: name.trim(), slug, description: description?.trim() || null, status: 1 },
  });

  return NextResponse.json({ role: { id: role.id, name: role.name, slug: role.slug } }, { status: 201 });
}
