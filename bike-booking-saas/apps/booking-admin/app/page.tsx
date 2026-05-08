import { redirect } from "next/navigation";
import { hasSupabaseEnv } from "@/lib/mock-data";
import { getTenantShopContext } from "@/lib/tenant";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function Page() {
  if (!hasSupabaseEnv()) {
    redirect("/dashboard");
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { shopId } = await getTenantShopContext(supabase);

  const [{ data: platformUser }, { data: shopUser }] = await Promise.all([
    supabase.schema("bike_booking").from("platform_users").select("user_id").eq("user_id", user.id).maybeSingle(),
    shopId
      ? supabase
          .schema("bike_booking")
          .from("shop_users")
          .select("shop_id")
          .eq("shop_id", shopId)
          .eq("user_id", user.id)
          .maybeSingle()
      : Promise.resolve({ data: null })
  ]);

  if (platformUser) {
    redirect("/platform");
  }

  if (shopUser) {
    redirect("/dashboard");
  }

  redirect("/unauthorized");
}
