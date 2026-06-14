import { cookies } from "next/headers";
import prisma from "@/lib/db";

export interface SessionUser {
  id: string;
  role: string;
  name: string;
  email: string;
  phone?: string | null;
  address?: string | null;
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const userId = cookieStore.get("kialna_session_user_id")?.value;

  if (!userId) {
    // Default to the first buyer from the seed if no session is set
    const defaultUser = await prisma.user.findFirst({
      where: { role: "buyer" },
    });
    if (defaultUser) {
      return {
        id: defaultUser.id,
        role: defaultUser.role,
        name: defaultUser.name,
        email: defaultUser.email,
        phone: defaultUser.phone,
        address: defaultUser.address,
      };
    }
    return null;
  }

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
}
