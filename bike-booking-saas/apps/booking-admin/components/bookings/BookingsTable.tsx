"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { createBrowserClient } from "@/lib/supabase/client";
import type { Booking, BookingStatus, ServiceItem } from "@/lib/types";
import { serviceNames, statusClass, statusLabel } from "@/lib/utils";

type Props = {
  initialBookings: Booking[];
  services: ServiceItem[];
  demoMode?: boolean;
};

export function BookingsTable({ initialBookings, services, demoMode = false }: Props) {
  const supabase = useMemo(() => (demoMode ? null : createBrowserClient()), [demoMode]);
  const [bookings, setBookings] = useState(initialBookings);
  const [query, setQuery] = useState("");
  const [date, setDate] = useState("");
  const [status, setStatus] = useState<BookingStatus | "all">("all");
  const [selected, setSelected] = useState<Booking | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const filtered = bookings.filter((booking) => {
    const matchesQuery = [booking.customer_name, booking.customer_phone, booking.bike_model].join(" ").toLowerCase().includes(query.toLowerCase());
    const matchesDate = !date || booking.booking_date === date;
    const matchesStatus = status === "all" || booking.status === status;
    return matchesQuery && matchesDate && matchesStatus;
  });

  async function updateStatus(id: string, nextStatus: BookingStatus) {
    if (isSaving) return;
    setIsSaving(true);
    if (!supabase) {
      const current = bookings.find((item) => item.id === id);
      if (!current) {
        setIsSaving(false);
        return;
      }
      const data = { ...current, status: nextStatus };
      setBookings((items) => items.map((item) => (item.id === id ? data : item)));
      setSelected(data);
      setIsSaving(false);
      toast.success("อัปเดตแล้ว (โหมดตัวอย่าง)");
      return;
    }

    if (nextStatus === "no_show") {
      const { error } = await supabase.schema("bike_booking").rpc("mark_booking_no_show", { target_booking_id: id });
      setIsSaving(false);

      if (error) {
        toast.error(error.message);
        return;
      }

      const current = bookings.find((item) => item.id === id);
      const data = current ? { ...current, status: nextStatus, customer_showed_up: false } : null;
      if (data) {
        setBookings((items) => items.map((item) => (item.id === id ? data : item)));
        setSelected(data);
      }
      toast.success("บันทึกไม่มาตามนัดแล้ว");
      return;
    }

    const { data, error } = await supabase.schema("bike_booking").from("bookings").update({ status: nextStatus }).eq("id", id).select("*").single<Booking>();
    setIsSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setBookings((items) => items.map((item) => (item.id === id ? data : item)));
    setSelected(data);
    toast.success("อัปเดตแล้ว");
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-3 lg:grid-cols-[1fr_180px_180px]">
        <Input placeholder="ค้นหา ชื่อ/เบอร์/รถ" value={query} onChange={(event) => setQuery(event.target.value)} />
        <Input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
        <select className="min-h-10 rounded-md border border-border bg-muted px-3 text-sm text-foreground outline-none" value={status} onChange={(event) => setStatus(event.target.value as BookingStatus | "all")}>
          <option value="all">ทุกสถานะ</option>
          <option value="confirmed">ยืนยันแล้ว</option>
          <option value="in_progress">กำลังทำ</option>
          <option value="completed">เสร็จแล้ว</option>
          <option value="cancelled">ยกเลิก</option>
          <option value="no_show">ไม่มาตามนัด</option>
        </select>
      </div>
      <div className="overflow-x-auto rounded-lg border bg-card">
        <table className="w-full min-w-[860px] text-left text-sm">
          <thead className="bg-muted text-xs uppercase text-muted-foreground">
            <tr>
              <th className="p-3">วันที่</th>
              <th className="p-3">เวลา</th>
              <th className="p-3">ลูกค้า</th>
              <th className="p-3">รถ</th>
              <th className="p-3">บริการ</th>
              <th className="p-3">สถานะ</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((booking) => (
              <tr key={booking.id} className="cursor-pointer border-t hover:bg-muted/60" onClick={() => setSelected(booking)}>
                <td className="p-3">{booking.booking_date}</td>
                <td className="p-3">{booking.booking_time_start.slice(0, 5)} - {booking.booking_time_end.slice(0, 5)}</td>
                <td className="p-3">{booking.customer_name}<br /><span className="text-muted-foreground">{booking.customer_phone}</span></td>
                <td className="p-3">{booking.bike_model}</td>
                <td className="p-3">{serviceNames(booking.service_items, services).join(", ")}</td>
                <td className="p-3"><Badge className={statusClass(booking.status)}>{statusLabel(booking.status)}</Badge></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Dialog title="รายละเอียดการจอง" open={Boolean(selected)} onOpenChange={() => setSelected(null)}>
        {selected ? (
          <div className="flex flex-col gap-4 text-sm">
            <div>
              <p className="text-lg font-semibold">{selected.customer_name}</p>
              <p className="text-muted-foreground">{selected.customer_phone}</p>
            </div>
            <div className="rounded-md border bg-muted/40 p-3">
              <p className="font-medium">วันที่ {selected.booking_date}</p>
              <p className="text-muted-foreground">
                เวลา {selected.booking_time_start.slice(0, 5)} - {selected.booking_time_end.slice(0, 5)} น.
              </p>
            </div>
            <p>รถ: {selected.bike_model} {selected.bike_year ?? ""}</p>
            <p>บริการ: {serviceNames(selected.service_items, services).join(", ")}</p>
            <p>หมายเหตุ: {selected.additional_notes || "-"}</p>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" disabled={isSaving} onClick={() => updateStatus(selected.id, "in_progress")}>เริ่มทำ</Button>
              <Button size="sm" disabled={isSaving} onClick={() => updateStatus(selected.id, "completed")}>ทำเสร็จ</Button>
              <Button size="sm" variant="destructive" disabled={isSaving} onClick={() => updateStatus(selected.id, "cancelled")}>ยกเลิก</Button>
              <Button size="sm" variant="outline" disabled={isSaving} onClick={() => updateStatus(selected.id, "no_show")}>ไม่มาตามนัด</Button>
            </div>
          </div>
        ) : null}
      </Dialog>
    </div>
  );
}

