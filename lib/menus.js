import { prisma } from "./prisma";

// Roles that are treated as administrators (can revoke tokens, see admin menus).
export const ADMIN_ROLES = ["admin", "developer"];

export function isAdminRole(roleSlug) {
  return ADMIN_ROLES.includes(roleSlug);
}

// The public marketing menus — always visible before AND after login
// (shown on the public site view).
export async function resolvePublicMenus() {
  return prisma.menu.findMany({
    where: { menuGroup: "public", status: 1 },
    orderBy: { order: "asc" },
  });
}

// The app menus a logged-in user may access, by role.
//   - Anonymous              → none.
//   - Logged in (developer)  → ALL app menus.
//   - Logged in (other role) → app menus granted via role_menu.
export async function resolveAppMenusForUser(userId) {
  if (!userId) return [];

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  // Developer sees every app menu, regardless of role_menu rows.
  if (user?.role === "developer") {
    return prisma.menu.findMany({
      where: { menuGroup: "app", status: 1 },
      orderBy: { order: "asc" },
    });
  }

  // Other roles see only the app menus granted to them.
  if (user?.role) {
    const rows = await prisma.roleMenu.findMany({
      where: { roleSlug: user.role, menu: { status: 1 } },
      include: { menu: true },
    });
    return rows.map((r) => r.menu).sort((a, b) => a.order - b.order);
  }

  // Logged in but no role assigned → no app menus.
  return [];
}
