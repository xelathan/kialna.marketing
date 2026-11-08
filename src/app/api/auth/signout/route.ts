import { NextResponse } from "next/server";
import { destroySession } from "@/lib/session";

export async function GET(request: Request) {
  await destroySession();
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host") || "kialna.shop";
  const proto = request.headers.get("x-forwarded-proto") || "https";
  const url = new URL("/login", `${proto}://${host}`);
  return NextResponse.redirect(url);
}

export async function POST() {
  await destroySession();
  return NextResponse.json({ success: true });
}
