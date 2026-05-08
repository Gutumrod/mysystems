"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createBrowserClient } from "@/lib/supabase/client";
import type { Booking, BookingStatus, ServiceItem } from "@/lib/types";
import { bookingStats, formatBangkokISODate, formatBookingSchedule, isBookingActiveOnDate, serviceNames, statusClass, statusLabel } from "@/lib/utils";

type Props = {
  initialBookings: Booking[];
  services: ServiceItem[];
  shopId: string;
  demoMode?: boolean;
};

export function DashboardClient({ initialBookings, services, shopId, demoMode = false }: Props) {
  const supabase = useMemo(() => (demoMode ? null : createBrowserClient()), [demoMode]);
  const [bookings, setBookings] = useState(initialBookings);
  const [savingId, setSavingId] = useState<string | null>(null);
  const stats = bookingStats(bookings);
  const today = formatBangkokISODate();
  const todayBookings = bookings
    .filter((booking) => isBookingActiveOnDate(booking, today))
    .sort((a, b) => {
      const left = a.booking_kind === "daily" ? `${a.booking_date} ${a.booking_end_date ?? a.booking_date}` : `${a.booking_date} ${a.booking_time_start ?? "00:00"}`;
      const right = b.booking_kind === "daily" ? `${b.booking_date} ${b.booking_end_date ?? b.booking_date}` : `${b.booking_date} ${b.booking_time_start ?? "00:00"}`;
      return left.localeCompare(right);
    });

  const reload = useCallback(async () => {
    if (!supabase) return;
    const { data } = await supabase
      .schema("bike_booking")
      .from("bookings")
      .select("*")
      .eq("shop_id", shopId)
      .order("booking_date")
      .returns<Booking[]>();
    setBookings(data ?? []);
  }, [shopId, supabase]);

  useEffect(() => {
    if (!supabase) return;
    const timer = window.setInterval(reload, 30000);
    const channel = supabase
      .channel(`bookings-${shopId}`)
      .on("postgres_changes", { event: "*", schema: "bike_booking", table: "bookings", filter: `shop_id=eq.${shopId}` }, reload)
      .subscribe();
    return () => {
      window.clearInterval(timer);
      void supabase.removeChannel(channel);
    };
  }, [reload, shopId, supabase]);

  async function updateStatus(id: string, status: BookingStatus) {
    if (savingId) return;
    setSavingId(id);
    if (!supabase) {
      setBookings((items) => items.map((item) => (item.id === id ? { ...item, status, customer_showed_up: status === "completed" ? true : null } : item)));
      setSavingId(null);
      toast.success("อัปเดตสถานะแล้ว (โหมดตัวอย่าง)");
      return;
    }
    const { error } = await supabase.schema("bike_booking").from("bookings").update({ status, customer_showed_up: status === "completed" ? true : null }).eq("id", id);
    setSavingId(null);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("อัปเดตสถานะแล้ว");
    await reload();
  }

  async function markNoShow(id: string) {
    if (savingId) return;
    setSavingId(id);
    if (!supabase) {
      setBookings((items) => items.map((item) => (item.id === id ? { ...item, status: "no_show", customer_showed_up: false } : item)));
      setSavingId(null);
      toast.success("บันทึก No-show แล้ว (โหมดตัวอย่าง)");
      return;
    }
    const { error } = await supabase.schema("bike_booking").rpc("mark_booking_no_show", { target_booking_id: id });
    setSavingId(null);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("บันทึก No-show แล้ว");
    await reload();
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">คิววันนี้และภาพรวมล่าสุด</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <Stat title="วันนี้" value={stats.today} />
        <Stat title="สัปดาห์นี้" value={stats.week} />
        <Stat title="เดือนนี้" value={stats.month} />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>คิววันนี้</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {todayBookings.length === 0 ? <p className="text-sm text-muted-foreground">ยังไม่มีคิววันนี้</p> : null}
          {todayBookings.map((booking) => (
            <div key={booking.id} className="grid gap-3 rounded-md border bg-muted/40 p-4 lg:grid-cols-[120px_1fr_auto] lg:items-center">
              <div className="font-semibold">{booking.booking_kind === "daily" ? "ทั้งวัน" : `${booking.booking_time_start?.slice(0, 5) ?? "--:--"} - ${booking.booking_time_end?.slice(0, 5) ?? "--:--"}`}</div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium">{booking.customer_name}</p>
                  <Badge className={statusClass(booking.status)}>{statusLabel(booking.status)}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{formatBookingSchedule(booking)}</p>
                <p className="text-sm text-muted-foreground">{booking.bike_model} · {serviceNames(booking.service_items, services).join(", ")}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" disabled={savingId === booking.id} onClick={() => updateStatus(booking.id, "in_progress")}>เริ่มทำ</Button>
                <Button size="sm" disabled={savingId === booking.id} onClick={() => updateStatus(booking.id, "completed")}>ทำเสร็จ</Button>
                <Button size="sm" variant="destructive" disabled={savingId === booking.id} onClick={() => updateStatus(booking.id, "cancelled")}>ยกเลิก</Button>
                <Button size="sm" variant="ghost" disabled={savingId === booking.id} onClick={() => markNoShow(booking.id)}>No-show</Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({ title, value }: { title: string; value: number }) {
  return (
    <Card>
      <CardContent className="p-5">
        <p className="text-sm text-muted-foreground">{title}</p>
        <p className="mt-2 text-3xl font-bold">{value}</p>
      </CardContent>
    </Card>
  );
}

