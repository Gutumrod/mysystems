import { BookingCalendar } from "@/components/calendar/BookingCalendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { demoBookings, demoServices, hasSupabaseEnv } from "@/lib/mock-data";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getBangkokISODateOffset, getShopId } from "@/lib/utils";
import type { Booking, ServiceItem } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function CalendarPage() {
  if (!hasSupabaseEnv()) {
    return <CalendarShell bookings={demoBookings} services={demoServices} shopId={getShopId()} demoMode />;
  }

  const supabase = await createSupabaseServerClient();
  const shopId = getShopId();
  const start = getBangkokISODateOffset(-180);
  const end = getBangkokISODateOffset(365);
  const [{ data: bookings }, { data: services }] = await Promise.all([
    supabase
      .schema("bike_booking")
      .from("bookings")
      .select("*")
      .eq("shop_id", shopId)
      .gte("booking_date", start)
      .lte("booking_date", end)
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

