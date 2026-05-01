import { BookingCalendar } from "@/components/calendar/BookingCalendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { demoBookings, demoServices, hasSupabaseEnv } from "@/lib/mock-data";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getShopId } from "@/lib/utils";
import type { Booking, ServiceItem } from "@/lib/types";

export default async function CalendarPage() {
  if (!hasSupabaseEnv()) {
    return <CalendarShell bookings={demoBookings} services={demoServices} />;
  }

  const supabase = await createSupabaseServerClient();
  const shopId = getShopId();
  const [{ data: bookings }, { data: services }] = await Promise.all([
    supabase.schema("bike_booking").from("bookings").select("*").eq("shop_id", shopId).returns<Booking[]>(),
    supabase.schema("bike_booking").from("service_items").select("*").eq("shop_id", shopId).returns<ServiceItem[]>()
  ]);

  return <CalendarShell bookings={bookings ?? []} services={services ?? []} />;
}

function CalendarShell({ bookings, services }: { bookings: Booking[]; services: ServiceItem[] }) {
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
          <BookingCalendar bookings={bookings} services={services} />
        </CardContent>
      </Card>
    </div>
  );
}

