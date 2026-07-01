"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";

// TODO: replace with the published Chrome Web Store URL once available.
const CHROME_EXTENSION_URL = "#";

export default function SiteNav() {
  const pathname = usePathname();
  const { status } = useSession();
  const [publicMenus, setPublicMenus] = useState([]);
  const [appMenus, setAppMenus] = useState([]);

  // Re-fetch whenever auth state changes so the nav updates on login/logout.
  useEffect(() => {
    let active = true;
    fetch("/api/menu")
      .then((r) => r.json())
      .then((data) => {
        if (!active) return;
        setPublicMenus(data.publicMenus || []);
        setAppMenus(data.appMenus || []);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [status]);

  const isAuthed = status === "authenticated";

  // Public view = home or any public menu route. App routes (dashboard, etc.)
  // show the app menus instead. The "ListToLead AI" brand always returns to the
  // public site.
  const isPublicView =
    pathname === "/" ||
    publicMenus.some((m) => m.url && m.url !== "/" && pathname.startsWith(m.url));

  const navMenus = isPublicView ? publicMenus : appMenus;

  const addToChrome = (
    <a href={CHROME_EXTENSION_URL} target="_blank" rel="noreferrer" className="btn btn-outline">
      Add to Chrome
    </a>
  );

  return (
    <header className="site-nav">
      <Link href="/" className="brand">ListToLead AI</Link>

      <nav className="site-nav-links">
        {navMenus.map((tab) => {
          const active =
            tab.url === "/" ? pathname === "/" : pathname.startsWith(tab.url);
          const external = /^https?:\/\//.test(tab.url || "");
          return (
            <Link
              key={tab.id}
              href={tab.url || "/"}
              target={external && tab.newWindow ? "_blank" : undefined}
              className={`nav-link${active ? " active" : ""}`}
            >
              {tab.name}
            </Link>
          );
        })}
      </nav>

      <div className="site-nav-actions">
        {addToChrome}
        {isAuthed ? (
          <>
            {/* On the public view, offer a quick jump back into the app. */}
            {isPublicView && (
              <Link href="/dashboard" className="btn btn-accent">Dashboard</Link>
            )}
            <button className="nav-link" onClick={() => signOut({ callbackUrl: "/" })}>
              Log out
            </button>
          </>
        ) : (
          <>
            <Link href="/login" className="nav-link">Log in</Link>
            <Link href="/signup" className="btn btn-accent">Sign up</Link>
          </>
        )}
      </div>
    </header>
  );
}
