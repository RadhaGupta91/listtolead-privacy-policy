"use client";

import { useCallback, useEffect, useState } from "react";
import SiteNav from "../components/SiteNav";

const EMPTY = { name: "", priceMonthly: "", priceYearly: "", highlight: false, blurb: "", cta: "", href: "", features: [""] };

// Developer/Admin only plan administration. Non-admins get a 403 from /api/plans
// and see the "no access" message.
export default function PlansPage() {
  const [plans, setPlans] = useState(null); // null = loading
  const [denied, setDenied] = useState(false);
  const [editingId, setEditingId] = useState(null); // null = closed, "new" = create, number = edit
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    fetch("/api/plans")
      .then((r) => {
        if (r.status === 401 || r.status === 403) {
          setDenied(true);
          return null;
        }
        return r.json();
      })
      .then((data) => data && setPlans(data.plans || []))
      .catch(() => setDenied(true));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function openNew() {
    setError("");
    setForm(EMPTY);
    setEditingId("new");
  }

  function openEdit(plan) {
    setError("");
    setForm({
      name: plan.name,
      priceMonthly: plan.priceMonthly,
      priceYearly: plan.priceYearly,
      highlight: plan.highlight,
      blurb: plan.blurb || "",
      cta: plan.cta,
      href: plan.href,
      features: plan.features.length ? plan.features.map((f) => f.name) : [""],
    });
    setEditingId(plan.id);
  }

  function closeForm() {
    setEditingId(null);
    setForm(EMPTY);
    setError("");
  }

  function setFeature(i, value) {
    setForm((f) => ({ ...f, features: f.features.map((x, idx) => (idx === i ? value : x)) }));
  }
  function addFeature() {
    setForm((f) => ({ ...f, features: [...f.features, ""] }));
  }
  function removeFeature(i) {
    setForm((f) => ({ ...f, features: f.features.filter((_, idx) => idx !== i) }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    const isNew = editingId === "new";
    const res = await fetch(isNew ? "/api/plans" : `/api/plans/${editingId}`, {
      method: isNew ? "POST" : "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, features: form.features.map((s) => s.trim()).filter(Boolean) }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(data.error || "Could not save plan.");
      return;
    }
    closeForm();
    load();
  }

  async function handleDelete(plan) {
    if (!confirm(`Delete the "${plan.name}" plan?`)) return;
    const res = await fetch(`/api/plans/${plan.id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(data.error || "Could not delete plan.");
      return;
    }
    load();
  }

  return (
    <>
      <SiteNav />
      <div className="wide-container">
        <p className="eyebrow">Administration</p>
        <h1>Plans</h1>
        <p className="sub">Manage the pricing plans shown on the pricing page.</p>

        {denied ? (
          <div className="card">
            <p className="muted">You don&apos;t have access to plan administration.</p>
          </div>
        ) : (
          <>
            <div style={{ marginBottom: 20 }}>
              <button className="btn btn-accent" onClick={editingId === "new" ? closeForm : openNew}>
                {editingId === "new" ? "Cancel" : "Add plan"}
              </button>
            </div>

            {editingId !== null && (
              <div className="card" style={{ marginBottom: 24 }}>
                <h2>{editingId === "new" ? "Add a plan" : "Edit plan"}</h2>
                <form onSubmit={handleSubmit}>
                  <label>Name</label>
                  <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Pro" required />

                  <label>Price / month</label>
                  <input value={form.priceMonthly} onChange={(e) => setForm({ ...form, priceMonthly: e.target.value })} placeholder="$9.99" required />

                  <label>Price / year</label>
                  <input value={form.priceYearly} onChange={(e) => setForm({ ...form, priceYearly: e.target.value })} placeholder="$99" required />

                  <label>Blurb</label>
                  <input value={form.blurb} onChange={(e) => setForm({ ...form, blurb: e.target.value })} placeholder="Short description" />

                  <label>CTA label</label>
                  <input value={form.cta} onChange={(e) => setForm({ ...form, cta: e.target.value })} placeholder="Upgrade to Pro" required />

                  <label>CTA link</label>
                  <input value={form.href} onChange={(e) => setForm({ ...form, href: e.target.value })} placeholder="/signup" required />

                  <label style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12 }}>
                    <input
                      type="checkbox"
                      checked={form.highlight}
                      onChange={(e) => setForm({ ...form, highlight: e.target.checked })}
                      style={{ width: "auto" }}
                    />
                    Highlight as &quot;Most popular&quot;
                  </label>

                  <label style={{ marginTop: 12 }}>Features</label>
                  {form.features.map((feat, i) => (
                    <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                      <input value={feat} onChange={(e) => setFeature(i, e.target.value)} placeholder={`Feature ${i + 1}`} />
                      <button type="button" className="btn-danger-text" onClick={() => removeFeature(i)}>Remove</button>
                    </div>
                  ))}
                  <button type="button" className="btn btn-outline" onClick={addFeature}>+ Add feature</button>

                  {error && <div className="error-box" style={{ marginTop: 16 }}>{error}</div>}
                  <div style={{ marginTop: 16, display: "flex", gap: 10 }}>
                    <button type="submit" className="btn btn-accent" disabled={busy}>
                      {busy ? "Saving…" : editingId === "new" ? "Add plan" : "Save changes"}
                    </button>
                    <button type="button" className="btn btn-outline" onClick={closeForm}>Cancel</button>
                  </div>
                </form>
              </div>
            )}

            {plans === null ? (
              <p className="muted">Loading plans…</p>
            ) : plans.length === 0 ? (
              <div className="card"><p className="muted">No plans yet. Click &quot;Add plan&quot; to create one.</p></div>
            ) : (
              <div className="grid-2">
                {plans.map((plan) => (
                  <div key={plan.id} className={`card price-card${plan.highlight ? " featured" : ""}`}>
                    {plan.highlight && <span className="price-badge">Most popular</span>}
                    <h2>{plan.name}</h2>
                    <p className="price-amount">{plan.priceMonthly} <span className="muted">/ month</span></p>
                    <p className="muted" style={{ marginTop: -8, marginBottom: 8 }}>{plan.priceYearly} / year</p>
                    <p className="muted" style={{ marginBottom: 18 }}>{plan.blurb}</p>
                    <ul className="price-features">
                      {plan.features.map((f) => <li key={f.id}>{f.name}</li>)}
                    </ul>
                    <div style={{ marginTop: 20, display: "flex", gap: 12 }}>
                      <button className="btn btn-outline" onClick={() => openEdit(plan)}>Edit</button>
                      <button className="btn-danger-text" onClick={() => handleDelete(plan)}>Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
