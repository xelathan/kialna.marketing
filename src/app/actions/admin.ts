"use server";

import prisma from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { revalidatePath } from "next/cache";

const ALLOWED_STATUSES = [
  "Ready for Pickup",
  "Driver Assigned",
  "Picked Up",
  "In Packaging",
  "Shipped",
  "Delivered",
];

export async function getAdminOrders() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return { success: false, error: "Unauthorized. Must be an admin." };
  }

  try {
    const orders = await prisma.order.findMany({
      include: {
        buyer: true,
        items: {
          include: {
            product: {
              include: {
                seller: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return { success: true, orders };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to fetch admin orders" };
  }
}

export async function updateOrderStatus(orderId: string, newStatus: string) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return { success: false, error: "Unauthorized. Must be an admin." };
  }

  if (!ALLOWED_STATUSES.includes(newStatus)) {
    return { success: false, error: `Invalid status "${newStatus}".` };
  }

  try {
    const existing = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!existing) {
      return { success: false, error: "Order not found." };
    }

    const order = await prisma.order.update({
      where: { id: orderId },
      data: { status: newStatus },
    });

    revalidatePath("/");
    revalidatePath("/seller");
    return { success: true, order };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to update order status" };
  }
}

export async function getPlatformFees() {
  try {
    const fees = await prisma.fee.findMany();
    const shipping = fees.find((f) => f.feeName === "shipping")?.amount || 120000;
    const packaging = fees.find((f) => f.feeName === "packaging")?.amount || 30000;

    return { success: true, shipping, packaging };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to fetch platform fees", shipping: 120000, packaging: 30000 };
  }
}

export async function updateFeeAmount(feeName: string, amount: number) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return { success: false, error: "Unauthorized. Must be an admin." };
  }

  if (amount < 0) {
    return { success: false, error: "Fee amount cannot be negative." };
  }

  try {
    await prisma.fee.upsert({
      where: { feeName },
      update: { amount, effectiveDate: new Date() },
      create: { feeName, amount },
    });

    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to update fee" };
  }
}
