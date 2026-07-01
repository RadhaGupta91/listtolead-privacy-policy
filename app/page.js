import Link from "next/link";
import SiteNav from "./components/SiteNav";

export default function HomePage() {
  return (
    <>
    <SiteNav />
    <div className="container" style={{ maxWidth: 560, textAlign: "center" }}>
      <p className="eyebrow">ListToLead AI</p>
      <h1>AI auto-replies for Facebook Marketplace</h1>
      <p className="sub">
        Never miss a buyer. Instant AI replies, lead scoring, and (coming soon) AI calling —
        all connected to your account with one secure key.
      </p>
      <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
        <Link href="/signup" className="btn btn-accent">Get started free</Link>
        <Link href="/login" className="btn btn-outline">Log in</Link>
      </div>
      <p className="foot-note" style={{ marginTop: 40 }}>
        This is the base app: auth, subscription, and extension key generation.
        Home / Pricing / Blog / Assistance marketing pages plug in around this.
      </p>
    </div>
    </>
  );
}
