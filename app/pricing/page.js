import Link from "next/link";
import SiteNav from "../components/SiteNav";
import { prisma } from "../../lib/prisma";
import PricingCards from "./PricingCards";

export const metadata = {
  title: "Pricing · ListToLead AI",
  description: "Simple pricing for AI auto-replies and lead scoring on Facebook Marketplace.",
};

// Public pricing page — reads plans (managed by admins at /plans) from the DB.
export default async function PricingPage() {
  const rows = await prisma.plan.findMany({
    orderBy: { id: "asc" },
    include: { features: { orderBy: { order: "asc" } } },
  });

  // Pass only plain, serializable fields to the client component.
  const plans = rows.map((p) => ({
    id: p.id,
    name: p.name,
    priceMonthly: p.priceMonthly,
    priceYearly: p.priceYearly,
    highlight: p.highlight,
    blurb: p.blurb,
    cta: p.cta,
    href: p.href,
    features: p.features.map((f) => ({ id: f.id, name: f.name })),
  }));

  return (
    <>
      <SiteNav />
      <div className="wide-container">
        <p className="eyebrow">Pricing</p>
        <h1>Simple pricing that scales with you</h1>
        <p className="sub">Start free. Upgrade when you&apos;re ready to automate. Cancel anytime.</p>

        {plans.length === 0 ? (
          <div className="card"><p className="muted">No plans are available right now. Please check back soon.</p></div>
        ) : (
          <PricingCards plans={plans} />
        )}

        <p className="foot-note">Questions about a plan? <Link href="/help">Talk to support</Link>.</p>
      </div>
    </>
  );
}
