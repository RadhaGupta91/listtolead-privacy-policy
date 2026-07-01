"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import SiteNav from "../components/SiteNav";

const PRICE_ID_PRO = process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO;

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [me, setMe] = useState(null);
  const [token, setToken] = useState(null); // { last4, createdAt } | null
  const [newToken, setNewToken] = useState(null); // raw value, shown once
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;
    Promise.all([
      fetch("/api/me").then((r) => r.json()),
      fetch("/api/token/generate").then((r) => r.json()),
    ]).then(([meData, tokenData]) => {
      setMe(meData);
      setToken(tokenData.token || null);
      setLoading(false);
    });
  }, [status]);

  async function handleGenerateToken() {
    setBusy(true);
    const res = await fetch("/api/token/generate", { method: "POST" });
    const data = await res.json();
    setBusy(false);
    if (res.ok) {
      setNewToken(data.token);
      setToken({ last4: data.last4, createdAt: data.createdAt });
    }
  }

  async function handleRevoke() {
    setBusy(true);
    await fetch("/api/token/revoke", { method: "POST" });
    setToken(null);
    setNewToken(null);
    setBusy(false);
  }

  async function handleUpgrade() {
    setBusy(true);
    const res = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ priceId: PRICE_ID_PRO }),
    });
    const data = await res.json();
    setBusy(false);
    if (data.url) window.location.href = data.url;
  }

  async function handleManageBilling() {
    setBusy(true);
    const res = await fetch("/api/stripe/portal", { method: "POST" });
    const data = await res.json();
    setBusy(false);
    if (data.url) window.location.href = data.url;
  }

  if (status === "loading" || loading) {
    return <div className="wide-container"><p className="muted">Loading your dashboard…</p></div>;
  }

  const isPro = me?.plan === "pro" && ["active", "trialing"].includes(me?.subscriptionStatus);

  return (
    <>
      <SiteNav />

      <div className="wide-container">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 14 }}>
          <p className="eyebrow" style={{ margin: 0 }}>Dashboard</p>
          <span className={`plan-pill ${isPro ? "" : "free"}`}>
            <span className="status-dot" style={{ background: isPro ? "var(--accent)" : "#b8b2a2" }} />
            {isPro ? "Pro plan" : "Free plan"}
          </span>
        </div>
        <h1 style={{ marginTop: 8 }}>Welcome{session?.user?.name ? `, ${session.user.name}` : ""}</h1>
        <p className="sub">Manage your subscription and the key that connects your browser extension.</p>

        <div className="grid-2">
          {/* Subscription card */}
          <div className="card">
            <h2>Subscription</h2>
            <p className="muted" style={{ marginBottom: 18 }}>
              {isPro
                ? "Your Pro subscription is active. The extension is enabled on live listings."
                : "You're on the Free plan. Upgrade to enable AI auto-replies on live Marketplace listings."}
            </p>
            {isPro ? (
              <button className="btn-outline" onClick={handleManageBilling} disabled={busy}>
                Manage billing
              </button>
            ) : (
              <button className="btn-accent" onClick={handleUpgrade} disabled={busy}>
                Upgrade to Pro
              </button>
            )}
          </div>

          {/* Token card */}
          <div className="card">
            <h2>Extension key</h2>
            <p className="muted" style={{ marginBottom: 18 }}>
              Generate a key and paste it into the ListToLead AI Chrome extension to connect it to your account.
              You have one key at a time — generating a new one replaces the old.
            </p>
            <button className="btn-accent" onClick={handleGenerateToken} disabled={busy}>
              {token ? "Regenerate key" : "Generate key"}
            </button>

            {newToken && (
              <>
                <div className="token-reveal">{newToken}</div>
                <p className="muted" style={{ marginTop: 8 }}>
                  Copy this now — for your security, it won&apos;t be shown again.
                </p>
              </>
            )}

            {token && (
              <div style={{ marginTop: 22 }}>
                <div className="token-row">
                  <span>•••• {token.last4} <span className="muted">— created {new Date(token.createdAt).toLocaleDateString()}</span></span>
                  <button className="btn-danger-text" onClick={handleRevoke} disabled={busy}>
                    Revoke
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
