import Link from "next/link";
import SiteNav from "../components/SiteNav";
import { prisma } from "../../lib/prisma";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Blog · ListToLead AI",
  description: "Tips, guides, and updates on selling faster on Facebook Marketplace.",
};

function formatDate(date) {
  return new Date(date).toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

export default async function BlogPage() {
  const posts = await prisma.blogPost.findMany({
    where: { published: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <>
      <SiteNav />
      <div className="wide-container">
        <p className="eyebrow">Blog</p>
        <h1>Sell faster on Facebook Marketplace</h1>
        <p className="sub">Tips, guides, and product updates from the ListToLead AI team.</p>

        {posts.length === 0 ? (
          <p className="muted">No posts yet — check back soon.</p>
        ) : (
          <div className="blog-grid">
            {posts.map((post) => (
              <Link key={post.id} href={`/blog/${post.slug}`} className="card blog-card">
                {post.tag && <span className="blog-tag">{post.tag}</span>}
                <h2>{post.title}</h2>
                <p className="muted">{post.excerpt || post.description.slice(0, 160)}</p>
                <p className="foot-note" style={{ textAlign: "left", marginTop: 16 }}>{formatDate(post.createdAt)}</p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
