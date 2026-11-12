"use server";

import prisma from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { revalidatePath } from "next/cache";

export async function getSellerProducts() {
  const user = await getCurrentUser();
  if (!user || user.role !== "seller") {
    return { success: false, error: "Unauthorized. Must be a seller." };
  }

  try {
    const products = await prisma.product.findMany({
      where: { sellerId: user.id },
      orderBy: { createdAt: "desc" },
    });
    return { success: true, products };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to fetch products" };
  }
}

export async function getFees() {
  try {
    const fees = await prisma.fee.findMany();
    const shipping = fees.find((f) => f.feeName === "shipping")?.amount || 0;
    const packaging = fees.find((f) => f.feeName === "packaging")?.amount || 0;
    return { success: true, shipping, packaging };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to fetch fees", shipping: 0, packaging: 0 };
  }
}

export async function createProduct(data: {
  name: string;
  description?: string;
  category?: string;
  basePrice: number;
  weight: number;
  inventory: number;
  images: string[];
  status: string;
}) {
  const user = await getCurrentUser();
  if (!user || user.role !== "seller") {
    return { success: false, error: "Unauthorized. Must be a seller." };
  }

  if (!data.name.trim()) {
    return { success: false, error: "Product name is required." };
  }

  if (data.basePrice < 0) {
    return { success: false, error: "Price cannot be negative." };
  }

  if (!data.weight || data.weight <= 0) {
    return { success: false, error: "Product weight must be greater than 0." };
  }

  if (data.inventory < 0) {
    return { success: false, error: "Inventory cannot be negative." };
  }

  try {
    const product = await prisma.product.create({
      data: {
        sellerId: user.id,
        name: data.name.trim(),
        description: data.description?.trim() || null,
        category: data.category?.trim() || "General",
        basePrice: data.basePrice,
        weight: data.weight,
        inventory: data.inventory,
        images: JSON.stringify(data.images),
        status: data.status || "active",
      },
    });

    revalidatePath("/");
    revalidatePath("/seller");
    return { success: true, product };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to create product" };
  }
}

export async function updateProduct(
  id: string,
  data: {
    name: string;
    description?: string;
    category?: string;
    basePrice: number;
    weight: number;
    inventory: number;
    images: string[];
    status: string;
  }
) {
  const user = await getCurrentUser();
  if (!user || user.role !== "seller") {
    return { success: false, error: "Unauthorized. Must be a seller." };
  }

  if (!data.name.trim()) {
    return { success: false, error: "Product name is required." };
  }

  if (data.basePrice < 0) {
    return { success: false, error: "Price cannot be negative." };
  }

  if (!data.weight || data.weight <= 0) {
    return { success: false, error: "Product weight must be greater than 0." };
  }

  if (data.inventory < 0) {
    return { success: false, error: "Inventory cannot be negative." };
  }

  try {
    // Verify ownership
    const existing = await prisma.product.findUnique({
      where: { id },
    });

    if (!existing) {
      return { success: false, error: "Product not found." };
    }

    if (existing.sellerId !== user.id) {
      return { success: false, error: "Unauthorized to edit this product." };
    }

    const product = await prisma.product.update({
      where: { id },
      data: {
        name: data.name.trim(),
        description: data.description?.trim() || null,
        category: data.category?.trim() || "General",
        basePrice: data.basePrice,
        weight: data.weight,
        inventory: data.inventory,
        images: JSON.stringify(data.images),
        status: data.status || "active",
      },
    });

    revalidatePath("/");
    revalidatePath("/seller");
    return { success: true, product };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to update product" };
  }
}

export async function deleteProduct(id: string) {
  const user = await getCurrentUser();
  if (!user || user.role !== "seller") {
    return { success: false, error: "Unauthorized. Must be a seller." };
  }

  try {
    const existing = await prisma.product.findUnique({
      where: { id },
    });

    if (!existing) {
      return { success: false, error: "Product not found." };
    }

    if (existing.sellerId !== user.id) {
      return { success: false, error: "Unauthorized to delete this product." };
    }

    await prisma.product.delete({
      where: { id },
    });

    revalidatePath("/");
    revalidatePath("/seller");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to delete product" };
  }
}

export async function toggleProductStatus(id: string) {
  const user = await getCurrentUser();
  if (!user || user.role !== "seller") {
    return { success: false, error: "Unauthorized. Must be a seller." };
  }

  try {
    const existing = await prisma.product.findUnique({
      where: { id },
    });

    if (!existing) {
      return { success: false, error: "Product not found." };
    }

    if (existing.sellerId !== user.id) {
      return { success: false, error: "Unauthorized to modify this product." };
    }

    const newStatus = existing.status === "active" ? "draft" : "active";

    const product = await prisma.product.update({
      where: { id },
      data: { status: newStatus },
    });

    revalidatePath("/");
    revalidatePath("/seller");
    return { success: true, product };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to toggle product status" };
  }
}

export async function getSellerOrders() {
  const user = await getCurrentUser();
  if (!user || user.role !== "seller") {
    return { success: false, error: "Unauthorized. Must be a seller." };
  }

  try {
    const orderItems = await prisma.orderItem.findMany({
      where: { product: { sellerId: user.id } },
      include: {
        order: {
          include: { buyer: true },
        },
        product: true,
      },
      orderBy: { order: { createdAt: "desc" } },
    });

    // Group items by order
    const ordersMap = new Map();
    for (const item of orderItems) {
      const orderId = item.orderId;
      if (!ordersMap.has(orderId)) {
        ordersMap.set(orderId, {
          id: item.order.id,
          status: item.order.status,
          payoutStatus: item.order.payoutStatus,
          payoutMethod: item.order.payoutMethod,
          payoutRef: item.order.payoutRef,
          payoutAt: item.order.payoutAt,
          totalPaid: item.order.totalPaid,
          createdAt: item.order.createdAt,
          buyerName: item.order.buyer.name,
          buyerAddress: item.order.buyer.address,
          buyerPhone: item.order.buyer.phone,
          items: [],
        });
      }
      ordersMap.get(orderId).items.push({
        id: item.id,
        name: item.product.name,
        quantity: item.quantity,
        weight: item.weightAtPurchase || item.product.weight || 0.5,
        price: item.sellerPriceAtPurchase,
        shippingFee: item.shippingFeeAtPurchase,
        packagingFee: item.packagingFeeAtPurchase,
      });
    }

    return { success: true, orders: Array.from(ordersMap.values()) };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to fetch orders" };
  }
}

