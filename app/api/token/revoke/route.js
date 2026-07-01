import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/auth";
import { prisma } from "../../../../lib/prisma";

// Revokes the logged-in user's own extension token by clearing it from their row.
export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { apiTokenHash: null, apiTokenLast4: null, apiTokenCreatedAt: null },
  });

  return NextResponse.json({ revoked: true });
}
