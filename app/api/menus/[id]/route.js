import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { requireDeveloper } from "../../../../lib/guard";

// Core menus that must never be deleted — the roles/menus admin pages themselves.
const PROTECTED_MENU_SLUGS = ["roles", "menus"];

// Developer-only: delete a menu by id. Its role_menu rows cascade.
export async function DELETE(_request, { params }) {
  const gate = await requireDeveloper();
  if (gate.error) return NextResponse.json({ error: gate.error }, { status: gate.status });

  const id = Number(params.id);
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: "Invalid menu id." }, { status: 400 });
  }

  const menu = await prisma.menu.findUnique({ where: { id } });
  if (!menu) {
    return NextResponse.json({ error: "Menu not found." }, { status: 404 });
  }
  if (PROTECTED_MENU_SLUGS.includes(menu.slug)) {
    return NextResponse.json({ error: `The "${menu.slug}" menu is protected and cannot be deleted.` }, { status: 400 });
  }

  await prisma.menu.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
