import type { NextRequest } from "next/server"

/**
 * Resolve the absolute URL origin of the current request.
 * Works in local dev, Vercel previews, and Vercel production.
 *
 * Priority:
 *   1. `origin` header (browser-sent, most reliable for client-initiated requests)
 *   2. Forwarded host/proto (Vercel edge proxy)
 *   3. NEXT_PUBLIC_APP_URL env (manual override, useful for server-initiated calls)
 *   4. host header (fallback, assumes https in production)
 *   5. localhost default
 */
export function getOrigin(req: NextRequest): string {
  const origin = req.headers.get("origin")
  if (origin && origin.startsWith("http")) return origin

  const forwardedProto = req.headers.get("x-forwarded-proto")
  const forwardedHost = req.headers.get("x-forwarded-host")
  if (forwardedHost) {
    const proto = forwardedProto ?? "https"
    return `${proto}://${forwardedHost}`
  }

  const envUrl = process.env.NEXT_PUBLIC_APP_URL
  if (envUrl && envUrl.startsWith("http")) return envUrl

  const host = req.headers.get("host")
  if (host) {
    const proto = host.startsWith("localhost") || host.startsWith("127.") ? "http" : "https"
    return `${proto}://${host}`
  }

  return "http://localhost:3000"
}
