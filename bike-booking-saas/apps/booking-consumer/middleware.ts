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
 *
 * Base domain: booking.craftbikelab.com (no tenant prefix)
 * Vercel preview: craftbikelab-booking.vercel.app
 *              → slug blocked by reserved list / vercel.app check
 *              → falls back to NEXT_PUBLIC_SHOP_ID env var
 */

// Platform hostnames and product-level subdomains that are not tenant slugs.
const RESERVED_SLUGS = new Set([
  "booking",
  "booking-admin",
  "www",
  "staging",
  "preview",
  "api",
]);

export function getShopSlugFromHost(host: string): string | null {
  const parts = host.split(":");
  const domainOnly = parts[0];
  const domainParts = domainOnly.split(".");

  // 1. Localhost/IP checking
  const isLocalDev =
    domainOnly === "localhost" ||
    domainOnly === "127.0.0.1" ||
    domainOnly === "0.0.0.0" ||
    domainOnly.endsWith(".localhost");

  if (isLocalDev) {
    if (domainParts.length > 1 && domainParts[domainParts.length - 1] === "localhost") {
      return domainParts.slice(0, -1).join(".");
    }
    return null;
  }

  // 2. Vercel Preview domain checking
  if (domainOnly.endsWith(".vercel.app")) {
    return null;
  }

  // 3. Standard domains (e.g. shop.craftbikelab.com)
  if (domainParts.length >= 3) {
    return domainParts.slice(0, -2).join(".");
  }

  return null;
}

export function middleware(request: NextRequest) {
  const host = request.headers.get("host") ?? "";
  const rawSlug = getShopSlugFromHost(host);

  // Extract slug only when it represents a real tenant and is not reserved
  const slug = rawSlug && !RESERVED_SLUGS.has(rawSlug) ? rawSlug : null;

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
