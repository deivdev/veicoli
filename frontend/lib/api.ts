/**
 * Client-side API wrapper. Talks to our Next.js /api/proxy route, which
 * forwards the cookie (and its JWT) to the FastAPI backend.
 */
export async function apiClient<T = unknown>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body && !headers.has("content-type") && !(init.body instanceof FormData)) {
    headers.set("content-type", "application/json");
  }
  const res = await fetch(`/api/proxy${path}`, {
    ...init,
    headers,
    credentials: "include",
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status}: ${text || res.statusText}`);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}
