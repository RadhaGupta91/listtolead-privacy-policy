// Normalizes an incoming plan request body into DB fields + a clean feature list.
// Shared by POST /api/plans and PUT /api/plans/[id].
export function parsePlan(body) {
  const name = (body.name || "").trim();
  const priceMonthly = (body.priceMonthly || "").trim();
  const priceYearly = (body.priceYearly || "").trim();
  const cta = (body.cta || "").trim();
  const href = (body.href || "").trim();
  const blurb = (body.blurb || "").trim() || null;
  const highlight = body.highlight === true || body.highlight === "true";

  const features = Array.isArray(body.features)
    ? body.features
        .map((f) => (typeof f === "string" ? f : f?.name || ""))
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

  const missing = [];
  if (!name) missing.push("name");
  if (!priceMonthly) missing.push("priceMonthly");
  if (!priceYearly) missing.push("priceYearly");
  if (!cta) missing.push("cta");
  if (!href) missing.push("href");

  return { fields: { name, priceMonthly, priceYearly, cta, href, blurb, highlight }, features, missing };
}
