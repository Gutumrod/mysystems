"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { BookingDetailDialog } from "@/components/bookings/BookingDetailDialog";
import type { Booking, BookingStatus, ServiceItem } from "@/lib/types";
import { isBookingActiveOnDate, statusClass, statusLabel } from "@/lib/utils";

type Props = {
  initialBookings: Booking[];
  services: ServiceItem[];
  demoMode?: boolean;
};

export function BookingsTable({ initialBookings, services, demoMode = false }: Props) {
  const [bookings, setBookings] = useState(initialBookings);
  const [query, setQuery] = useState("");
  const [date, setDate] = useState("");
  const [status, setStatus] = useState<BookingStatus | "all">("all");
  const [selected, setSelected] = useState<Booking | null>(null);

  const filtered = bookings.filter((booking) => {
    const matchesQuery = [booking.customer_name, booking.customer_phone, booking.bike_model].join(" ").toLowerCase().includes(query.toLowerCase());
    const matchesDate = !date || isBookingActiveOnDate(booking, date);
    const matchesStatus = status === "all" || booking.status === status;
    return matchesQuery && matchesDate && matchesStatus;
  });

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
              <th className="p-3">ช่วง</th>
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
                <td className="p-3">
                  {booking.booking_kind === "daily"
                    ? `${booking.booking_date} - ${booking.booking_end_date ?? booking.booking_date}`
                    : `${booking.booking_date} ${booking.booking_time_start?.slice(0, 5) ?? "--:--"} - ${booking.booking_time_end?.slice(0, 5) ?? "--:--"}`}
                </td>
                <td className="p-3">
                  {booking.customer_name}
                  <br />
                  <span className="text-muted-foreground">{booking.customer_phone}</span>
                </td>
                <td className="p-3">{booking.bike_model}</td>
                <td className="p-3">{booking.service_items.length} รายการ</td>
                <td className="p-3">
                  <Badge className={statusClass(booking.status)}>{statusLabel(booking.status)}</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <BookingDetailDialog
        booking={selected}
        services={services}
        open={Boolean(selected)}
        demoMode={demoMode}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
        onUpdated={(updated) => {
          setBookings((items) => items.map((item) => (item.id === updated.id ? updated : item)));
          setSelected(updated);
        }}
        onDeleted={(deletedId) => {
          setBookings((items) => items.filter((item) => item.id !== deletedId));
          setSelected(null);
        }}
      />
    </div>
  );
}
