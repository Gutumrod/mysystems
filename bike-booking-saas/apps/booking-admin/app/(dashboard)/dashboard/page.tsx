import { DashboardClient } from "@/components/dashboard/DashboardClient";
import { demoBookings, demoServices, hasSupabaseEnv } from "@/lib/mock-data";
import { getTenantShopContext } from "@/lib/tenant";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Booking, ServiceItem } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  if (!hasSupabaseEnv()) {
    return <DashboardClient initialBookings={demoBookings} services={demoServices} shopId="11111111-1111-1111-1111-111111111111" demoMode />;
  }

  const supabase = await createSupabaseServerClient();
  const { shopId } = await getTenantShopContext(supabase);
  if (!shopId) return null;
  const [{ data: bookings }, { data: services }] = await Promise.all([
    supabase
      .schema("bike_booking")
      .from("bookings")
      .select("*")
      .eq("shop_id", shopId)
      .order("booking_date")
      .returns<Booking[]>(),
    supabase.schema("bike_booking").from("service_items").select("*").eq("shop_id", shopId).order("sort_order").returns<ServiceItem[]>()
  ]);

  return <DashboardClient initialBookings={bookings ?? []} services={services ?? []} shopId={shopId} />;
}
