import { NextResponse } from "next/server";

const INTERNAL_API = process.env.INTERNAL_API_URL ?? "http://backend:8000";
const AUTH_COOKIE = "veicoli_token";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const res = await fetch(`${INTERNAL_API}/api/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return NextResponse.json(data, { status: res.status });
  }
  const response = NextResponse.json({ user: data.user });
  response.cookies.set(AUTH_COOKIE, data.access_token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
    secure: process.env.NODE_ENV === "production",
  });
  return response;
}
