"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/", label: "Home" },
  { href: "/blog", label: "Blog" },
  { href: "/pricing", label: "Pricing" },
  { href: "/help", label: "Help & Support" },
];

export default function SiteNav() {
  const pathname = usePathname();

  return (
    <header className="site-nav">
      <Link href="/" className="brand">FB AutoReply AI</Link>

      <nav className="site-nav-links">
        {TABS.map((tab) => {
          const active =
            tab.href === "/" ? pathname === "/" : pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`nav-link${active ? " active" : ""}`}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>

      <div className="site-nav-actions">
        <Link href="/login" className="nav-link">Log in</Link>
        <Link href="/signup" className="btn btn-accent">Sign up</Link>
      </div>
    </header>
  );
}
