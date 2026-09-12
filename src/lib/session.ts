import { cookies } from "next/headers";
import prisma from "@/lib/db";
import { signToken, verifyToken } from "@/lib/auth-crypto";

export interface SessionUser {
  id: string;
  role: string;
  name: string;
  email: string;
  phone?: string | null;
  address?: string | null;
}

const SESSION_COOKIE_NAME = "kialna_session_token";

export async function createSession(userId: string) {
  const cookieStore = await cookies();
  const token = signToken(userId);
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.COOKIE_SECURE === "true",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
}

export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
  // Also delete old legacy unencrypted cookie if present
  cookieStore.delete("kialna_session_user_id");
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const signedToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const legacyUserId = cookieStore.get("kialna_session_user_id")?.value;

  let userId: string | null = null;

  if (signedToken) {
    userId = verifyToken(signedToken);
  } else if (legacyUserId) {
    userId = legacyUserId;
  }

  if (!userId) {
    // Return null if no valid authenticated session
    return null;
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) return null;

    return {
      id: user.id,
      role: user.role,
      name: user.name,
      email: user.email,
      phone: user.phone,
      address: user.address,
    };
  } catch (error) {
    console.error("Session lookup error:", error);
    return null;
  }
}
