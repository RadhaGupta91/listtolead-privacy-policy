import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { requireAdmin } from "../../../../lib/guard";
import { parsePlan } from "../../../../lib/plans";

// Developer/Admin only: update a plan and replace its feature list.
export async function PUT(req, { params }) {
  const gate = await requireAdmin();
  if (gate.error) return NextResponse.json({ error: gate.error }, { status: gate.status });

  const id = Number(params.id);
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: "Invalid plan id." }, { status: 400 });
  }

  const body = await req.json().catch(() => ({}));
  const { fields, features, missing } = parsePlan(body);
  if (missing.length) {
    return NextResponse.json({ error: `Missing required field(s): ${missing.join(", ")}.` }, { status: 400 });
  }

  const existing = await prisma.plan.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Plan not found." }, { status: 404 });
  }

  // Replace features wholesale so ordering/removals stay in sync.
  const plan = await prisma.$transaction(async (tx) => {
    await tx.planFeature.deleteMany({ where: { planId: id } });
    return tx.plan.update({
      where: { id },
      data: {
        ...fields,
        features: { create: features.map((name, i) => ({ name, order: i + 1 })) },
      },
      include: { features: { orderBy: { order: "asc" } } },
    });
  });

  return NextResponse.json({ plan });
}

// Developer/Admin only: delete a plan. Its features cascade.
export async function DELETE(_req, { params }) {
  const gate = await requireAdmin();
  if (gate.error) return NextResponse.json({ error: gate.error }, { status: gate.status });

  const id = Number(params.id);
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: "Invalid plan id." }, { status: 400 });
  }

  try {
    await prisma.plan.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Plan not found." }, { status: 404 });
  }
}
