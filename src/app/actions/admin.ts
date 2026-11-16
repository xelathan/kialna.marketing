"use server";

import crypto from "node:crypto";
import prisma, { ensureDbSchema } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { hashPassword } from "@/lib/auth-crypto";
import { revalidatePath } from "next/cache";

const ALLOWED_STATUSES = [
  "Ready for Pickup",
  "Driver Assigned",
  "Picked Up",
  "In Packaging",
  "Shipped",
  "Delivered",
];

function isAuthorizedAdmin(role?: string) {
  return role === "admin" || role === "site_admin";
}

export async function getAdminOrders() {
  const user = await getCurrentUser();
  if (!user || !isAuthorizedAdmin(user.role)) {
    return { success: false, error: "Unauthorized. Must be a Hub Admin or Site Admin." };
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

    const itemFeeRows: any[] = await prisma.$queryRawUnsafe(
      "SELECT id, serviceFeeAtPurchase FROM OrderItem"
    );
    const itemFeeMap = new Map(
      itemFeeRows.map((r) => [r.id, Number(r.serviceFeeAtPurchase || 0)])
    );

    const enrichedOrders = orders.map((o) => ({
      ...o,
      items: o.items.map((item: any) => ({
        ...item,
        serviceFeeAtPurchase:
          item.serviceFeeAtPurchase ?? itemFeeMap.get(item.id) ?? 0,
      })),
    }));

    return { success: true, orders: enrichedOrders };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to fetch admin orders" };
  }
}

export async function getAllAdminProducts() {
  const user = await getCurrentUser();
  if (!user || user.role !== "site_admin") {
    return { success: false, error: "Unauthorized. Must be a Site Admin." };
  }

  try {
    const products = await prisma.product.findMany({
      include: {
        seller: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const feeRows: any[] = await prisma.$queryRawUnsafe(
      "SELECT id, serviceFee FROM Product"
    );
    const feeMap = new Map(feeRows.map((r) => [r.id, Number(r.serviceFee || 0)]));

    const enrichedProducts = products.map((p: any) => ({
      ...p,
      serviceFee: p.serviceFee ?? feeMap.get(p.id) ?? 0,
    }));

    return { success: true, products: enrichedProducts };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to fetch products" };
  }
}

export async function updateProductServiceFee(productId: string, serviceFee: number) {
  const user = await getCurrentUser();
  if (!user || user.role !== "site_admin") {
    return {
      success: false,
      error: "Unauthorized. Only Site Admin can set or modify listing service fees.",
    };
  }

  if (isNaN(serviceFee) || serviceFee < 0) {
    return { success: false, error: "Service fee cannot be negative." };
  }

  try {
    await prisma.$executeRawUnsafe(
      "UPDATE Product SET serviceFee = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?",
      serviceFee,
      productId
    );

    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { seller: true },
    });

    revalidatePath("/");
    revalidatePath("/seller");
    return { success: true, product: product ? { ...product, serviceFee } : null };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to update listing service fee" };
  }
}

export async function updateOrderStatus(orderId: string, newStatus: string) {
  const user = await getCurrentUser();
  if (!user || !isAuthorizedAdmin(user.role)) {
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
    const shipping = fees.find((f) => f.feeName === "shipping")?.amount ?? 120000;
    const packaging = fees.find((f) => f.feeName === "packaging")?.amount ?? 30000;
    const service = fees.find((f) => f.feeName === "service")?.amount ?? 0;

    return { success: true, shipping, packaging, service };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to fetch platform fees",
      shipping: 120000,
      packaging: 30000,
      service: 0,
    };
  }
}

export async function updateFeeAmount(feeName: string, amount: number) {
  const user = await getCurrentUser();
  if (!user || !isAuthorizedAdmin(user.role)) {
    return { success: false, error: "Unauthorized. Must be an admin." };
  }

  if (feeName === "service" && user.role !== "site_admin") {
    return {
      success: false,
      error: "Only Site Admin can update the platform listing service fee.",
    };
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

export async function markOrderSellerPaid(
  orderId: string,
  payoutMethod: string,
  payoutRef?: string
) {
  const user = await getCurrentUser();
  if (!user || !isAuthorizedAdmin(user.role)) {
    return { success: false, error: "Unauthorized. Must be an admin." };
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
      data: {
        payoutStatus: "paid_by_hub",
        payoutMethod: payoutMethod || "VietQR Napas 247",
        payoutRef: payoutRef?.trim() || `VQR-${Date.now().toString().slice(-6)}`,
        payoutAt: new Date(),
      },
    });

    revalidatePath("/");
    revalidatePath("/seller");
    return { success: true, order };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to record seller payout" };
  }
}

