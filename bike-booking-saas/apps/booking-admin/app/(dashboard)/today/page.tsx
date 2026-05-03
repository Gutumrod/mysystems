import { TodayBoard } from "@/components/today/TodayBoard";
import { demoBookings, demoServices, hasSupabaseEnv } from "@/lib/mock-data";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { formatBangkokISODate, getShopId } from "@/lib/utils";
import type { Booking, ServiceItem } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function TodayPage() {
  const shopId = getShopId();
  const today = formatBangkokISODate();

  if (!hasSupabaseEnv()) {
    return (
      <TodayBoard
        initialBookings={demoBookings.filter((booking) => booking.booking_date === today)}
        services={demoServices}
        shopId={shopId}
        today={today}
        demoMode
      />
    );
  }

  const supabase = await createSupabaseServerClient();
  const [{ data: bookings }, { data: services }] = await Promise.all([
    supabase
      .schema("bike_booking")
      .from("bookings")
      .select("*")
      .eq("shop_id", shopId)
      .eq("booking_date", today)
      .order("booking_time_start")
      .returns<Booking[]>(),
    supabase.schema("bike_booking").from("service_items").select("*").eq("shop_id", shopId).order("sort_order").returns<ServiceItem[]>()
  ]);

  return <TodayBoard initialBookings={bookings ?? []} services={services ?? []} shopId={shopId} today={today} />;
}
