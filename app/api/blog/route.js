import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth";
import { prisma } from "../../../lib/prisma";
import { slugify } from "../../../lib/slug";

// Lists blog posts. Authenticated users see all posts (incl. drafts) so they
// can manage them; anonymous visitors only see published posts.
export async function GET() {
  const session = await getServerSession(authOptions);
  const isAuthed = !!session?.user?.id;

  const posts = await prisma.blogPost.findMany({
    where: isAuthed ? {} : { published: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ posts });
}

// Creates a new blog post. Requires authentication.
export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const title = (body.title || "").trim();
  const description = (body.description || "").trim();

  if (!title || !description) {
    return NextResponse.json(
      { error: "Title and description are required." },
      { status: 400 }
    );
  }

  const slug = (body.slug && slugify(body.slug)) || slugify(title);

  const existing = await prisma.blogPost.findUnique({ where: { slug } });
  if (existing) {
    return NextResponse.json(
      { error: "A post with this slug already exists." },
      { status: 409 }
    );
  }

  const post = await prisma.blogPost.create({
    data: {
      title,
      slug,
      description,
      excerpt: (body.excerpt || "").trim() || null,
      tag: (body.tag || "").trim() || null,
      published: body.published !== false,
    },
  });

  return NextResponse.json({ post }, { status: 201 });
}
