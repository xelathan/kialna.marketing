"use server";

import prisma from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { revalidatePath } from "next/cache";

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

  const EXCHANGE_RATE = 25000; // 25,000 VND = 1 USD

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

        // Each item unit covers basePrice + shippingFee + packagingFee
        const itemCostVND = (product.basePrice + shippingFee + packagingFee) * item.quantity;
        totalVND += itemCostVND;

        verifiedItems.push({
          product,
          quantity: item.quantity,
          basePrice: product.basePrice,
        });
      }

      // Convert total paid to USD for the Order model field
      const totalPaidUSD = totalVND / EXCHANGE_RATE;

      // 3. Update Buyer profile details if they changed/filled them
      await tx.user.update({
        where: { id: user.id },
        data: {
          name: deliveryInfo.name.trim(),
          address: deliveryInfo.address.trim(),
          phone: deliveryInfo.phone.trim(),
        },
      });

      // 4. Create Order
      const order = await tx.order.create({
        data: {
          buyerId: user.id,
          totalPaid: totalPaidUSD,
          status: "Ready for Pickup", // Matches status in DB schema seed
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

        // Deduct inventory stock
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
