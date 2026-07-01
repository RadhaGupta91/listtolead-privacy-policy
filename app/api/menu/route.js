import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth";
import { resolvePublicMenus, resolveAppMenusForUser } from "../../../lib/menus";

// Returns both menu sets so the nav can switch by view:
//   - publicMenus → shown on the public site view (Home, Blog, Pricing, Help).
//   - appMenus    → the app menus granted by the logged-in user's role.
// The nav shows public menus on public pages and app menus on app pages.
export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id ?? null;

  const [publicMenus, appMenus] = await Promise.all([
    resolvePublicMenus(),
    resolveAppMenusForUser(userId),
  ]);

  const shape = (m) => ({
    id: m.id,
    name: m.name,
    slug: m.slug,
    url: m.url,
    icon: m.icon,
    menuGroup: m.menuGroup,
    newWindow: m.newWindow,
  });

  return NextResponse.json({
    publicMenus: publicMenus.map(shape),
    appMenus: appMenus.map(shape),
  });
}
