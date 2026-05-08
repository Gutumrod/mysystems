"use client";

import { addDays, format, parse, startOfWeek } from "date-fns";
import { th } from "date-fns/locale";
import { dateFnsLocalizer, Calendar, Views, type EventProps, type View } from "react-big-calendar";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { createBrowserClient } from "@/lib/supabase/client";
import type { Booking, ServiceItem } from "@/lib/types";
import { formatBookingSchedule, getBangkokISODateOffset, serviceNames, statusClass, statusLabel } from "@/lib/utils";

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay: (date: Date) => date.getDay(),
  locales: { th }
});

type CalendarEvent = {
  title: string;
  start: Date;
  end: Date;
  allDay: boolean;
  booking: Booking;
};

type BookingCalendarProps = {
  initialBookings: Booking[];
  services: ServiceItem[];
  shopId: string;
  demoMode?: boolean;
};

export function BookingCalendar({ initialBookings, services, shopId, demoMode = false }: BookingCalendarProps) {
  const supabase = useMemo(() => (demoMode ? null : createBrowserClient()), [demoMode]);
  const [bookings, setBookings] = useState(initialBookings);
  const [selected, setSelected] = useState<Booking | null>(null);
  const [date, setDate] = useState(new Date());
  const [view, setView] = useState<View>(Views.MONTH);

  const reload = useCallback(async () => {
    if (!supabase) return;
    const start = getBangkokISODateOffset(-180);
    const end = getBangkokISODateOffset(365);
    const { data, error } = await supabase
      .schema("bike_booking")
      .from("bookings")
      .select("*")
      .eq("shop_id", shopId)
      .gte("booking_date", start)
      .lte("booking_date", end)
      .order("booking_date")
      .returns<Booking[]>();

    if (!error) {
      setBookings(data ?? []);
    }
  }, [shopId, supabase]);

  useEffect(() => {
    if (!supabase) return;
    void reload();
    const channel = supabase
      .channel(`calendar-bookings-${shopId}`)
      .on("postgres_changes", { event: "*", schema: "bike_booking", table: "bookings", filter: `shop_id=eq.${shopId}` }, reload)
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [reload, shopId, supabase]);

  const events = bookings
    .map((booking) => ({
      title: `${booking.customer_name} · ${booking.bike_model}${booking.booking_kind === "daily" ? " (รายวัน)" : ""}`,
      start: booking.booking_kind === "daily"
        ? parse(booking.booking_date, "yyyy-MM-dd", new Date())
        : parseBookingDateTime(booking.booking_date, booking.booking_time_start ?? "00:00"),
      end: booking.booking_kind === "daily"
        ? addDays(parse(booking.booking_end_date ?? booking.booking_date, "yyyy-MM-dd", new Date()), 1)
        : parseBookingDateTime(booking.booking_date, booking.booking_time_end ?? "00:00"),
      allDay: booking.booking_kind === "daily" || view === Views.MONTH,
      booking
    }))
    .filter((event) => !Number.isNaN(event.start.getTime()) && !Number.isNaN(event.end.getTime()));
  const upcomingBookings = [...bookings]
    .sort((a, b) => {
      const left = a.booking_kind === "daily"
        ? `${a.booking_date} ${a.booking_end_date ?? a.booking_date}`
        : `${a.booking_date} ${a.booking_time_start ?? "00:00"}`;
      const right = b.booking_kind === "daily"
        ? `${b.booking_date} ${b.booking_end_date ?? b.booking_date}`
        : `${b.booking_date} ${b.booking_time_start ?? "00:00"}`;
      return left.localeCompare(right);
    })
    .slice(0, 12);

  return (
    <>
      <Calendar
        culture="th"
        localizer={localizer}
        date={date}
        view={view}
        onNavigate={setDate}
        onView={setView}
        events={events}
        startAccessor="start"
        endAccessor="end"
        allDayAccessor="allDay"
        views={["month", "week", "day"]}
        showAllEvents
        popup
        messages={{
          today: "วันนี้",
          previous: "ก่อนหน้า",
          next: "ถัดไป",
          month: "เดือน",
          week: "สัปดาห์",
          day: "วัน"
        }}
        onSelectEvent={(event) => setSelected(event.booking)}
        components={{ event: EventComponent }}
        eventPropGetter={(event) => ({
          className: statusClass(event.booking.status).replace("bg-", "!bg-").replace("text-", "!text-")
        })}
      />
      <div className="mt-5 rounded-lg border bg-muted/30">
        <div className="border-b px-4 py-3">
          <p className="text-sm font-semibold">รายการคิวในช่วงนี้</p>
        </div>
        <div className="divide-y">
          {upcomingBookings.length === 0 ? (
            <p className="px-4 py-3 text-sm text-muted-foreground">ยังไม่มีคิวในช่วงนี้</p>
          ) : null}
          {upcomingBookings.map((booking) => (
            <button
              key={booking.id}
              type="button"
              className="grid w-full gap-2 px-4 py-3 text-left text-sm transition-colors hover:bg-muted sm:grid-cols-[150px_1fr_auto] sm:items-center"
              onClick={() => setSelected(booking)}
            >
              <span className="font-semibold">
                {formatBookingSchedule(booking)}
              </span>
              <span className="min-w-0">
                <span className="block truncate font-medium">{booking.customer_name} · {booking.bike_model}</span>
                <span className="block truncate text-xs text-muted-foreground">{serviceNames(booking.service_items, services).join(", ") || "-"}</span>
              </span>
              <Badge className={statusClass(booking.status)}>{statusLabel(booking.status)}</Badge>
            </button>
          ))}
        </div>
      </div>
      <Dialog title="รายละเอียดการจอง" open={Boolean(selected)} onOpenChange={() => setSelected(null)}>
        {selected ? (
          <div className="flex flex-col gap-3 text-sm">
            <Badge className={statusClass(selected.status)}>{statusLabel(selected.status)}</Badge>
            <p className="text-lg font-semibold">{selected.customer_name}</p>
            <p>โทร: {selected.customer_phone}</p>
            <p>รถ: {selected.bike_model} {selected.bike_year ?? ""}</p>
            <p>ช่วง: {formatBookingSchedule(selected)}</p>
            <p>บริการ: {serviceNames(selected.service_items, services).join(", ")}</p>
            <p>หมายเหตุ: {selected.additional_notes || "-"}</p>
          </div>
        ) : null}
      </Dialog>
    </>
  );
}

function EventComponent({ event }: EventProps<CalendarEvent>) {
  return <span className="text-xs font-semibold">{event.title}</span>;
}

function parseBookingDateTime(date: string, time: string) {
  return new Date(`${date}T${time.slice(0, 8)}`);
}
