import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/auth";
import { prisma } from "../../../../lib/prisma";
import { generateRawToken, hashToken, last4Of } from "../../../../lib/tokens";

// Generates (or regenerates) the single extension token for the logged-in user.
// The raw token is returned ONCE — only its hash is stored on the user row.
// Generating again replaces any existing token.
export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const rawToken = generateRawToken();
  const createdAt = new Date();

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      apiTokenHash: hashToken(rawToken),
      apiTokenLast4: last4Of(rawToken),
      apiTokenCreatedAt: createdAt,
    },
  });

  return NextResponse.json({
    token: rawToken, // shown once — the UI must warn the user to copy it now
    last4: last4Of(rawToken),
    createdAt,
  });
}

// Returns metadata about the user's current token (never the raw value).
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { apiTokenHash: true, apiTokenLast4: true, apiTokenCreatedAt: true },
  });

  const token = user?.apiTokenHash
    ? { last4: user.apiTokenLast4, createdAt: user.apiTokenCreatedAt }
    : null;

  return NextResponse.json({ token });
}
