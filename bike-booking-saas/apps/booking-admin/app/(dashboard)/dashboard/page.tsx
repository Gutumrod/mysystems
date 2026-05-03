import { DashboardClient } from "@/components/dashboard/DashboardClient";
import { demoBookings, demoServices, hasSupabaseEnv } from "@/lib/mock-data";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getBangkokMonthRange, getShopId } from "@/lib/utils";
import type { Booking, ServiceItem } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  if (!hasSupabaseEnv()) {
    return <DashboardClient initialBookings={demoBookings} services={demoServices} shopId={getShopId()} demoMode />;
  }

  const supabase = await createSupabaseServerClient();
  const shopId = getShopId();
  const { start, end } = getBangkokMonthRange();
  const [{ data: bookings }, { data: services }] = await Promise.all([
    supabase
      .schema("bike_booking")
      .from("bookings")
      .select("*")
      .eq("shop_id", shopId)
      .gte("booking_date", start)
      .lte("booking_date", end)
      .order("booking_date")
      .returns<Booking[]>(),
    supabase.schema("bike_booking").from("service_items").select("*").eq("shop_id", shopId).order("sort_order").returns<ServiceItem[]>()
  ]);

  return <DashboardClient initialBookings={bookings ?? []} services={services ?? []} shopId={shopId} />;
}

