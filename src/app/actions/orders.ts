"use server";

import prisma from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { stripe } from "@/lib/stripe";
import type Stripe from "stripe";
import { revalidatePath } from "next/cache";

const EXCHANGE_RATE = 25000; // 25,000 VND = 1 USD

export async function getBuyerOrders() {
  const user = await getCurrentUser();
  if (!user || user.role !== "buyer") {
    return { success: false, error: "Unauthorized. Must be a buyer." };
  }

  try {
    const orders = await prisma.order.findMany({
      where: { buyerId: user.id },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return { success: true, orders };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to fetch orders" };
  }
}

/**
 * Direct / Simulated checkout (Instant test mode)
 */
export async function createOrder(
  items: { productId: string; quantity: number }[],
  deliveryInfo: { name: string; address: string; phone: string }
) {
  const user = await getCurrentUser();
  if (!user || user.role !== "buyer") {
    return { success: false, error: "Unauthorized. Must be a buyer." };
  }

  if (items.length === 0) {
    return { success: false, error: "Cart is empty." };
  }

  if (!deliveryInfo.name.trim() || !deliveryInfo.address.trim() || !deliveryInfo.phone.trim()) {
    return { success: false, error: "Delivery name, address, and phone are required." };
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Fetch fees dynamically
      const fees = await tx.fee.findMany();
      const shippingFee = fees.find((f) => f.feeName === "shipping")?.amount || 120000;
      const packagingFee = fees.find((f) => f.feeName === "packaging")?.amount || 30000;

      let totalVND = 0;
      const verifiedItems = [];

      // 2. Validate product availability and inventory
      for (const item of items) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
        });

        if (!product) {
          throw new Error(`Product not found.`);
        }

        if (product.status !== "active") {
          throw new Error(`Product "${product.name}" is no longer available.`);
        }

        if (product.inventory < item.quantity) {
          throw new Error(`Insufficient stock for "${product.name}". Only ${product.inventory} left.`);
        }

        const itemCostVND = (product.basePrice + shippingFee + packagingFee) * item.quantity;
        totalVND += itemCostVND;

        verifiedItems.push({
          product,
          quantity: item.quantity,
          basePrice: product.basePrice,
        });
      }

      const totalPaidUSD = totalVND / EXCHANGE_RATE;

      // 3. Update Buyer profile details
      await tx.user.update({
        where: { id: user.id },
        data: {
          name: deliveryInfo.name.trim(),
          address: deliveryInfo.address.trim(),
          phone: deliveryInfo.phone.trim(),
        },
      });

      // 4. Create Order with delivery info
      const order = await tx.order.create({
        data: {
          buyerId: user.id,
          totalPaid: totalPaidUSD,
          status: "Ready for Pickup",
          paymentStatus: "paid",
          deliveryName: deliveryInfo.name.trim(),
          deliveryAddress: deliveryInfo.address.trim(),
          deliveryPhone: deliveryInfo.phone.trim(),
        },
      });

      // 5. Create OrderItems & deduct stock
      for (const item of verifiedItems) {
        await tx.orderItem.create({
          data: {
            orderId: order.id,
            productId: item.product.id,
            quantity: item.quantity,
            sellerPriceAtPurchase: item.basePrice,
            shippingFeeAtPurchase: shippingFee,
            packagingFeeAtPurchase: packagingFee,
          },
        });

        await tx.product.update({
          where: { id: item.product.id },
          data: {
            inventory: {
              decrement: item.quantity,
            },
          },
        });
      }

      return order;
    });

    revalidatePath("/");
    revalidatePath("/seller");
    return { success: true, orderId: result.id };
  } catch (error: any) {
    return { success: false, error: error.message || "Checkout failed. Please try again." };
  }
}

/**
 * Create Stripe Checkout Session with transparent fee line items
 */
