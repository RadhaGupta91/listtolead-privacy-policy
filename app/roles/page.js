"use client";

import { useCallback, useEffect, useState } from "react";
import SiteNav from "../components/SiteNav";

const PROTECTED = ["developer", "admin", "client"];

// Developer-only role administration. Shows an access matrix (which role can
// access which app menu) with editable checkboxes. Non-developers get a 403 and
// see the "no access" message.
export default function RolesPage() {
  const [appMenus, setAppMenus] = useState([]);
  const [roles, setRoles] = useState(null); // null = loading
  const [draft, setDraft] = useState({}); // { [roleId]: string[] }
  const [denied, setDenied] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", description: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState("");

  const load = useCallback(() => {
    fetch("/api/roles")
      .then((r) => {
        if (r.status === 401 || r.status === 403) {
          setDenied(true);
          return null;
        }
        return r.json();
      })
      .then((data) => {
        if (!data) return;
        setAppMenus(data.appMenus || []);
        setRoles(data.roles || []);
        setDraft(Object.fromEntries((data.roles || []).map((r) => [r.id, r.menuSlugs])));
      })
      .catch(() => setDenied(true));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function toggle(roleId, slug) {
    setSavedMsg("");
    setDraft((d) => {
      const current = d[roleId] || [];
      const next = current.includes(slug) ? current.filter((s) => s !== slug) : [...current, slug];
      return { ...d, [roleId]: next };
    });
  }

  async function handleSaveAccess() {
    setSaving(true);
    setSavedMsg("");
    // Persist every editable (non-locked) role.
    const editable = (roles || []).filter((r) => !r.locked);
    for (const role of editable) {
      await fetch(`/api/roles/${role.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ menuSlugs: draft[role.id] || [] }),
      });
    }
    setSaving(false);
    setSavedMsg("Access saved. Users will see the change next time their nav loads.");
    load();
  }

  async function handleAdd(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    const res = await fetch("/api/roles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(data.error || "Could not create role.");
      return;
    }
    setForm({ name: "", description: "" });
    setShowForm(false);
    load();
  }

  async function handleDelete(role) {
    if (!confirm(`Delete the "${role.name}" role?`)) return;
    const res = await fetch(`/api/roles/${role.id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(data.error || "Could not delete role.");
      return;
    }
    load();
  }

  return (
    <>
      <SiteNav />
      <div className="wide-container">
        <p className="eyebrow">Administration</p>
        <h1>Roles</h1>
        <p className="sub">Which role can access which app menu. Tick a box to grant a menu; untick to revoke.</p>

        {denied ? (
          <div className="card">
            <p className="muted">You don&apos;t have access to role administration.</p>
          </div>
        ) : (
          <>
            <div style={{ marginBottom: 20 }}>
              <button className="btn btn-accent" onClick={() => { setError(""); setShowForm((s) => !s); }}>
                {showForm ? "Cancel" : "Add role"}
              </button>
            </div>

            {showForm && (
              <div className="card" style={{ marginBottom: 24 }}>
                <h2>Add a role</h2>
                <form onSubmit={handleAdd}>
                  <label htmlFor="role-name">Name</label>
                  <input
                    id="role-name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. Manager"
                    required
                  />
                  <label htmlFor="role-desc">Description</label>
                  <input
                    id="role-desc"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="What this role can access"
                  />
                  {error && <div className="error-box">{error}</div>}
                  <button type="submit" className="btn btn-accent" style={{ marginTop: 16 }} disabled={busy}>
                    {busy ? "Adding…" : "Add role"}
                  </button>
                </form>
              </div>
            )}

            <div className="card">
              <h2>Menu access</h2>
              {roles === null ? (
                <p className="muted">Loading roles…</p>
              ) : (
                <>
                  <div style={{ overflowX: "auto" }}>
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Role</th>
                          {appMenus.map((m) => (
                            <th key={m.slug} style={{ textAlign: "center" }}>{m.name}</th>
                          ))}
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {roles.map((role) => (
                          <tr key={role.id}>
                            <td>
                              {role.name}{" "}
                              <code>{role.slug}</code>
                              {role.locked && <span className="muted"> (all)</span>}
                            </td>
                            {appMenus.map((m) => (
                              <td key={m.slug} style={{ textAlign: "center" }}>
                                <input
                                  type="checkbox"
                                  disabled={role.locked}
                                  checked={(draft[role.id] || []).includes(m.slug)}
                                  onChange={() => toggle(role.id, m.slug)}
                                />
                              </td>
                            ))}
                            <td>
                              {PROTECTED.includes(role.slug) ? (
                                <span className="muted">—</span>
                              ) : (
                                <button className="btn-danger-text" onClick={() => handleDelete(role)}>
                                  Delete
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div style={{ marginTop: 18, display: "flex", alignItems: "center", gap: 14 }}>
                    <button className="btn btn-accent" onClick={handleSaveAccess} disabled={saving}>
                      {saving ? "Saving…" : "Save access"}
                    </button>
                    {savedMsg && <span className="muted">{savedMsg}</span>}
                  </div>
                  <p className="muted" style={{ marginTop: 12 }}>
                    Public menus (Home, Blog, Pricing, Help) are always visible and aren&apos;t listed here.
                    The Developer role always has every menu.
                  </p>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}
