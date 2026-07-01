import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/auth";
import { prisma } from "../../../../lib/prisma";

const str = (v) => (v === undefined || v === null || v === "" ? null : String(v));

// Confirms the listing exists and belongs to the caller. Returns the listing or
// a NextResponse error to short-circuit with.
async function ownedListing(id, userId) {
  const listing = await prisma.listing.findUnique({ where: { id } });
  if (!listing) return { error: NextResponse.json({ error: "Listing not found" }, { status: 404 }) };
  if (listing.userId !== userId) return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  return { listing };
}

// Update the dashboard-editable fields on a listing. The scraped fields are not
// editable here — only the bot/URL fields the user manages.
export async function PUT(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const id = Number(params.id);
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: "Invalid listing id" }, { status: 400 });
  }

  const { error } = await ownedListing(id, session.user.id);
  if (error) return error;

  const body = await req.json().catch(() => ({}));
  const listing = await prisma.listing.update({
    where: { id },
    data: {
      facebookUrl: str(body.facebookUrl),
      listingUrl: str(body.listingUrl),
      descriptionForBot: str(body.descriptionForBot),
      customInstructionsForBot: str(body.customInstructionsForBot),
    },
  });

  return NextResponse.json({ listing });
}

// Delete one of the caller's listings.
export async function DELETE(_req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const id = Number(params.id);
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: "Invalid listing id" }, { status: 400 });
  }

  const { error } = await ownedListing(id, session.user.id);
  if (error) return error;

  await prisma.listing.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
