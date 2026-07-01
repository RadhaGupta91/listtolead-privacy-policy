import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/auth";
import { prisma } from "../../../../lib/prisma";
import { slugify } from "../../../../lib/slug";

// Fetches a single post — used to populate the edit form. Requires auth.
export async function GET(_request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const post = await prisma.blogPost.findUnique({ where: { id: params.id } });
  if (!post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  return NextResponse.json({ post });
}

// Updates an existing post. Requires auth.
export async function PUT(request, { params }) {
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

  // Ensure the slug isn't taken by a *different* post.
  const clash = await prisma.blogPost.findUnique({ where: { slug } });
  if (clash && clash.id !== params.id) {
    return NextResponse.json(
      { error: "A post with this slug already exists." },
      { status: 409 }
    );
  }

  try {
    const post = await prisma.blogPost.update({
      where: { id: params.id },
      data: {
        title,
        slug,
        description,
        excerpt: (body.excerpt || "").trim() || null,
        tag: (body.tag || "").trim() || null,
        published: body.published !== false,
      },
    });
    return NextResponse.json({ post });
  } catch {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }
}

// Deletes a post. Requires auth.
export async function DELETE(_request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    await prisma.blogPost.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }
}
