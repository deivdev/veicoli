import { NextResponse } from "next/server";

const AUTH_COOKIE = "veicoli_token";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(AUTH_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
  return response;
}
