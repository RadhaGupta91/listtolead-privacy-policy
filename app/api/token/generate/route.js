import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/auth";
import { prisma } from "../../../../lib/prisma";
import { generateRawToken, hashToken, last4Of } from "../../../../lib/tokens";

// Generates a new extension token for the logged-in user.
// The raw token is returned ONCE — only its hash is stored in the DB.
export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const rawToken = generateRawToken();

  const token = await prisma.apiToken.create({
    data: {
      userId: session.user.id,
      tokenHash: hashToken(rawToken),
      last4: last4Of(rawToken),
    },
  });

  return NextResponse.json({
    id: token.id,
    token: rawToken, // shown once — the UI must warn the user to copy it now
    createdAt: token.createdAt,
  });
}

// Lists (non-revoked) tokens for the dashboard, without exposing raw values.
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const tokens = await prisma.apiToken.findMany({
    where: { userId: session.user.id, revokedAt: null },
    orderBy: { createdAt: "desc" },
    select: { id: true, last4: true, createdAt: true, lastUsedAt: true },
  });

  return NextResponse.json({ tokens });
}
