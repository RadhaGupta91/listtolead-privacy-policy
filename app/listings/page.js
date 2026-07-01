"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import SiteNav from "../components/SiteNav";

const EDITABLE = ["facebookUrl", "listingUrl", "descriptionForBot", "customInstructionsForBot"];

// The user's saved listings (pushed here by the browser extension). The scraped
// detail is read-only; the Facebook/listing URLs and bot instructions are
// editable here in the dashboard.
export default function ListingsPage() {
  const { status } = useSession();
  const router = useRouter();

  const [listings, setListings] = useState(null); // null = loading
  const [edits, setEdits] = useState({}); // { [id]: { ...editable fields } }
  const [savingId, setSavingId] = useState(null);
  const [savedId, setSavedId] = useState(null);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  const load = useCallback(() => {
    fetch("/api/listings")
      .then((r) => (r.ok ? r.json() : { listings: [] }))
      .then((data) => {
        const list = data.listings || [];
        setListings(list);
        setEdits(
          Object.fromEntries(
            list.map((l) => [
              l.id,
              {
                facebookUrl: l.facebookUrl || "",
                listingUrl: l.listingUrl || "",
                descriptionForBot: l.descriptionForBot || "",
                customInstructionsForBot: l.customInstructionsForBot || "",
              },
            ])
          )
        );
      })
      .catch(() => setListings([]));
  }, []);

  useEffect(() => {
    if (status === "authenticated") load();
  }, [status, load]);

  function setField(id, field, value) {
    setSavedId(null);
    setEdits((e) => ({ ...e, [id]: { ...e[id], [field]: value } }));
  }

  async function handleSave(id) {
    setSavingId(id);
    const res = await fetch(`/api/listings/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(edits[id]),
    });
    setSavingId(null);
    if (res.ok) {
      setSavedId(id);
      // Keep the listing list in sync with what was saved.
      const { listing } = await res.json();
      setListings((prev) => prev.map((l) => (l.id === id ? { ...l, ...listing } : l)));
    } else {
      alert("Could not save changes.");
    }
  }

  async function handleDelete(listing) {
    if (!confirm(`Delete the listing at "${listing.address || listing.listingId}"?`)) return;
    const res = await fetch(`/api/listings/${listing.id}`, { method: "DELETE" });
    if (!res.ok) {
      alert("Could not delete listing.");
      return;
    }
    load();
  }

  if (status === "loading" || listings === null) {
    return (
      <>
        <SiteNav />
        <div className="wide-container"><p className="muted">Loading your listings…</p></div>
      </>
    );
  }

  return (
    <>
      <SiteNav />
      <div className="wide-container">
        <p className="eyebrow">Listings</p>
        <h1>Your listings</h1>
        <p className="sub">Listings saved from the browser extension. Edit the Facebook link, listing link, and bot instructions below.</p>

        {listings.length === 0 ? (
          <div className="card">
            <p className="muted">No listings yet. Use the ListToLead AI extension on a listing to save it here.</p>
          </div>
        ) : (
          listings.map((l) => (
            <div key={l.id} className="card" style={{ marginBottom: 20 }}>
              <div style={{ display: "flex", gap: 16 }}>
                {Array.isArray(l.images) && l.images[0] && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={l.images[0]}
                    alt={l.address || "Listing"}
                    style={{ width: 140, height: 100, objectFit: "cover", borderRadius: 8, flexShrink: 0 }}
                  />
                )}
                <div style={{ flex: 1 }}>
                  <h2 style={{ marginBottom: 4 }}>{l.address || l.listingId}</h2>
                  <p className="muted" style={{ margin: 0 }}>
                    {l.saleLeaseType === "lease" ? "For lease" : l.saleLeaseType === "sale" ? "For sale" : l.saleLeaseType}
                    {l.rentalType ? ` · ${l.rentalType}` : ""}
                  </p>
                  <p style={{ margin: "6px 0 0", fontWeight: 600 }}>
                    {l.price ? `$${l.price}` : "—"}
                    <span className="muted" style={{ fontWeight: 400 }}>
                      {"  "}· {l.beds || "?"} bed · {l.baths || "?"} bath{l.sqft ? ` · ${l.sqft} sqft` : ""}
                      {l.availableDate ? ` · avail ${l.availableDate}` : ""}
                    </span>
                  </p>
                  {l.listingId && <p className="muted" style={{ margin: "4px 0 0", fontSize: 12 }}>MLS {l.listingId}</p>}
                </div>
              </div>

              <div style={{ marginTop: 18, borderTop: "1px solid var(--line)", paddingTop: 16 }}>
                <label>Facebook URL</label>
                <input
                  value={edits[l.id]?.facebookUrl || ""}
                  onChange={(e) => setField(l.id, "facebookUrl", e.target.value)}
                  placeholder="https://facebook.com/marketplace/item/…"
                />

                <label>Listing URL</label>
                <input
                  value={edits[l.id]?.listingUrl || ""}
                  onChange={(e) => setField(l.id, "listingUrl", e.target.value)}
                  placeholder="https://…"
                />

                <label>Description for bot</label>
                <textarea
                  rows={3}
                  value={edits[l.id]?.descriptionForBot || ""}
                  onChange={(e) => setField(l.id, "descriptionForBot", e.target.value)}
                  placeholder="What the bot should say about this listing"
                />

                <label>Custom instructions for bot</label>
                <textarea
                  rows={3}
                  value={edits[l.id]?.customInstructionsForBot || ""}
                  onChange={(e) => setField(l.id, "customInstructionsForBot", e.target.value)}
                  placeholder="How the bot should handle replies for this listing"
                />

                <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 12 }}>
                  <button className="btn btn-accent" onClick={() => handleSave(l.id)} disabled={savingId === l.id}>
                    {savingId === l.id ? "Saving…" : "Save"}
                  </button>
                  <button className="btn-danger-text" onClick={() => handleDelete(l)}>Delete</button>
                  {savedId === l.id && <span className="muted">Saved.</span>}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
}