export async function createStripeCheckoutSession(
  items: { productId: string; quantity: number }[],
  deliveryInfo: { name: string; address: string; phone: string },
  originUrl: string
) {
  const user = await getCurrentUser();
  if (!user || user.role !== "buyer") {
    return { success: false, error: "Unauthorized. Must be signed in as a buyer." };
  }

  if (items.length === 0) {
    return { success: false, error: "Cart is empty." };
  }

  if (!deliveryInfo.name.trim() || !deliveryInfo.address.trim() || !deliveryInfo.phone.trim()) {
    return { success: false, error: "Recipient name, delivery address, and phone are required." };
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return { success: false, error: "Stripe is not configured. Missing STRIPE_SECRET_KEY." };
  }

  try {
    // 1. Fetch fees
    const fees = await prisma.fee.findMany();
    const shippingFee = fees.find((f) => f.feeName === "shipping")?.amount || 120000;
    const packagingFee = fees.find((f) => f.feeName === "packaging")?.amount || 30000;

    let totalVND = 0;
    let totalQuantity = 0;
    const verifiedItems: { product: any; quantity: number; basePrice: number }[] = [];

    // 2. Verify stock
    for (const item of items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
      });

      if (!product) {
        throw new Error("One of your selected products was not found.");
      }

      if (product.status !== "active") {
        throw new Error(`Product "${product.name}" is currently unavailable.`);
      }

      if (product.inventory < item.quantity) {
        throw new Error(`Insufficient stock for "${product.name}". Only ${product.inventory} available.`);
      }

      const itemTotalVND = (product.basePrice + shippingFee + packagingFee) * item.quantity;
      totalVND += itemTotalVND;
      totalQuantity += item.quantity;

      verifiedItems.push({
        product,
        quantity: item.quantity,
        basePrice: product.basePrice,
      });
    }

    const totalPaidUSD = totalVND / EXCHANGE_RATE;

    // 3. Create a pending Order in Prisma
    const order = await prisma.order.create({
      data: {
        buyerId: user.id,
        totalPaid: totalPaidUSD,
        status: "Pending Payment",
        paymentStatus: "pending",
        deliveryName: deliveryInfo.name.trim(),
        deliveryAddress: deliveryInfo.address.trim(),
        deliveryPhone: deliveryInfo.phone.trim(),
      },
    });

    // 4. Create OrderItems linked to this pending order
    for (const item of verifiedItems) {
      await prisma.orderItem.create({
        data: {
          orderId: order.id,
          productId: item.product.id,
          quantity: item.quantity,
          sellerPriceAtPurchase: item.basePrice,
          shippingFeeAtPurchase: shippingFee,
          packagingFeeAtPurchase: packagingFee,
        },
      });
    }

    // 5. Construct transparent Stripe line items
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];

    // Craft base items
    for (const item of verifiedItems) {
      const unitCents = Math.round((item.basePrice / EXCHANGE_RATE) * 100);
      lineItems.push({
        price_data: {
          currency: "usd",
          product_data: {
            name: `${item.product.name} (Artisan Base Price)`,
            description: `Handcrafted in Vietnam • ${item.basePrice.toLocaleString()} VND base`,
          },
          unit_amount: unitCents,
        },
        quantity: item.quantity,
      });
    }

    // Packaging fee line item
    const packagingUnitCents = Math.round((packagingFee / EXCHANGE_RATE) * 100);
    lineItems.push({
      price_data: {
        currency: "usd",
        product_data: {
          name: "Custom Craft Packaging (Hub Service)",
          description: `Custom bubblewrap & reinforced boxing • ${packagingFee.toLocaleString()} VND per unit`,
        },
        unit_amount: packagingUnitCents,
      },
      quantity: totalQuantity,
    });

    // Shipping fee line item
    const shippingUnitCents = Math.round((shippingFee / EXCHANGE_RATE) * 100);
    lineItems.push({
      price_data: {
        currency: "usd",
        product_data: {
          name: "District 1 International Shipping Logistics",
          description: `Hub customs handling & international dispatch • ${shippingFee.toLocaleString()} VND per unit`,
        },
        unit_amount: shippingUnitCents,
      },
      quantity: totalQuantity,
    });

    // 6. Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: user.email,
      client_reference_id: order.id,
      line_items: lineItems,
      metadata: {
        orderId: order.id,
        buyerId: user.id,
      },
      success_url: `${originUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}&order_id=${order.id}`,
      cancel_url: `${originUrl}/checkout/cancel?order_id=${order.id}`,
    });

    // 7. Store Stripe session ID on order
    await prisma.order.update({
      where: { id: order.id },
      data: {
        stripeSessionId: session.id,
      },
    });

    return { success: true, checkoutUrl: session.url };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to initialize Stripe checkout." };
  }
}

/**
 * Confirm order payment after Stripe redirect
 */
