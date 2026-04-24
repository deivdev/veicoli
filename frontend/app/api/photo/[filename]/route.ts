import { NextResponse } from "next/server";

const INTERNAL_API = process.env.INTERNAL_API_URL ?? "http://backend:8000";

type Ctx = { params: Promise<{ filename: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const { filename } = await ctx.params;
  const res = await fetch(`${INTERNAL_API}/uploads/${encodeURIComponent(filename)}`);
  if (!res.ok) return new NextResponse(null, { status: res.status });
  const buf = await res.arrayBuffer();
  const headers = new Headers();
  const ct = res.headers.get("content-type");
  if (ct) headers.set("content-type", ct);
  headers.set("cache-control", "private, max-age=60");
  return new NextResponse(buf, { status: 200, headers });
}