export async function resetOrderSellerPayout(orderId: string) {
  const user = await getCurrentUser();
  if (!user || !isAuthorizedAdmin(user.role)) {
    return { success: false, error: "Unauthorized. Must be an admin." };
  }

  try {
    const order = await prisma.order.update({
      where: { id: orderId },
      data: {
        payoutStatus: "unpaid",
        payoutMethod: null,
        payoutRef: null,
        payoutAt: null,
      },
    });

    revalidatePath("/");
    revalidatePath("/seller");
    return { success: true, order };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to reset seller payout" };
  }
}

export async function getHubAdmins() {
  const user = await getCurrentUser();
  if (!user || user.role !== "site_admin") {
    return { success: false, error: "Unauthorized. Must be a Site Admin." };
  }

  try {
    await ensureDbSchema();
    const rows: any[] = await prisma.$queryRawUnsafe(
      `SELECT id, name, email, phone, address, status, createdAt, updatedAt
       FROM "User"
       WHERE role = 'admin'
       ORDER BY createdAt DESC`
    );

    const hubAdmins = rows.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      phone: u.phone,
      address: u.address,
      status: u.status || "active",
      createdAt: u.createdAt,
      updatedAt: u.updatedAt,
    }));

    return { success: true, hubAdmins };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to fetch Hub Admins" };
  }
}

