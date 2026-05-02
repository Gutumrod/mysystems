import { redirect } from "next/navigation";
import { hasSupabaseEnv } from "@/lib/mock-data";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getShopId } from "@/lib/utils";

export default async function Page() {
  if (!hasSupabaseEnv()) {
    redirect("/dashboard");
  }

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [{ data: platformUser }, { data: shopUser }] = await Promise.all([
    supabase
      .schema("bike_booking")
      .from("platform_users")
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .schema("bike_booking")
      .from("shop_users")
      .select("shop_id")
      .eq("shop_id", getShopId())
      .eq("user_id", user.id)
      .maybeSingle()
  ]);

  if (platformUser) {
    redirect("/platform");
  }

  if (shopUser) {
    redirect("/dashboard");
  }

  redirect("/unauthorized");
}
