"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Bike, CheckCircle2, Clock, Phone, Play, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createBrowserClient } from "@/lib/supabase/client";
import type { Booking, BookingStatus, ServiceItem } from "@/lib/types";
import { formatBookingSchedule, isBookingActiveOnDate, serviceNames, statusClass, statusLabel } from "@/lib/utils";

type Props = {
  initialBookings: Booking[];
  services: ServiceItem[];
  shopId: string;
  today: string;
  demoMode?: boolean;
};

export function TodayBoard({ initialBookings, services, shopId, today, demoMode = false }: Props) {
  const supabase = useMemo(() => (demoMode ? null : createBrowserClient()), [demoMode]);
  const [bookings, setBookings] = useState(initialBookings);
  const [savingId, setSavingId] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!supabase) return;
    const { data, error } = await supabase
      .schema("bike_booking")
      .from("bookings")
      .select("*")
      .eq("shop_id", shopId)
      .eq("booking_date", today)
      .order("booking_time_start")
      .returns<Booking[]>();

    if (!error) {
      setBookings(data ?? []);
    }
  }, [shopId, supabase, today]);

  useEffect(() => {
    if (!supabase) return;
    void reload();
    const timer = window.setInterval(reload, 30000);
    const channel = supabase
      .channel(`today-bookings-${shopId}`)
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
      setBookings((items) => items.map((item) => (item.id === id ? { ...item, status } : item)));
      setSavingId(null);
      toast.success("อัปเดตแล้ว (โหมดตัวอย่าง)");
      return;
    }

    const { error } = await supabase.schema("bike_booking").from("bookings").update({ status }).eq("id", id);
    setSavingId(null);
    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("อัปเดตสถานะแล้ว");
    await reload();
  }

  const activeToday = bookings.filter((booking) => isBookingActiveOnDate(booking, today));
  const confirmedCount = activeToday.filter((booking) => booking.status === "confirmed").length;
  const inProgressCount = activeToday.filter((booking) => booking.status === "in_progress").length;
  const completedCount = activeToday.filter((booking) => booking.status === "completed").length;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold">งานวันนี้</h1>
        <p className="text-sm text-muted-foreground">หน้าร้านใช้ดูคิวและเปลี่ยนสถานะงานประจำวันที่ {today}</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        <TodayStat title="คิวทั้งหมด" value={bookings.length} />
        <TodayStat title="รอเริ่ม" value={confirmedCount} />
        <TodayStat title="กำลังทำ" value={inProgressCount} />
        <TodayStat title="เสร็จแล้ว" value={completedCount} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>ลำดับงานหน้าร้าน</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {activeToday.length === 0 ? (
            <div className="rounded-lg border bg-muted/30 p-6 text-center text-sm text-muted-foreground">ยังไม่มีคิววันนี้</div>
          ) : null}

          {activeToday
            .sort((a, b) => {
              const left = a.booking_kind === "daily" ? `${a.booking_date} ${a.booking_end_date ?? a.booking_date}` : `${a.booking_date} ${a.booking_time_start ?? "00:00"}`;
              const right = b.booking_kind === "daily" ? `${b.booking_date} ${b.booking_end_date ?? b.booking_date}` : `${b.booking_date} ${b.booking_time_start ?? "00:00"}`;
              return left.localeCompare(right);
            })
            .map((booking) => (
            <div key={booking.id} className="grid gap-4 rounded-lg border bg-muted/30 p-4 lg:grid-cols-[140px_1fr_auto] lg:items-center">
              <div className="flex items-center gap-2 text-xl font-bold">
                <Clock className="size-5 text-primary" />
                {booking.booking_kind === "daily" ? "ทั้งวัน" : booking.booking_time_start?.slice(0, 5) ?? "--:--"}
              </div>

              <div className="min-w-0 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-lg font-semibold">{booking.customer_name}</p>
                  <Badge className={statusClass(booking.status)}>{statusLabel(booking.status)}</Badge>
                </div>
                <div className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
                  <span className="flex items-center gap-2">
                    <Phone className="size-4" />
                    {booking.customer_phone}
                  </span>
                  <span className="flex items-center gap-2">
                    <Bike className="size-4" />
                    {booking.bike_model} {booking.bike_year ?? ""}
                  </span>
                </div>
                <p className="text-sm">{formatBookingSchedule(booking)}</p>
                <p className="text-sm">{serviceNames(booking.service_items, services).join(", ") || "-"}</p>
                {booking.additional_notes ? <p className="rounded-md bg-card px-3 py-2 text-sm text-muted-foreground">{booking.additional_notes}</p> : null}
              </div>

              <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap lg:justify-end">
                <Button size="sm" variant="outline" disabled={savingId === booking.id} onClick={() => updateStatus(booking.id, "in_progress")}>
                  <Play className="size-4" />
                  เริ่มทำ
                </Button>
                <Button size="sm" disabled={savingId === booking.id} onClick={() => updateStatus(booking.id, "completed")}>
                  <CheckCircle2 className="size-4" />
                  เสร็จ
                </Button>
                <Button size="sm" variant="destructive" disabled={savingId === booking.id} onClick={() => updateStatus(booking.id, "cancelled")}>
                  <XCircle className="size-4" />
                  ยกเลิก
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function TodayStat({ title, value }: { title: string; value: number }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-sm text-muted-foreground">{title}</p>
        <p className="mt-2 text-3xl font-bold">{value}</p>
      </CardContent>
    </Card>
  );
}
