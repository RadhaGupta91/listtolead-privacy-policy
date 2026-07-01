import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/auth";
import { prisma } from "../../../../lib/prisma";

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { tokenId } = await req.json();
  if (!tokenId) {
    return NextResponse.json({ error: "tokenId is required" }, { status: 400 });
  }

  // Ownership check — a user can only revoke their own tokens.
  const token = await prisma.apiToken.findFirst({
    where: { id: tokenId, userId: session.user.id },
  });
  if (!token) {
    return NextResponse.json({ error: "Token not found" }, { status: 404 });
  }

  await prisma.apiToken.update({
    where: { id: tokenId },
    data: { revokedAt: new Date() },
  });

  return NextResponse.json({ revoked: true });
}
