import { NextRequest, NextResponse } from "next/server";

/**
 * Subdomain-based multi-tenant routing middleware.
 *
 * Production:  bangkok-bike-care.booking.craftbikelab.com
 *              → extracts slug "bangkok-bike-care"
 *              → sets request header x-shop-slug = "bangkok-bike-care"
 *
 * Local dev:   localhost:3000
 *              → no subdomain detected
 *              → x-shop-slug header is NOT set
 *              → page.tsx falls back to NEXT_PUBLIC_SHOP_ID env var
 */
export function middleware(request: NextRequest) {
  const host = request.headers.get("host") ?? "";

  // Detect local development environment
  const isLocalDev =
    host.startsWith("localhost") ||
    host.startsWith("127.0.0.1") ||
    host.startsWith("0.0.0.0");

  // Extract slug from subdomain (first segment before the first dot)
  // e.g. "bangkok-bike-care.booking.craftbikelab.com" → "bangkok-bike-care"
  const slug = isLocalDev ? null : host.split(".")[0];

  const requestHeaders = new Headers(request.headers);

  if (slug) {
    requestHeaders.set("x-shop-slug", slug);
  }

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: [
    /*
     * Match all request paths except static assets and Next.js internals.
     * This ensures the middleware runs on page requests but not on:
     * - _next/static  (JS/CSS bundles)
     * - _next/image   (image optimisation)
     * - favicon.ico, robots.txt, sitemap.xml
     * - image files served from /public
     */
    "/((?!_next/static|_next/image|favicon\\.ico|sitemap\\.xml|robots\\.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
