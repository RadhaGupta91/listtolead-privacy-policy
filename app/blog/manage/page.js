"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const EMPTY = { title: "", slug: "", tag: "", excerpt: "", description: "", published: true };

export default function ManageBlogPage() {
  const { status } = useSession();
  const router = useRouter();

  const [posts, setPosts] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;
    loadPosts();
  }, [status]);

  async function loadPosts() {
    const data = await fetch("/api/blog").then((r) => r.json());
    setPosts(data.posts || []);
    setLoading(false);
  }

  function setField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function startNew() {
    setEditingId(null);
    setForm(EMPTY);
    setError("");
  }

  function startEdit(post) {
    setEditingId(post.id);
    setForm({
      title: post.title || "",
      slug: post.slug || "",
      tag: post.tag || "",
      excerpt: post.excerpt || "",
      description: post.description || "",
      published: post.published,
    });
    setError("");
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);

    const url = editingId ? `/api/blog/${editingId}` : "/api/blog";
    const method = editingId ? "PUT" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setBusy(false);

    if (!res.ok) {
      setError(data.error || "Something went wrong.");
      return;
    }
    startNew();
    loadPosts();
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this post? This can't be undone.")) return;
    setBusy(true);
    await fetch(`/api/blog/${id}`, { method: "DELETE" });
    if (editingId === id) startNew();
    setBusy(false);
    loadPosts();
  }

  if (status === "loading" || loading) {
    return <div className="wide-container"><p className="muted">Loading…</p></div>;
  }

  return (
    <>
      <div className="topbar">
        <div className="brand">ListToLead AI</div>
        <Link href="/blog" className="btn-outline">View blog</Link>
      </div>

      <div className="wide-container">
        <p className="eyebrow">Blog admin</p>
        <h1>{editingId ? "Edit post" : "New post"}</h1>
        <p className="sub">Add and edit blog posts shown on the public blog.</p>

        <div className="grid-2">
          {/* Add / edit form */}
          <div className="card">
            <form onSubmit={handleSubmit}>
              <label htmlFor="title">Title</label>
              <input
                id="title"
                required
                value={form.title}
                onChange={(e) => setField("title", e.target.value)}
                placeholder="How instant AI replies win more buyers"
              />

              <label htmlFor="slug">Slug <span className="muted">(optional — auto-generated from title)</span></label>
              <input
                id="slug"
                value={form.slug}
                onChange={(e) => setField("slug", e.target.value)}
                placeholder="instant-ai-replies"
              />

              <label htmlFor="tag">Tag</label>
              <input
                id="tag"
                value={form.tag}
                onChange={(e) => setField("tag", e.target.value)}
                placeholder="Guide"
              />

              <label htmlFor="excerpt">Excerpt <span className="muted">(short card summary)</span></label>
              <textarea
                id="excerpt"
                rows={2}
                value={form.excerpt}
                onChange={(e) => setField("excerpt", e.target.value)}
                placeholder="A one or two sentence teaser."
              />

              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                rows={10}
                required
                value={form.description}
                onChange={(e) => setField("description", e.target.value)}
                placeholder="The full blog content…"
              />

              <label style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12 }}>
                <input
                  type="checkbox"
                  checked={form.published}
                  onChange={(e) => setField("published", e.target.checked)}
                  style={{ width: "auto" }}
                />
                Published
              </label>

              {error && <div className="error-box">{error}</div>}

              <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
                <button type="submit" className="btn-accent" disabled={busy}>
                  {busy ? "Saving…" : editingId ? "Save changes" : "Add post"}
                </button>
                {editingId && (
                  <button type="button" className="btn-outline" onClick={startNew} disabled={busy}>
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Existing posts */}
          <div className="card">
            <h2>Posts ({posts.length})</h2>
            {posts.length === 0 && <p className="muted">No posts yet — add your first one.</p>}
            {posts.map((post) => (
              <div className="token-row" key={post.id}>
                <span>
                  {post.title}{" "}
                  {!post.published && <span className="muted">— draft</span>}
                  <br />
                  <span className="muted">/{post.slug}</span>
                </span>
                <span style={{ display: "flex", gap: 12, whiteSpace: "nowrap" }}>
                  <button className="btn-outline" onClick={() => startEdit(post)} disabled={busy}>
                    Edit
                  </button>
                  <button className="btn-danger-text" onClick={() => handleDelete(post.id)} disabled={busy}>
                    Delete
                  </button>
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
