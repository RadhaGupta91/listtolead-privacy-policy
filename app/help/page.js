"use client";

import { useState } from "react";
import SiteNav from "../components/SiteNav";

const OPTIONS = [
  {
    title: "AI Assistant",
    desc: "Automated support with full context on your account. Fastest answers, day or night.",
    action: "Open assistant",
    href: "/dashboard",
  },
  {
    title: "Facebook Chat",
    desc: "Message our team directly for human support on Facebook.",
    action: "Open Facebook chat",
    href: "https://www.facebook.com",
  },
  {
    title: "Schedule a Call",
    desc: "Book a 15-minute personalized walkthrough with our team.",
    action: "Book a call",
    href: "#",
  },
  {
    title: "Send an Email",
    desc: "Prefer email? We usually reply within a few hours.",
    action: "support@fbautoreplyai.com",
    href: "mailto:support@fbautoreplyai.com",
  },
];

export default function HelpPage() {
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", message: "" });

  function handleSubmit(e) {
    e.preventDefault();
    // No backend endpoint yet — falls back to opening an email draft.
    const body = encodeURIComponent(`${form.message}\n\n— ${form.name} (${form.email})`);
    window.location.href = `mailto:support@fbautoreplyai.com?subject=Support request&body=${body}`;
    setSent(true);
  }

  return (
    <>
      <SiteNav />
      <div className="wide-container">
        <p className="eyebrow">Help &amp; Support</p>
        <h1>We&apos;re here to help</h1>
        <p className="sub">
          For the fastest answer, use the AI Assistant — it has full context on your account.
          Prefer a human? Pick any option below.
        </p>

        <div className="grid-2">
          {OPTIONS.map((opt) => (
            <div key={opt.title} className="card">
              <h2>{opt.title}</h2>
              <p className="muted" style={{ marginBottom: 16 }}>{opt.desc}</p>
              <a href={opt.href} className="btn btn-outline" style={{ display: "inline-block" }}>
                {opt.action}
              </a>
            </div>
          ))}
        </div>

        <div className="card" style={{ marginTop: 24 }}>
          <h2>Send us a message</h2>
          {sent ? (
            <p className="muted" style={{ marginTop: 12 }}>
              Thanks! Your email draft is ready — hit send and we&apos;ll get back to you shortly.
            </p>
          ) : (
            <form onSubmit={handleSubmit}>
              <label htmlFor="name">Name</label>
              <input
                id="name"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
              <label htmlFor="message">Message</label>
              <textarea
                id="message"
                rows={5}
                required
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
              />
              <button type="submit" className="btn btn-accent" style={{ marginTop: 18 }}>
                Send message
              </button>
            </form>
          )}
        </div>
      </div>
    </>
  );
}
