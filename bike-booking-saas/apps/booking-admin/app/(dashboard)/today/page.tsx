import { TodayBoard } from "@/components/today/TodayBoard";
import { demoBookings, demoServices, hasSupabaseEnv } from "@/lib/mock-data";
import { getTenantShopContext } from "@/lib/tenant";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { formatBangkokISODate } from "@/lib/utils";
import type { Booking, ServiceItem } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function TodayPage() {
  const today = formatBangkokISODate();

  if (!hasSupabaseEnv()) {
    return (
      <TodayBoard
        initialBookings={demoBookings.filter((booking) => booking.booking_date <= today && (booking.booking_end_date ?? booking.booking_date) >= today)}
        services={demoServices}
        shopId="11111111-1111-1111-1111-111111111111"
        today={today}
        demoMode
      />
    );
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

  return <TodayBoard initialBookings={bookings ?? []} services={services ?? []} shopId={shopId} today={today} />;
}
