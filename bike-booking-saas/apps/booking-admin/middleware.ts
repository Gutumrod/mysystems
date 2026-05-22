import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { ResponseCookie } from 'next/dist/compiled/@edge-runtime/cookies'

type CookieToSet = {
  name: string
  value: string
  options?: Partial<ResponseCookie>
}

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

export async function middleware(request: NextRequest) {
  const host = request.headers.get("host") ?? ""
  const requestHeaders = new Headers(request.headers)
  const rawSlug = getShopSlugFromHost(host)
  const reserved = new Set(["booking", "booking-admin", "admin", "control", "www", "staging", "preview", "api"])
  
  const tenantSlug = rawSlug && rawSlug.endsWith("-admin") ? rawSlug.slice(0, -6) : rawSlug

  if (rawSlug && !reserved.has(rawSlug) && tenantSlug) {
    requestHeaders.set("x-shop-slug", tenantSlug)
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return NextResponse.next({ request: { headers: requestHeaders } })
  }

  let supabaseResponse = NextResponse.next({ request: { headers: requestHeaders } })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request: { headers: requestHeaders } })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const isAuthRoute = request.nextUrl.pathname.startsWith('/login')
  const isPlatformRoute = request.nextUrl.pathname.startsWith('/platform')
  const shopAdminRoutes = ['/dashboard', '/bookings', '/calendar', '/services', '/settings']
  const isShopAdminRoute = request.nextUrl.pathname === '/' || shopAdminRoutes.some((prefix) => request.nextUrl.pathname.startsWith(prefix))

  let isPlatformAdmin = false
  if (user && isPlatformRoute) {
    const { data: platformUser } = await supabase
      .schema('bike_booking')
      .from('platform_users')
      .select('user_id')
      .eq('user_id', user.id)
      .maybeSingle()

    isPlatformAdmin = Boolean(platformUser)
  }

  if (!user && isShopAdminRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (!user && isPlatformRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (user && isPlatformRoute && !isPlatformAdmin) {
    const url = request.nextUrl.clone()
    url.pathname = '/unauthorized'
    return NextResponse.redirect(url)
  }

  if (user && isAuthRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
