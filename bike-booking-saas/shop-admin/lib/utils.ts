import { endOfMonth, endOfWeek, format, isWithinInterval, parse, startOfMonth, startOfWeek } from "date-fns";
import { th } from "date-fns/locale";
import type { Booking, BookingStatus, ServiceItem } from "./types";

export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function getShopId() {
  return process.env.NEXT_PUBLIC_SHOP_ID ?? "11111111-1111-1111-1111-111111111111";
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

export function bookingStats(bookings: Booking[]) {
  const now = new Date();
  const today = format(now, "yyyy-MM-dd");
  const week = { start: startOfWeek(now), end: endOfWeek(now) };
  const month = { start: startOfMonth(now), end: endOfMonth(now) };

  return {
    today: bookings.filter((booking) => booking.booking_date === today).length,
    week: bookings.filter((booking) => isWithinInterval(parse(booking.booking_date, "yyyy-MM-dd", new Date()), week)).length,
    month: bookings.filter((booking) => isWithinInterval(parse(booking.booking_date, "yyyy-MM-dd", new Date()), month)).length
  };
}
