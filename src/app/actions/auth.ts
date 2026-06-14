"use server";

import { cookies } from "next/headers";
import prisma from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function switchRole(role: string) {
  const user = await prisma.user.findFirst({
    where: { role },
  });

  if (user) {
    const cookieStore = await cookies();
    cookieStore.set("kialna_session_user_id", user.id, {
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 1 week
    });
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
