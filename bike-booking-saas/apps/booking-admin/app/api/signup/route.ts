import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { normalizeSignupSlug, signupRequestSchema } from "@/lib/signup";

async function findExistingAuthUserIdByEmail(email: string) {
  const supabase = createSupabaseAdminClient();

  for (let page = 1; page <= 10; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 100 });

    if (error) {
      throw error;
    }

    const match = data.users.find((user) => user.email?.toLowerCase() === email.toLowerCase());
    if (match) {
      return match.id;
    }

    if (data.users.length < 100) {
      break;
    }
  }

  return null;
}

export async function POST(request: Request) {
  try {
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

    let authUserId = createdUser?.user?.id ?? null;
    const createdFreshUser = Boolean(authUserId);

    if (createUserError || !authUserId) {
      const existingAuthUserId = await findExistingAuthUserIdByEmail(input.email.trim());

      if (!existingAuthUserId) {
        return NextResponse.json(
          {
            ok: false,
            error: "auth_create_failed",
            message: createUserError?.message || "สร้างบัญชีไม่สำเร็จ"
          },
          { status: 400 }
        );
      }

      const { error: updateUserError } = await supabase.auth.admin.updateUserById(existingAuthUserId, {
        password: input.password,
        email_confirm: true
      });

      if (updateUserError) {
        return NextResponse.json(
          {
            ok: false,
            error: "auth_update_failed",
            message: updateUserError.message || "อัปเดตรหัสผ่านไม่สำเร็จ"
          },
          { status: 400 }
        );
      }

      authUserId = existingAuthUserId;
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