export async function createHubAdmin(data: {
  name: string;
  email: string;
  password?: string;
  phone?: string;
  address?: string;
}) {
  const user = await getCurrentUser();
  if (!user || user.role !== "site_admin") {
    return {
      success: false,
      error: "Unauthorized. Only Site Admin can create Hub Admin accounts.",
    };
  }

  const name = data.name?.trim();
  const email = data.email?.trim().toLowerCase();
  const password = data.password?.trim() || "password123";

  if (!name) {
    return { success: false, error: "Hub Admin name is required." };
  }
  if (!email || !email.includes("@")) {
    return { success: false, error: "A valid email address is required." };
  }
  if (password.length < 6) {
    return { success: false, error: "Password must be at least 6 characters long." };
  }

  try {
    await ensureDbSchema();
    const existingRows: any[] = await prisma.$queryRawUnsafe(
      `SELECT id FROM "User" WHERE lower(email) = ? LIMIT 1`,
      email
    );

    if (existingRows.length > 0) {
      return { success: false, error: "An account with this email already exists." };
    }

    const passwordHash = await hashPassword(password);
    const newId = crypto.randomUUID();
    const phone = data.phone?.trim() || null;
    const address = data.address?.trim() || "Saigon Hub";

    await prisma.$executeRawUnsafe(
      `INSERT INTO "User" (id, role, status, name, email, phone, address, passwordHash, createdAt, updatedAt)
       VALUES (?, 'admin', 'active', ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      newId,
      name,
      email,
      phone,
      address,
      passwordHash
    );

    const hubAdmin = {
      id: newId,
      name,
      email,
      phone,
      address,
      status: "active",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    revalidatePath("/");
    return { success: true, hubAdmin };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to create Hub Admin account" };
  }
}

export async function updateHubAdmin(
  hubAdminId: string,
  data: {
    name: string;
    email: string;
    phone?: string;
    address?: string;
    password?: string;
  }
) {
  const user = await getCurrentUser();
  if (!user || user.role !== "site_admin") {
    return {
      success: false,
      error: "Unauthorized. Only Site Admin can edit Hub Admin accounts.",
    };
  }

  const name = data.name?.trim();
  const email = data.email?.trim().toLowerCase();
  const password = data.password?.trim() || "";

  if (!name) {
    return { success: false, error: "Hub Admin name is required." };
  }
  if (!email || !email.includes("@")) {
    return { success: false, error: "A valid email address is required." };
  }
  if (password && password.length < 6) {
    return { success: false, error: "New password must be at least 6 characters long." };
  }

  try {
    await ensureDbSchema();
    const existingRows: any[] = await prisma.$queryRawUnsafe(
      `SELECT id, role, email, status, createdAt FROM "User" WHERE id = ? LIMIT 1`,
      hubAdminId
    );
    const existing = existingRows[0];

    if (!existing || existing.role !== "admin") {
      return { success: false, error: "Hub Admin account not found." };
    }

    if (email !== existing.email?.toLowerCase()) {
      const emailTakenRows: any[] = await prisma.$queryRawUnsafe(
        `SELECT id FROM "User" WHERE lower(email) = ? AND id != ? LIMIT 1`,
        email,
        hubAdminId
      );
      if (emailTakenRows.length > 0) {
        return { success: false, error: "Another account with this email already exists." };
      }
    }

    const phone = data.phone?.trim() || null;
    const address = data.address?.trim() || null;

    if (password) {
      const passwordHash = await hashPassword(password);
      await prisma.$executeRawUnsafe(
        `UPDATE "User"
         SET name = ?, email = ?, phone = ?, address = ?, passwordHash = ?, updatedAt = CURRENT_TIMESTAMP
         WHERE id = ? AND role = 'admin'`,
        name,
        email,
        phone,
        address,
        passwordHash,
        hubAdminId
      );
    } else {
      await prisma.$executeRawUnsafe(
        `UPDATE "User"
         SET name = ?, email = ?, phone = ?, address = ?, updatedAt = CURRENT_TIMESTAMP
         WHERE id = ? AND role = 'admin'`,
        name,
        email,
        phone,
        address,
        hubAdminId
      );
    }

    const hubAdmin = {
      id: hubAdminId,
      name,
      email,
      phone,
      address,
      status: existing.status || "active",
      createdAt: existing.createdAt,
      updatedAt: new Date(),
    };

    revalidatePath("/");
    return { success: true, hubAdmin };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to update Hub Admin account" };
  }
}

export async function toggleHubAdminStatus(
  hubAdminId: string,
  nextStatus: "active" | "disabled"
) {
  const user = await getCurrentUser();
  if (!user || user.role !== "site_admin") {
    return {
      success: false,
      error: "Unauthorized. Only Site Admin can enable or disable Hub Admin accounts.",
    };
  }

  try {
    await ensureDbSchema();
    const existingRows: any[] = await prisma.$queryRawUnsafe(
      `SELECT id, role, name, email, phone, address, createdAt FROM "User" WHERE id = ? LIMIT 1`,
      hubAdminId
    );
    const existing = existingRows[0];

    if (!existing || existing.role !== "admin") {
      return { success: false, error: "Hub Admin account not found." };
    }

    await prisma.$executeRawUnsafe(
      `UPDATE "User" SET status = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ? AND role = 'admin'`,
      nextStatus,
      hubAdminId
    );

    const hubAdmin = {
      id: existing.id,
      name: existing.name,
      email: existing.email,
      phone: existing.phone,
      address: existing.address,
      status: nextStatus,
      createdAt: existing.createdAt,
      updatedAt: new Date(),
    };

    revalidatePath("/");
    return { success: true, hubAdmin };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to update Hub Admin status" };
  }
}

export async function deleteHubAdmin(hubAdminId: string) {
  const user = await getCurrentUser();
  if (!user || user.role !== "site_admin") {
    return {
      success: false,
      error: "Unauthorized. Only Site Admin can delete Hub Admin accounts.",
    };
  }

  try {
    await ensureDbSchema();
    const existingRows: any[] = await prisma.$queryRawUnsafe(
      `SELECT id, role FROM "User" WHERE id = ? LIMIT 1`,
      hubAdminId
    );
    const existing = existingRows[0];

    if (!existing || existing.role !== "admin") {
      return { success: false, error: "Hub Admin account not found." };
    }

    await prisma.$executeRawUnsafe(
      `DELETE FROM "User" WHERE id = ? AND role = 'admin'`,
      hubAdminId
    );

    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to delete Hub Admin account" };
  }
}