export async function confirmStripeOrder(sessionId: string) {
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (!session || session.payment_status !== "paid") {
      return { success: false, error: "Payment not completed." };
    }

    const orderId = (session.metadata?.orderId as string) || (session.client_reference_id as string);
    if (!orderId) {
      return { success: false, error: "No order associated with session." };
    }

    const existingOrder = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!existingOrder) {
      return { success: false, error: "Order not found." };
    }

    // Idempotent: already confirmed
    if (existingOrder.paymentStatus === "paid" && existingOrder.status !== "Pending Payment") {
      return { success: true, order: existingOrder };
    }

    // Complete order & deduct inventory
    const updatedOrder = await prisma.$transaction(async (tx) => {
      const paymentIntentId =
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : (session.payment_intent as any)?.id || null;

      const order = await tx.order.update({
        where: { id: orderId },
        data: {
          paymentStatus: "paid",
          status: "Ready for Pickup",
          stripePaymentIntentId: paymentIntentId,
        },
        include: {
          items: {
            include: {
              product: true,
            },
          },
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

      return order;
    });

    revalidatePath("/");
    revalidatePath("/seller");
    return { success: true, order: updatedOrder };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to confirm payment." };
  }
}

/**
 * Create PaymentIntent for in-portal embedded checkout
 */
export async function createPaymentIntent(
  items: { productId: string; quantity: number }[],
  deliveryInfo: { name: string; address: string; phone: string }
) {
  const user = await getCurrentUser();
  if (!user || user.role !== "buyer") {
    return { success: false, error: "Unauthorized. Must be signed in as a buyer." };
  }

  if (items.length === 0) {
    return { success: false, error: "Cart is empty." };
  }

  if (!deliveryInfo.name.trim() || !deliveryInfo.address.trim() || !deliveryInfo.phone.trim()) {
    return { success: false, error: "Recipient name, delivery address, and phone are required." };
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return { success: false, error: "Stripe secret key is missing." };
  }

  try {
    const fees = await prisma.fee.findMany();
    const shippingFee = fees.find((f) => f.feeName === "shipping")?.amount || 120000;
    const packagingFee = fees.find((f) => f.feeName === "packaging")?.amount || 30000;

    let totalVND = 0;
    const verifiedItems: { product: any; quantity: number; basePrice: number }[] = [];

    for (const item of items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
      });

      if (!product) {
        throw new Error("One of your selected products was not found.");
      }

      if (product.status !== "active") {
        throw new Error(`Product "${product.name}" is currently unavailable.`);
      }

      if (product.inventory < item.quantity) {
        throw new Error(`Insufficient stock for "${product.name}". Only ${product.inventory} available.`);
      }

      const itemTotalVND = (product.basePrice + shippingFee + packagingFee) * item.quantity;
      totalVND += itemTotalVND;

      verifiedItems.push({
        product,
        quantity: item.quantity,
        basePrice: product.basePrice,
      });
    }

    const totalPaidUSD = totalVND / EXCHANGE_RATE;
    const amountInCents = Math.round(totalPaidUSD * 100);

    // Create pending Order
    const order = await prisma.order.create({
      data: {
        buyerId: user.id,
        totalPaid: totalPaidUSD,
        status: "Pending Payment",
        paymentStatus: "pending",
        deliveryName: deliveryInfo.name.trim(),
        deliveryAddress: deliveryInfo.address.trim(),
        deliveryPhone: deliveryInfo.phone.trim(),
      },
    });

    for (const item of verifiedItems) {
      await prisma.orderItem.create({
        data: {
          orderId: order.id,
          productId: item.product.id,
          quantity: item.quantity,
          sellerPriceAtPurchase: item.basePrice,
          shippingFeeAtPurchase: shippingFee,
          packagingFeeAtPurchase: packagingFee,
        },
      });
    }

    // Create Stripe PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: "usd",
      automatic_payment_methods: { enabled: true },
      metadata: {
        orderId: order.id,
        buyerId: user.id,
      },
      description: `Kialna Order ${order.id} - Vietnamese Artisan Crafts & Logistics`,
    });

    await prisma.order.update({
      where: { id: order.id },
      data: {
        stripePaymentIntentId: paymentIntent.id,
      },
    });

    return {
      success: true,
      clientSecret: paymentIntent.client_secret,
      orderId: order.id,
      amountUSD: totalPaidUSD,
    };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to initialize payment." };
  }
}

/**
 * Confirm in-portal PaymentIntent after successful client submission
 */
export async function confirmPaymentIntentOrder(paymentIntentId: string, orderId: string) {
  try {
    const intent = await stripe.paymentIntents.retrieve(paymentIntentId);
    if (!intent || intent.status !== "succeeded") {
      return { success: false, error: `Payment status is ${intent?.status || "unknown"}.` };
    }

    const existingOrder = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!existingOrder) {
      return { success: false, error: "Order not found." };
    }

    // Idempotent check
    if (existingOrder.paymentStatus === "paid" && existingOrder.status !== "Pending Payment") {
      return { success: true, order: existingOrder };
    }

    const updatedOrder = await prisma.$transaction(async (tx) => {
      const order = await tx.order.update({
        where: { id: orderId },
        data: {
          paymentStatus: "paid",
          status: "Ready for Pickup",
          stripePaymentIntentId: intent.id,
        },
        include: {
          items: {
            include: {
              product: true,
            },
          },
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

      return order;
    });

    revalidatePath("/");
    revalidatePath("/seller");
    return { success: true, order: updatedOrder };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to confirm payment intent." };
  }
}

