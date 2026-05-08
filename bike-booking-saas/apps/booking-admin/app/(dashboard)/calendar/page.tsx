import { BookingCalendar } from "@/components/calendar/BookingCalendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { demoBookings, demoServices, hasSupabaseEnv } from "@/lib/mock-data";
import { getTenantShopContext } from "@/lib/tenant";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Booking, ServiceItem } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function CalendarPage() {
  if (!hasSupabaseEnv()) {
    return <CalendarShell bookings={demoBookings} services={demoServices} shopId="11111111-1111-1111-1111-111111111111" demoMode />;
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
      .limit(500)
      .returns<Booking[]>(),
    supabase.schema("bike_booking").from("service_items").select("*").eq("shop_id", shopId).returns<ServiceItem[]>()
  ]);

  return <CalendarShell bookings={bookings ?? []} services={services ?? []} shopId={shopId} />;
}

function CalendarShell({
  bookings,
  services,
  shopId,
  demoMode = false
}: {
  bookings: Booking[];
  services: ServiceItem[];
  shopId: string;
  demoMode?: boolean;
}) {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-bold">ปฏิทิน</h1>
        <p className="text-sm text-muted-foreground">ดูคิวแบบ Month, Week และ Day</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>ตารางคิว</CardTitle>
        </CardHeader>
        <CardContent>
          <BookingCalendar initialBookings={bookings} services={services} shopId={shopId} demoMode={demoMode} />
        </CardContent>
      </Card>
    </div>
  );
}
