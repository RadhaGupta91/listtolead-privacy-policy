"use client";

import { useCallback, useEffect, useState } from "react";
import SiteNav from "../components/SiteNav";

const PROTECTED = ["roles", "menus"];

// Developer-only menu administration. Non-developers get a 403 from /api/menus
// and see the "no access" message rather than the table.
export default function MenusPage() {
  const [menus, setMenus] = useState(null); // null = loading
  const [denied, setDenied] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", menuGroup: "app", url: "", icon: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    fetch("/api/menus")
      .then((r) => {
        if (r.status === 401 || r.status === 403) {
          setDenied(true);
          return null;
        }
        return r.json();
      })
      .then((data) => data && setMenus(data.menus || []))
      .catch(() => setDenied(true));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleAdd(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    const res = await fetch("/api/menus", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(data.error || "Could not create menu.");
      return;
    }
    setForm({ name: "", menuGroup: "app", url: "", icon: "" });
    setShowForm(false);
    load();
  }

  async function handleDelete(menu) {
    if (!confirm(`Delete the "${menu.name}" menu?`)) return;
    const res = await fetch(`/api/menus/${menu.id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(data.error || "Could not delete menu.");
      return;
    }
    load();
  }

  return (
    <>
      <SiteNav />
      <div className="wide-container">
        <p className="eyebrow">Administration</p>
        <h1>Menus</h1>
        <p className="sub">Every navigation menu — public menus are always shown; app menus are role-gated.</p>

        {denied ? (
          <div className="card">
            <p className="muted">You don&apos;t have access to menu administration.</p>
          </div>
        ) : (
          <>
            <div style={{ marginBottom: 20 }}>
              <button className="btn btn-accent" onClick={() => { setError(""); setShowForm((s) => !s); }}>
                {showForm ? "Cancel" : "Add menu"}
              </button>
            </div>

            {showForm && (
              <div className="card" style={{ marginBottom: 24 }}>
                <h2>Add a menu</h2>
                <form onSubmit={handleAdd}>
                  <label htmlFor="menu-name">Name</label>
                  <input
                    id="menu-name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. Reports"
                    required
                  />
                  <label htmlFor="menu-group">Group</label>
                  <select
                    id="menu-group"
                    value={form.menuGroup}
                    onChange={(e) => setForm({ ...form, menuGroup: e.target.value })}
                  >
                    <option value="app">app (shown after login, role-gated)</option>
                    <option value="public">public (always shown)</option>
                  </select>
                  <label htmlFor="menu-url">URL <span className="muted">(optional — defaults to /slug)</span></label>
                  <input
                    id="menu-url"
                    value={form.url}
                    onChange={(e) => setForm({ ...form, url: e.target.value })}
                    placeholder="/reports"
                  />
                  <label htmlFor="menu-icon">Icon <span className="muted">(optional Font Awesome class)</span></label>
                  <input
                    id="menu-icon"
                    value={form.icon}
                    onChange={(e) => setForm({ ...form, icon: e.target.value })}
                    placeholder="fa fa-chart-bar"
                  />
                  {error && <div className="error-box">{error}</div>}
                  <button type="submit" className="btn btn-accent" style={{ marginTop: 16 }} disabled={busy}>
                    {busy ? "Adding…" : "Add menu"}
                  </button>
                </form>
              </div>
            )}

            <div className="card">
              {menus === null ? (
                <p className="muted">Loading menus…</p>
              ) : (
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Order</th>
                      <th>Name</th>
                      <th>Slug</th>
                      <th>URL</th>
                      <th>Group</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {menus.map((m) => (
                      <tr key={m.id}>
                        <td>{m.order}</td>
                        <td><i className={m.icon} style={{ marginRight: 8 }} />{m.name}</td>
                        <td><code>{m.slug}</code></td>
                        <td className="muted">{m.url}</td>
                        <td>{m.menuGroup}</td>
                        <td>
                          {PROTECTED.includes(m.slug) ? (
                            <span className="muted">—</span>
                          ) : (
                            <button className="btn-danger-text" onClick={() => handleDelete(m)}>
                              Delete
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}
