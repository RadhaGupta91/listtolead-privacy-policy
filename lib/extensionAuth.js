import { prisma } from "./prisma";
import { hashToken } from "./tokens";

// Resolves the user behind an extension request's `Authorization: Bearer <token>`
// header. Returns the user row, or null if the token is missing, invalid,
// revoked/regenerated, or the account is inactive.
export async function userFromBearer(req) {
  const authHeader = req.headers.get("authorization") || "";
  const rawToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!rawToken) return null;

  const user = await prisma.user.findUnique({
    where: { apiTokenHash: hashToken(rawToken) },
    select: { id: true, active: true, plan: true, subscriptionStatus: true },
  });

  if (!user || user.active === 0) return null;
  return user;
}
