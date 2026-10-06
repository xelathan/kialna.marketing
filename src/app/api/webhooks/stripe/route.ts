import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import prisma from "@/lib/db";
import type Stripe from "stripe";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event: Stripe.Event;

  try {
    if (webhookSecret && signature) {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } else {
      // In dev mode without local webhook signing secret configured
      event = JSON.parse(body) as Stripe.Event;
    }
  } catch (err: any) {
    console.error(`⚠️ Stripe webhook signature verification failed:`, err.message);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  // Handle event
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const orderId = (session.metadata?.orderId as string) || (session.client_reference_id as string);

    if (orderId) {
      try {
        const existingOrder = await prisma.order.findUnique({
          where: { id: orderId },
          include: { items: true },
        });

        if (existingOrder && existingOrder.paymentStatus !== "paid") {
          const paymentIntentId =
            typeof session.payment_intent === "string"
              ? session.payment_intent
              : (session.payment_intent as any)?.id || null;

          await prisma.$transaction(async (tx) => {
            await tx.order.update({
              where: { id: orderId },
              data: {
                paymentStatus: "paid",
                status: "Ready for Pickup",
                stripePaymentIntentId: paymentIntentId,
              },
            });

            for (const item of existingOrder.items) {
              await tx.product.update({
                where: { id: item.productId },
                data: {
                  inventory: {
                    decrement: item.quantity,
                  },
                },
              });
            }
          });
          console.log(`✅ Order ${orderId} successfully marked PAID via Stripe webhook.`);
        }
      } catch (dbErr: any) {
        console.error(`Error updating order from webhook:`, dbErr);
      }
    }
  }

  return NextResponse.json({ received: true });
}
