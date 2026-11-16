"use server";

import crypto from "node:crypto";
import prisma, { ensureDbSchema } from "@/lib/db";
import { createSession, destroySession, getCurrentUser } from "@/lib/session";
import { hashPassword, verifyPassword } from "@/lib/auth-crypto";
import { revalidatePath } from "next/cache";

export async function signIn(formData: { email: string; password?: string }) {
  const email = formData.email?.trim().toLowerCase();
  const password = formData.password || "";

  if (!email) {
    return { success: false, error: "Email is required." };
  }

  try {
    await ensureDbSchema();
    const rows: any[] = await prisma.$queryRawUnsafe(
      `SELECT id, role, status, name, email, passwordHash
       FROM "User"
       WHERE lower(email) = ?
       LIMIT 1`,
      email
    );
    const user = rows[0];

    if (!user) {
      return { success: false, error: "No account found with this email." };
    }

    if (user.status === "disabled") {
      return {
        success: false,
        error: "This account has been disabled by the Site Admin. Please contact support.",
      };
    }

    // If user has a passwordHash, verify it
    if (user.passwordHash) {
      if (!password) {
        return { success: false, error: "Password is required." };
      }
      const isValid = await verifyPassword(password, user.passwordHash);
      if (!isValid) {
        return { success: false, error: "Incorrect password. Please try again." };
      }
    }

    await createSession(user.id);
    revalidatePath("/");
    return {
      success: true,
      user: { id: user.id, email: user.email, role: user.role, name: user.name },
    };
  } catch (error: any) {
    console.error("Sign in error:", error);
    return { success: false, error: error.message || "Sign in failed. Please try again." };
  }
}

export async function signUp(data: {
  name: string;
  email: string;
  password?: string;
  role: "buyer" | "seller";
  phone?: string;
  address?: string;
}) {
  const email = data.email?.trim().toLowerCase();
  const name = data.name?.trim();
  const role = data.role === "seller" ? "seller" : "buyer";
  const password = data.password || "password123";

  if (!name) {
    return { success: false, error: "Full Name is required." };
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
    const address = data.address?.trim() || null;

    await prisma.$executeRawUnsafe(
      `INSERT INTO "User" (id, role, status, name, email, phone, address, passwordHash, createdAt, updatedAt)
       VALUES (?, ?, 'active', ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      newId,
      role,
      name,
      email,
      phone,
      address,
      passwordHash
    );

    await createSession(newId);
    revalidatePath("/");
    return {
      success: true,
      user: {
        id: newId,
        email,
        role,
        name,
      },
    };
  } catch (error: any) {
    console.error("Sign up error:", error);
    return {
      success: false,
      error: error.message || "Registration failed. Please try again.",
    };
  }
}

export async function signOut() {
  await destroySession();
  revalidatePath("/");
  return { success: true };
}

export async function switchRole(role: string) {
  try {
    await ensureDbSchema();

    const activeRows: any[] = await prisma.$queryRawUnsafe(
      `SELECT id, role, status, name, email, phone, address
       FROM "User"
       WHERE role = ? AND (status IS NULL OR status != 'disabled')
       LIMIT 1`,
      role
    );

    let user = activeRows[0] || null;

    // Auto-provision Site Admin if not yet seeded in existing DB
    if (!user && role === "site_admin") {
      const passwordHash = await hashPassword("password123");
      const existingSiteAdmin: any[] = await prisma.$queryRawUnsafe(
        `SELECT id FROM "User" WHERE lower(email) = 'siteadmin@kialna.shop' LIMIT 1`
      );
      if (existingSiteAdmin.length > 0) {
        const id = existingSiteAdmin[0].id;
        await prisma.$executeRawUnsafe(
          `UPDATE "User" SET role = 'site_admin', status = 'active', updatedAt = CURRENT_TIMESTAMP WHERE id = ?`,
          id
        );
        user = {
          id,
          role: "site_admin",
          name: "Kialna Site Admin",
          email: "siteadmin@kialna.shop",
        };
      } else {
        const newId = crypto.randomUUID();
        await prisma.$executeRawUnsafe(
          `INSERT INTO "User" (id, role, status, name, email, phone, address, passwordHash, createdAt, updatedAt)
           VALUES (?, 'site_admin', 'active', 'Kialna Site Admin', 'siteadmin@kialna.shop', '+18005550199', 'Kialna Global HQ & Saigon Hub Oversight', ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
          newId,
          passwordHash
        );
        user = {
          id: newId,
          role: "site_admin",
          name: "Kialna Site Admin",
          email: "siteadmin@kialna.shop",
        };
      }
    }

    if (user) {
      await createSession(user.id);
      revalidatePath("/");
      return { success: true, user };
    }

    return {
      success: false,
      error: `No active user with role "${role}" found (account may be disabled or deleted).`,
    };
  } catch (error: any) {
    console.error("Switch role error:", error);
    return { success: false, error: error.message || "Failed to switch role." };
  }
}

export async function getAllUsers() {
  return await prisma.user.findMany({
    orderBy: { role: "asc" },
  });
}

export async function updateUserProfile(data: {
  name?: string;
  phone?: string | null;
  address?: string | null;
  logo?: string | null;
  bankName?: string | null;
  bankAccountNumber?: string | null;
  bankAccountName?: string | null;
  vietQrImage?: string | null;
}) {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: "Unauthorized. Please sign in." };
  }

  try {
    await ensureDbSchema();
    const nextName = data.name !== undefined ? data.name.trim() : user.name;
    const nextPhone = data.phone !== undefined ? data.phone?.trim() || null : user.phone ?? null;
    const nextAddress = data.address !== undefined ? data.address?.trim() || null : user.address ?? null;
    const nextLogo = data.logo !== undefined ? data.logo || null : user.logo ?? null;
    const nextBankName = data.bankName !== undefined ? data.bankName?.trim() || null : user.bankName ?? null;
    const nextBankAccountNumber =
      data.bankAccountNumber !== undefined ? data.bankAccountNumber?.trim() || null : user.bankAccountNumber ?? null;
    const nextBankAccountName =
      data.bankAccountName !== undefined
        ? data.bankAccountName?.trim().toUpperCase() || null
        : user.bankAccountName ?? null;
    const nextVietQrImage = data.vietQrImage !== undefined ? data.vietQrImage || null : user.vietQrImage ?? null;

    await prisma.$executeRawUnsafe(
      `UPDATE "User"
       SET name = ?, phone = ?, address = ?, logo = ?, bankName = ?, bankAccountNumber = ?, bankAccountName = ?, vietQrImage = ?, updatedAt = CURRENT_TIMESTAMP
       WHERE id = ?`,
      nextName,
      nextPhone,
      nextAddress,
      nextLogo,
      nextBankName,
      nextBankAccountNumber,
      nextBankAccountName,
      nextVietQrImage,
      user.id
    );

    revalidatePath("/");
    return {
      success: true,
      user: {
        id: user.id,
        name: nextName,
        email: user.email,
        role: user.role,
        phone: nextPhone,
        address: nextAddress,
        logo: nextLogo,
        bankName: nextBankName,
        bankAccountNumber: nextBankAccountNumber,
        bankAccountName: nextBankAccountName,
        vietQrImage: nextVietQrImage,
      },
    };
  } catch (error: any) {
    console.error("Profile update error:", error);
    return { success: false, error: error.message || "Failed to update profile." };
  }
}
