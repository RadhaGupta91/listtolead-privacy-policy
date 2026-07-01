import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "../../../lib/prisma";

export async function POST(req) {
  try {
    const { fname, lname, email, password } = await req.json();

    if (!email || !password || password.length < 8) {
      return NextResponse.json(
        { error: "Email and a password of at least 8 characters are required." },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (existing) {
      return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        fname: fname || null,
        lname: lname || null,
        email: email.toLowerCase(),
        passwordHash,
        role: "client", // every new signup is a client by default
      },
    });

    return NextResponse.json({ id: user.id, email: user.email });
  } catch (err) {
    console.error("Signup error:", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
