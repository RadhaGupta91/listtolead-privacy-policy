import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { requireAdmin } from "../../../lib/guard";
import { parsePlan } from "../../../lib/plans";

// Developer/Admin only: list all plans with their features, ordered.
export async function GET() {
  const gate = await requireAdmin();
  if (gate.error) return NextResponse.json({ error: gate.error }, { status: gate.status });

  const plans = await prisma.plan.findMany({
    orderBy: { id: "asc" },
    include: { features: { orderBy: { order: "asc" } } },
  });

  return NextResponse.json({ plans });
}

// Developer/Admin only: create a plan with its features.
export async function POST(req) {
  const gate = await requireAdmin();
  if (gate.error) return NextResponse.json({ error: gate.error }, { status: gate.status });

  const body = await req.json().catch(() => ({}));
  const { fields, features, missing } = parsePlan(body);
  if (missing.length) {
    return NextResponse.json({ error: `Missing required field(s): ${missing.join(", ")}.` }, { status: 400 });
  }

  const plan = await prisma.plan.create({
    data: {
      ...fields,
      features: { create: features.map((name, i) => ({ name, order: i + 1 })) },
    },
    include: { features: { orderBy: { order: "asc" } } },
  });

  return NextResponse.json({ plan }, { status: 201 });
}
