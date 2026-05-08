import { endOfMonth, endOfWeek, format, isWithinInterval, parse, startOfMonth, startOfWeek } from "date-fns";
import { th } from "date-fns/locale";
import type { Booking, BookingKind, BookingStatus, ServiceItem } from "./types";

export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function getShopId() {
  return process.env.NEXT_PUBLIC_SHOP_ID ?? "11111111-1111-1111-1111-111111111111";
}

export function formatBangkokISODate(date = new Date()) {
  return date.toLocaleDateString("en-CA", { timeZone: "Asia/Bangkok" });
}

export function getBangkokISODateOffset(days: number, date = new Date()) {
  const [year, month, day] = formatBangkokISODate(date).split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day + days)).toISOString().slice(0, 10);
}

export function getBangkokMonthRange(date = new Date()) {
  const [year, month] = formatBangkokISODate(date).split("-").map(Number);
  const endDay = new Date(Date.UTC(year, month, 0)).getUTCDate();

  return {
    start: `${year}-${String(month).padStart(2, "0")}-01`,
    end: `${year}-${String(month).padStart(2, "0")}-${String(endDay).padStart(2, "0")}`
  };
}

export function formatThaiDate(date: string | Date) {
  const parsed = typeof date === "string" ? parse(date, "yyyy-MM-dd", new Date()) : date;
  return format(parsed, "d MMM yyyy", { locale: th });
}

export function statusLabel(status: BookingStatus) {
  return {
    confirmed: "ยืนยันแล้ว",
    in_progress: "กำลังทำ",
    completed: "เสร็จแล้ว",
    cancelled: "ยกเลิก",
    no_show: "ไม่มาตามนัด"
  }[status];
}

export function statusClass(status: BookingStatus) {
  return {
    confirmed: "bg-blue-100 text-blue-700",
    in_progress: "bg-yellow-100 text-yellow-800",
    completed: "bg-green-100 text-green-700",
    cancelled: "bg-red-100 text-red-700",
    no_show: "bg-slate-200 text-slate-700"
  }[status];
}

export function serviceNames(ids: string[], services: ServiceItem[]) {
  return ids.map((id) => services.find((service) => service.id === id)?.name).filter((name): name is string => Boolean(name));
}

export function formatBookingSchedule(booking: Booking) {
  if (booking.booking_kind === "daily") {
    const endDate = booking.booking_end_date ?? booking.booking_date;
    return `${formatThaiDate(booking.booking_date)} - ${formatThaiDate(endDate)}`;
  }

  const start = booking.booking_time_start?.slice(0, 5) || "--:--";
  const end = booking.booking_time_end?.slice(0, 5) || "--:--";
  return `${formatThaiDate(booking.booking_date)} · ${start} - ${end}`;
}

export function isBookingActiveOnDate(booking: Booking, date: string) {
  if (booking.booking_kind === "daily") {
    const endDate = booking.booking_end_date ?? booking.booking_date;
    return booking.booking_date <= date && endDate >= date;
  }

  return booking.booking_date === date;
}

export function bookingViewKindLabel(kind: BookingKind) {
  return kind === "daily" ? "รายวัน" : "รายชั่วโมง";
}

export function bookingStats(bookings: Booking[]) {
  const now = new Date();
  const today = formatBangkokISODate(now);
  const week = { start: startOfWeek(now), end: endOfWeek(now) };
  const month = { start: startOfMonth(now), end: endOfMonth(now) };

  return {
    today: bookings.filter((booking) => isBookingActiveOnDate(booking, today)).length,
    week: bookings.filter((booking) => {
      const start = parse(booking.booking_date, "yyyy-MM-dd", new Date());
      const end = parse(booking.booking_end_date ?? booking.booking_date, "yyyy-MM-dd", new Date());
      return isWithinInterval(start, week) || isWithinInterval(end, week) || (start <= week.start && end >= week.end);
    }).length,
    month: bookings.filter((booking) => {
      const start = parse(booking.booking_date, "yyyy-MM-dd", new Date());
      const end = parse(booking.booking_end_date ?? booking.booking_date, "yyyy-MM-dd", new Date());
      return isWithinInterval(start, month) || isWithinInterval(end, month) || (start <= month.start && end >= month.end);
    }).length
  };
}
