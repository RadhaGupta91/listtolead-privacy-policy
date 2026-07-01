import { getServerSession } from "next-auth";
import { authOptions } from "./auth";
import { prisma } from "./prisma";
import { isAdminRole } from "./menus";

// Guards developer-only routes (roles & menus administration).
// Returns { userId } when the caller is a developer, otherwise
// { error, status } describing why access was refused.
export async function requireDeveloper() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: "Not authenticated", status: 401 };

  const actor = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  if (actor?.role !== "developer") return { error: "Forbidden", status: 403 };

  return { userId: session.user.id };
}

// Guards admin-or-developer routes (e.g. plan administration).
// Returns { userId } for admins/developers, else { error, status }.
export async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: "Not authenticated", status: 401 };

  const actor = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  if (!isAdminRole(actor?.role)) return { error: "Forbidden", status: 403 };

  return { userId: session.user.id };
}
