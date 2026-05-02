import { BookingsTable } from "@/components/bookings/BookingsTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { demoBookings, demoServices, hasSupabaseEnv } from "@/lib/mock-data";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getBangkokISODateOffset, getShopId } from "@/lib/utils";
import type { Booking, ServiceItem } from "@/lib/types";

export default async function BookingsPage() {
  if (!hasSupabaseEnv()) {
    return <BookingsShell bookings={demoBookings} services={demoServices} demoMode />;
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
      .order("booking_date", { ascending: false })
      .limit(500)
      .returns<Booking[]>(),
    supabase.schema("bike_booking").from("service_items").select("*").eq("shop_id", shopId).returns<ServiceItem[]>()
  ]);

  return <BookingsShell bookings={bookings ?? []} services={services ?? []} />;
}

function BookingsShell({ bookings, services, demoMode = false }: { bookings: Booking[]; services: ServiceItem[]; demoMode?: boolean }) {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-bold">การจอง</h1>
        <p className="text-sm text-muted-foreground">ค้นหา กรอง และจัดการรายการจองทั้งหมด</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>รายการจอง</CardTitle>
        </CardHeader>
        <CardContent>
          <BookingsTable initialBookings={bookings} services={services} demoMode={demoMode} />
        </CardContent>
      </Card>
    </div>
  );
}

