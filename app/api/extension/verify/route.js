import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { hashToken } from "../../../../lib/tokens";

// The endpoint the Chrome extension calls (with the token from the dashboard)
// before it's allowed to run. It confirms:
//   1. The token matches a user (and hasn't been revoked/regenerated)
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

  const user = await prisma.user.findUnique({
    where: { apiTokenHash: hashToken(rawToken) },
    select: { id: true, plan: true, subscriptionStatus: true, active: true },
  });

  // A revoked/regenerated token no longer matches any user row.
  if (!user || user.active === 0) {
    return NextResponse.json({ valid: false, error: "Invalid or revoked token" }, { status: 401 });
  }

  const activeStatuses = ["active", "trialing"];
  const hasActiveSubscription = activeStatuses.includes(user.subscriptionStatus);

  // Adjust this rule to match your actual free-tier policy.
  const allowed = hasActiveSubscription || user.plan === "free";

  return NextResponse.json({
    valid: true,
    allowed,
    plan: user.plan,
    subscriptionStatus: user.subscriptionStatus,
    userId: user.id,
  });
}
