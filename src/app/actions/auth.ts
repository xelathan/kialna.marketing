"use server";

import prisma from "@/lib/db";
import { createSession, destroySession } from "@/lib/session";
import { hashPassword, verifyPassword } from "@/lib/auth-crypto";
import { revalidatePath } from "next/cache";

export async function signIn(formData: { email: string; password?: string }) {
  const email = formData.email?.trim().toLowerCase();
  const password = formData.password || "";

  if (!email) {
    return { success: false, error: "Email is required." };
  }

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    return { success: false, error: "No account found with this email." };
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
  return { success: true, user: { id: user.id, email: user.email, role: user.role, name: user.name } };
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

  const existing = await prisma.user.findUnique({
    where: { email },
  });

  if (existing) {
    return { success: false, error: "An account with this email already exists." };
  }

  const passwordHash = await hashPassword(password);

  const newUser = await prisma.user.create({
    data: {
      name,
      email,
      role,
      passwordHash,
      phone: data.phone?.trim() || null,
      address: data.address?.trim() || null,
    },
  });

  await createSession(newUser.id);
  revalidatePath("/");
  return {
    success: true,
    user: {
      id: newUser.id,
      email: newUser.email,
      role: newUser.role,
      name: newUser.name,
    },
  };
}

export async function signOut() {
  await destroySession();
  revalidatePath("/");
  return { success: true };
}

export async function switchRole(role: string) {
  const user = await prisma.user.findFirst({
    where: { role },
  });

  if (user) {
    await createSession(user.id);
    revalidatePath("/");
    return { success: true, user };
  }

  return { success: false, error: `No user with role "${role}" found.` };
}

export async function getAllUsers() {
  return await prisma.user.findMany({
    orderBy: { role: "asc" },
  });
}
