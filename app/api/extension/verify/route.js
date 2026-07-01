import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { hashToken } from "../../../../lib/tokens";

// This is the endpoint the Chrome extension calls (with the token from the
// dashboard) before it's allowed to run. It confirms:
//   1. The token is real and not revoked
//   2. The owning user has an active subscription (or is on a usable free tier)
//
// Extension usage:
//   fetch("https://yourdomain.com/api/extension/verify", {
//     headers: { Authorization: `Bearer ${token}` }
//   })
export async function GET(req) {
  const authHeader = req.headers.get("authorization") || "";
  const rawToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!rawToken) {
    return NextResponse.json({ valid: false, error: "Missing token" }, { status: 401 });
  }

  const tokenHash = hashToken(rawToken);

  const token = await prisma.apiToken.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  if (!token || token.revokedAt) {
    return NextResponse.json({ valid: false, error: "Invalid or revoked token" }, { status: 401 });
  }

  const user = token.user;
  const activeStatuses = ["active", "trialing"];
  const hasActiveSubscription = activeStatuses.includes(user.subscriptionStatus);

  // Adjust this rule to match your actual free-tier policy.
  const allowed = hasActiveSubscription || user.plan === "free";

  // Fire-and-forget last-used timestamp update (non-blocking for the response).
  prisma.apiToken.update({
    where: { id: token.id },
    data: { lastUsedAt: new Date() },
  }).catch(() => {});

  return NextResponse.json({
    valid: true,
    allowed,
    plan: user.plan,
    subscriptionStatus: user.subscriptionStatus,
    userId: user.id,
  });
}
