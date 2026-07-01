"use client";

import Link from "next/link";
import { useState } from "react";

// Client-side pricing cards with a Monthly/Yearly billing toggle. Both prices
// are always visible — the toggle picks which one is featured, and the other is
// shown beneath it.
export default function PricingCards({ plans }) {
  const [period, setPeriod] = useState("monthly"); // "monthly" | "yearly"

  return (
    <>
      <div className="billing-toggle">
        <button
          type="button"
          className={period === "monthly" ? "active" : ""}
          onClick={() => setPeriod("monthly")}
        >
          Monthly
        </button>
        <button
          type="button"
          className={period === "yearly" ? "active" : ""}
          onClick={() => setPeriod("yearly")}
        >
          Yearly
        </button>
      </div>

      <div className="grid-2">
        {plans.map((plan) => {
          const isMonthly = period === "monthly";
          const price = isMonthly ? plan.priceMonthly : plan.priceYearly;
          const cadence = isMonthly ? "month" : "year";
          const alt = isMonthly
            ? `${plan.priceYearly} / year`
            : `${plan.priceMonthly} / month`;
          return (
            <div key={plan.id} className={`card price-card${plan.highlight ? " featured" : ""}`}>
              {plan.highlight && <span className="price-badge">Most popular</span>}
              <h2>{plan.name}</h2>
              <p className="price-amount">
                {price} <span className="muted">/ {cadence}</span>
              </p>
              <p className="muted" style={{ marginTop: -2 }}>or {alt}</p>
              <p className="muted" style={{ margin: "12px 0 18px" }}>{plan.blurb}</p>
              <ul className="price-features">
                {plan.features.map((f) => (
                  <li key={f.id}>{f.name}</li>
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
          );
        })}
      </div>
    </>
  );
}
