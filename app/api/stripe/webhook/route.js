import { NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "../../../../lib/prisma";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Stripe needs the raw, unparsed body to verify the signature.
export const dynamic = "force-dynamic";

async function upsertSubscriptionFromStripe(subscription) {
  const customerId = subscription.customer;
  const user = await prisma.user.findUnique({ where: { stripeCustomerId: customerId } });
  if (!user) return;

  const priceNickname = subscription.items?.data?.[0]?.price?.nickname || "";
  const plan = subscription.status === "active" || subscription.status === "trialing" ? "pro" : "free";

  await prisma.user.update({
    where: { id: user.id },
    data: {
      stripeSubscriptionId: subscription.id,
      subscriptionStatus: subscription.status,
      plan,
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
    },
  });
}

export async function POST(req) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const checkoutSession = event.data.object;
      if (checkoutSession.subscription) {
        const subscription = await stripe.subscriptions.retrieve(checkoutSession.subscription);
        await upsertSubscriptionFromStripe(subscription);
      }
      break;
    }
    case "customer.subscription.updated":
    case "customer.subscription.created":
    case "customer.subscription.deleted": {
      await upsertSubscriptionFromStripe(event.data.object);
      break;
    }
    default:
      // Ignore other event types.
      break;
  }

  return NextResponse.json({ received: true });
}
