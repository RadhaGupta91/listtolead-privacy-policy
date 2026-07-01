import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { requireDeveloper } from "../../../lib/guard";
import { slugify } from "../../../lib/slug";

// Developer-only: list every menu (public + app), for menu administration.
// `menus` is an ADMIN_ONLY_SLUGS menu, so Admin is intentionally excluded.
export async function GET() {
  const gate = await requireDeveloper();
  if (gate.error) return NextResponse.json({ error: gate.error }, { status: gate.status });

  const menus = await prisma.menu.findMany({ orderBy: { order: "asc" } });

  return NextResponse.json({
    menus: menus.map((m) => ({
      id: m.id,
      name: m.name,
      slug: m.slug,
      url: m.url,
      icon: m.icon,
      menuGroup: m.menuGroup,
      order: m.order,
      status: m.status,
    })),
  });
}

// Developer-only: create a new menu. Body: { name, url?, icon?, menuGroup, order? }.
// The slug is derived from the name and must be unique.
export async function POST(req) {
  const gate = await requireDeveloper();
  if (gate.error) return NextResponse.json({ error: gate.error }, { status: gate.status });

  const { name, url, icon, menuGroup, order } = await req.json();
  if (!name || !name.trim()) {
    return NextResponse.json({ error: "Name is required." }, { status: 400 });
  }
  if (!["public", "app"].includes(menuGroup)) {
    return NextResponse.json({ error: 'Group must be "public" or "app".' }, { status: 400 });
  }

  const slug = slugify(name);
  if (!slug) {
    return NextResponse.json({ error: "Name must contain letters or numbers." }, { status: 400 });
  }

  const existing = await prisma.menu.findUnique({ where: { slug } });
  if (existing) {
    return NextResponse.json({ error: `A menu with slug "${slug}" already exists.` }, { status: 409 });
  }

  // Default order to the end of the list when not supplied.
  let nextOrder = Number(order);
  if (!Number.isFinite(nextOrder) || nextOrder <= 0) {
    const last = await prisma.menu.findFirst({ orderBy: { order: "desc" }, select: { order: true } });
    nextOrder = (last?.order || 0) + 1;
  }

  const finalUrl = url?.trim() || `/${slug}`;
  const menu = await prisma.menu.create({
    data: {
      name: name.trim(),
      slug,
      url: finalUrl,
      icon: icon?.trim() || "fa fa-circle",
      menuGroup,
      order: nextOrder,
      status: 1,
      // Only external links open in a new tab.
      newWindow: /^https?:\/\//.test(finalUrl) ? 1 : 0,
    },
  });

  return NextResponse.json(
    { menu: { id: menu.id, name: menu.name, slug: menu.slug, menuGroup: menu.menuGroup } },
    { status: 201 }
  );
}
