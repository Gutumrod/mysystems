import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { normalizeSignupSlug, signupRequestSchema } from "@/lib/signup";
import { getPortalModeFromHost } from "@/lib/portal";

// ── In-memory rate limiter ──────────────────────────────────────────
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_MAX = 5;            // 5 requests per window per IP

function checkRateLimit(ip: string): { allowed: boolean; retryAfterMs: number } {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now >= entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true, retryAfterMs: 0 };
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return { allowed: false, retryAfterMs: entry.resetAt - now };
  }

  entry.count += 1;
  return { allowed: true, retryAfterMs: 0 };
}

// Cleanup stale entries every 5 minutes (best-effort, no setInterval in serverless)
setInterval(() => {
  const now = Date.now();
  for (const [key, val] of rateLimitMap) {
    if (now >= val.resetAt) rateLimitMap.delete(key);
  }
}, 300_000).unref();

// ── Route ───────────────────────────────────────────────────────────
export async function POST(request: Request) {
  try {
    // ── Host check: only allow signup from control host ──────────────
    const host = request.headers.get("host");
    const mode = getPortalModeFromHost(host);
    if (mode !== "control") {
      return NextResponse.json(
        {
          ok: false,
          error: "forbidden",
          message: "การสมัครร้านใหม่ต้องทำผ่าน control.craftbikelab.com/signup เท่านั้น"
        },
        { status: 403 }
      );
    }

    // ── Rate limit ────────────────────────────────────────────────────
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      || request.headers.get("x-real-ip")
      || "unknown";
    const { allowed, retryAfterMs } = checkRateLimit(ip);
    if (!allowed) {
      return NextResponse.json(
        {
          ok: false,
          error: "rate_limited",
          message: "ส่งคำขอถี่เกินไป กรุณารอสักครู่แล้วลองใหม่"
        },
        {
          status: 429,
          headers: { "Retry-After": String(Math.ceil(retryAfterMs / 1000)) }
        }
      );
    }

    // ── Parse & validate ─────────────────────────────────────────────
    const payload = await request.json().catch(() => null);
    const parsed = signupRequestSchema.safeParse(payload);

    if (!parsed.success) {
      return NextResponse.json(
        {
          ok: false,
          error: "invalid_input",
          issues: parsed.error.flatten()
        },
        { status: 400 }
      );
    }

    const supabase = createSupabaseAdminClient();
    const input = parsed.data;
    const normalizedSlug = normalizeSignupSlug(input.slug);
    const requestedNote = input.note?.trim() || null;
    const requestedPhone = input.phone?.trim() || null;

    if (!normalizedSlug) {
      return NextResponse.json(
        {
          ok: false,
          error: "invalid_slug",
          message: "slug ไม่ถูกต้อง"
        },
        { status: 400 }
      );
    }

    const [{ data: existingShop }, { data: existingRequest }] = await Promise.all([
      supabase.schema("bike_booking").from("shops").select("id").eq("slug", normalizedSlug).maybeSingle(),
      supabase
        .schema("bike_booking")
        .from("signup_requests")
        .select("id")
        .eq("requested_slug", normalizedSlug)
        .in("status", ["pending", "approved"])
        .maybeSingle()
    ]);

    if (existingShop || existingRequest) {
      return NextResponse.json(
        {
          ok: false,
          error: "slug_taken",
          message: "slug นี้ถูกใช้งานแล้ว"
        },
        { status: 409 }
      );
    }

    const { data: createdUser, error: createUserError } = await supabase.auth.admin.createUser({
      email: input.email.trim(),
      password: input.password,
      email_confirm: true,
      user_metadata: {
        requested_shop_name: input.shopName.trim(),
        requested_slug: normalizedSlug
      }
    });

    const authUserId = createdUser?.user?.id ?? null;
    const createdFreshUser = Boolean(authUserId);

    if (createUserError || !authUserId) {
      // Return generic error — never leak whether email exists or reset existing user's password
      return NextResponse.json(
        {
          ok: false,
          error: "email_unavailable",
          message: "อีเมลนี้มีบัญชีอยู่แล้วในระบบ กรุณาเข้าระบบหรือใช้ลืมรหัสผ่าน"
        },
        { status: 409 }
      );
    }

    const { error: insertRequestError, data: requestRow } = await supabase
      .schema("bike_booking")
      .from("signup_requests")
      .insert({
        requested_email: input.email.trim(),
        requested_shop_name: input.shopName.trim(),
        requested_slug: normalizedSlug,
        requested_phone: requestedPhone,
        requested_note: requestedNote,
        auth_user_id: authUserId,
        status: "pending"
      })
      .select("*")
      .single();

    if (insertRequestError || !requestRow) {
      if (createdFreshUser && authUserId) {
        await supabase.auth.admin.deleteUser(authUserId);
      }

      return NextResponse.json(
        {
          ok: false,
          error: "request_create_failed",
          message: insertRequestError?.message || "สร้างคำขอสมัครไม่สำเร็จ"
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      signupRequestId: requestRow.id,
      authUserId,
      slug: normalizedSlug
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "unexpected_error";
    return NextResponse.json(
      {
        ok: false,
        error: "unexpected_error",
        message
      },
      { status: 500 }
    );
  }
}
