import Link from "next/link";
import SiteNav from "../components/SiteNav";

export const metadata = {
  title: "Blog · FB AutoReply AI",
  description: "Tips, guides, and updates on selling faster on Facebook Marketplace.",
};

const POSTS = [
  {
    slug: "#",
    title: "How instant AI replies win more Marketplace buyers",
    excerpt:
      "Buyers message several sellers at once. The first genuine reply usually gets the sale — here's how automation keeps you first.",
    date: "June 2026",
    tag: "Guide",
  },
  {
    slug: "#",
    title: "Lead scoring 101: spotting serious buyers fast",
    excerpt:
      "Not every 'is this available?' is equal. Learn how lead scoring ranks your conversations so you focus on the ready-to-buy ones.",
    date: "May 2026",
    tag: "Product",
  },
  {
    slug: "#",
    title: "5 message templates that close Marketplace deals",
    excerpt:
      "Copy-and-adapt scripts for price questions, pickup logistics, and holds — the moments where deals are won or lost.",
    date: "April 2026",
    tag: "Playbook",
  },
];

export default function BlogPage() {
  return (
    <>
      <SiteNav />
      <div className="wide-container">
        <p className="eyebrow">Blog</p>
        <h1>Sell faster on Facebook Marketplace</h1>
        <p className="sub">Tips, guides, and product updates from the FB AutoReply AI team.</p>

        <div className="blog-grid">
          {POSTS.map((post) => (
            <Link key={post.title} href={post.slug} className="card blog-card">
              <span className="blog-tag">{post.tag}</span>
              <h2>{post.title}</h2>
              <p className="muted">{post.excerpt}</p>
              <p className="foot-note" style={{ textAlign: "left", marginTop: 16 }}>{post.date}</p>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
