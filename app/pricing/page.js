import Link from "next/link";
import SiteNav from "../components/SiteNav";

export const metadata = {
  title: "Pricing · FB AutoReply AI",
  description: "Simple pricing for AI auto-replies and lead scoring on Facebook Marketplace.",
};

const PLANS = [
  {
    name: "Free",
    price: "$0",
    cadence: "forever",
    highlight: false,
    blurb: "Everything you need to try it out.",
    features: [
      "Connect your account with one secure key",
      "Manual replies with AI suggestions",
      "Basic lead scoring",
      "1 connected device",
    ],
    cta: "Get started free",
    href: "/signup",
  },
  {
    name: "Pro",
    price: "$19",
    cadence: "per month",
    highlight: true,
    blurb: "Automated replies on live listings.",
    features: [
      "Automatic AI replies on live listings",
      "Advanced lead scoring & prioritization",
      "AI calling (coming soon)",
      "Unlimited devices",
      "Priority support",
    ],
    cta: "Upgrade to Pro",
    href: "/signup",
  },
];

export default function PricingPage() {
  return (
    <>
      <SiteNav />
      <div className="wide-container">
        <p className="eyebrow">Pricing</p>
        <h1>Simple pricing that scales with you</h1>
        <p className="sub">Start free. Upgrade when you&apos;re ready to automate. Cancel anytime.</p>

        <div className="grid-2">
          {PLANS.map((plan) => (
            <div key={plan.name} className={`card price-card${plan.highlight ? " featured" : ""}`}>
              {plan.highlight && <span className="price-badge">Most popular</span>}
              <h2>{plan.name}</h2>
              <p className="price-amount">
                {plan.price} <span className="muted">/ {plan.cadence}</span>
              </p>
              <p className="muted" style={{ marginBottom: 18 }}>{plan.blurb}</p>
              <ul className="price-features">
                {plan.features.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
              <Link
                href={plan.href}
                className={`btn ${plan.highlight ? "btn-accent" : "btn-outline"}`}
                style={{ display: "block", textAlign: "center", marginTop: 20 }}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>

        <p className="foot-note">Questions about a plan? <Link href="/help">Talk to support</Link>.</p>
      </div>
    </>
  );
}
