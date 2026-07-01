import Link from "next/link";
import { notFound } from "next/navigation";
import SiteNav from "../../components/SiteNav";
import { prisma } from "../../../lib/prisma";

export const dynamic = "force-dynamic";

function formatDate(date) {
  return new Date(date).toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

export async function generateMetadata({ params }) {
  const post = await prisma.blogPost.findUnique({ where: { slug: params.slug } });
  if (!post) return { title: "Post not found · ListToLead AI" };
  return {
    title: `${post.title} · ListToLead AI`,
    description: post.excerpt || post.description.slice(0, 160),
  };
}

export default async function BlogPostPage({ params }) {
  const post = await prisma.blogPost.findUnique({ where: { slug: params.slug } });
  if (!post || !post.published) notFound();

  return (
    <>
      <SiteNav />
      <div className="container">
        <p className="foot-note" style={{ textAlign: "left", marginBottom: 8 }}>
          <Link href="/blog">← Back to blog</Link>
        </p>
        {post.tag && <p className="eyebrow">{post.tag}</p>}
        <h1>{post.title}</h1>
        <p className="sub">{formatDate(post.createdAt)}</p>

        <div className="card">
          {post.description.split(/\n{2,}/).map((para, i) => (
            <p key={i} style={{ whiteSpace: "pre-wrap", marginBottom: 14 }}>{para}</p>
          ))}
        </div>
      </div>
    </>
  );
}
