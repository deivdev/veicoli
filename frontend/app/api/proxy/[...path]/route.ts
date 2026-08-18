import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const INTERNAL_API = process.env.INTERNAL_API_URL ?? "http://backend:8000";
const AUTH_COOKIE = "veicoli_token";

async function forward(req: Request, path: string[]) {
  const store = await cookies();
  const token = store.get(AUTH_COOKIE)?.value;
  const url = new URL(req.url);
  const qs = url.search;
  const upstream = `${INTERNAL_API}/api/${path.join("/")}${qs}`;

  const headers = new Headers();
  const incomingCT = req.headers.get("content-type");
  if (incomingCT) headers.set("content-type", incomingCT);
  if (token) headers.set("Authorization", `Bearer ${token}`);

  let body: BodyInit | undefined;
  if (req.method !== "GET" && req.method !== "HEAD") {
    body = await req.arrayBuffer();
  }

  // Next memorizza i fetch server-side nel Data Cache: senza no-store una GET
  // già vista tornerebbe dalla cache anche dopo una DELETE.
  const res = await fetch(upstream, { method: req.method, headers, body, cache: "no-store" });
  const outHeaders = new Headers();
  const ct = res.headers.get("content-type");
  if (ct) outHeaders.set("content-type", ct);
  // Nessuna risposta dell'API va in cache nel browser: dopo una mutation il
  // refetch di React Query deve colpire il backend, non la cache HTTP.
  outHeaders.set("cache-control", "no-store, must-revalidate");
  // 204/304 non ammettono un body: passarlo fa fallire il costruttore Response.
  if (res.status === 204 || res.status === 304) {
    return new NextResponse(null, {
      status: res.status,
      headers: { "cache-control": "no-store, must-revalidate" },
    });
  }
  const buf = await res.arrayBuffer();
  return new NextResponse(buf, { status: res.status, headers: outHeaders });
}

type Ctx = { params: Promise<{ path: string[] }> };

export async function GET(req: Request, ctx: Ctx) {
  const { path } = await ctx.params;
  return forward(req, path);
}
export async function POST(req: Request, ctx: Ctx) {
  const { path } = await ctx.params;
  return forward(req, path);
}
export async function PATCH(req: Request, ctx: Ctx) {
  const { path } = await ctx.params;
  return forward(req, path);
}
export async function DELETE(req: Request, ctx: Ctx) {
  const { path } = await ctx.params;
  return forward(req, path);
}
