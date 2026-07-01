import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { userFromBearer } from "../../../../lib/extensionAuth";

// The extension calls this cross-origin (from the scraping site), so allow CORS.
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type",
};

// Preflight for cross-origin POSTs.
export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

const str = (v) => (v === undefined || v === null || v === "" ? null : String(v));
const intOrNull = (v) => {
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : null;
};

// Extension → server: save a scraped listing for the token's owner.
//   POST /api/extension/listings
//   Authorization: Bearer <token>
//   Body: the scraped listing JSON.
// Re-submitting the same (user, listingId) updates the existing row.
export async function POST(req) {
  const user = await userFromBearer(req);
  if (!user) {
    return NextResponse.json({ error: "Invalid or revoked token" }, { status: 401, headers: CORS });
  }

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400, headers: CORS });
  }

  const listingId = str(body.listingId);
  const description = str(body.description);

  // The extension sends these as snake_case; accept camelCase too for safety.
  const facebookUrl = str(body.facebook_url ?? body.facebookUrl);
  const descriptionForBot = str(body.description_for_bot ?? body.descriptionForBot);
  const customInstructionsForBot = str(body.custom_instructions_for_bot ?? body.customInstructionsForBot);

  // Listing URL is derived from the MLS id (falls back to any provided value).
  const listingUrl = listingId
    ? `https://app.realmmlp.ca/view/listings/TREB-${listingId}?view=agent-full`
    : str(body.listing_url ?? body.listingUrl);

  // Scraped fields refreshed on every save. Listing URL is deterministic, so
  // it's refreshed too.
  const scraped = {
    userId: user.id,
    listingId,
    saleLeaseType: str(body.saleLeaseType),
    address: str(body.address),
    rentalType: str(body.rentalType),
    price: str(body.price),
    beds: str(body.beds),
    baths: str(body.baths),
    sqft: intOrNull(body.sqft),
    laundry: str(body.laundry),
    parking: str(body.parking),
    ac: str(body.ac),
    heatingSource: str(body.heatingSource),
    description,
    images: Array.isArray(body.images) ? body.images : [],
    availableDate: str(body.availableDate),
    listingUrl,
  };

  // On update, only overwrite the user-managed bot/URL fields when the extension
  // explicitly sends them — so dashboard edits aren't clobbered on re-scrape.
  const updateExtras = {};
  if (facebookUrl !== null) updateExtras.facebookUrl = facebookUrl;
  if (descriptionForBot !== null) updateExtras.descriptionForBot = descriptionForBot;
  if (customInstructionsForBot !== null) updateExtras.customInstructionsForBot = customInstructionsForBot;

  // Was this listing already saved for the user? Determines update vs create and
  // the message the extension shows.
  const existing = listingId
    ? await prisma.listing.findUnique({ where: { userId_listingId: { userId: user.id, listingId } } })
    : null;

  let listing;
  if (existing) {
    // Refresh scraped fields; preserve dashboard-managed fields unless resent.
    listing = await prisma.listing.update({
      where: { id: existing.id },
      data: { ...scraped, ...updateExtras },
    });
  } else {
    listing = await prisma.listing.create({
      data: {
        ...scraped,
        facebookUrl,
        // Description for bot comes from the API payload.
        descriptionForBot,
        customInstructionsForBot,
      },
    });
  }

  // Message depends on whether the listing has already been published to
  // Facebook Marketplace (i.e. it has a facebook_url).
  const message = listing.facebookUrl
    ? "Listing already published on facebook marketplace,"
    : "Listing has been saved";

  return NextResponse.json(
    {
      ok: true,
      id: listing.id,
      listingId: listing.listingId,
      created: !existing,
      // snake_case: the extension reads `res.data.facebook_url`.
      facebook_url: listing.facebookUrl,
      facebookUrl: listing.facebookUrl,
      message,
    },
    { status: 200, headers: CORS }
  );
}
