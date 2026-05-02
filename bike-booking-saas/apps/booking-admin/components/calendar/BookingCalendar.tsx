"use client";

import { format, parse, startOfWeek } from "date-fns";
import { th } from "date-fns/locale";
import { dateFnsLocalizer, Calendar, type EventProps } from "react-big-calendar";
import { useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import type { Booking, ServiceItem } from "@/lib/types";
import { serviceNames, statusClass, statusLabel } from "@/lib/utils";

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
  booking: Booking;
};

export function BookingCalendar({ bookings, services }: { bookings: Booking[]; services: ServiceItem[] }) {
  const [selected, setSelected] = useState<Booking | null>(null);
  const events = bookings.map((booking) => ({
    title: `${booking.customer_name} · ${booking.bike_model}`,
    start: parse(`${booking.booking_date} ${booking.booking_time_start.slice(0, 5)}`, "yyyy-MM-dd HH:mm", new Date()),
    end: parse(`${booking.booking_date} ${booking.booking_time_end.slice(0, 5)}`, "yyyy-MM-dd HH:mm", new Date()),
    booking
  }));

  return (
    <>
      <Calendar
        culture="th"
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        views={["month", "week", "day"]}
        onSelectEvent={(event) => setSelected(event.booking)}
        components={{ event: EventComponent }}
        eventPropGetter={(event) => ({
          className: statusClass(event.booking.status).replace("bg-", "!bg-").replace("text-", "!text-")
        })}
      />
      <Dialog title="รายละเอียดการจอง" open={Boolean(selected)} onOpenChange={() => setSelected(null)}>
        {selected ? (
          <div className="flex flex-col gap-3 text-sm">
            <Badge className={statusClass(selected.status)}>{statusLabel(selected.status)}</Badge>
            <p className="text-lg font-semibold">{selected.customer_name}</p>
            <p>โทร: {selected.customer_phone}</p>
            <p>รถ: {selected.bike_model} {selected.bike_year ?? ""}</p>
            <p>เวลา: {selected.booking_date} {selected.booking_time_start.slice(0, 5)} - {selected.booking_time_end.slice(0, 5)}</p>
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
