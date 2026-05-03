import { addHours, format, isBefore, isSameDay, parse, set } from "date-fns";
import { th } from "date-fns/locale";
import type { BookingConfirmation, BookingSlot, ServiceItem, Shop, ShopHoliday, WeekdayKey } from "./types";

export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

/**
 * Returns the shop UUID for local development fallback only.
 * In production, the shop is resolved by slug via subdomain routing
 * (see middleware.ts + page.tsx). This function is NOT called in production.
 */
export function getShopId() {
  return process.env.NEXT_PUBLIC_SHOP_ID ?? "11111111-1111-1111-1111-111111111111";
}

export function toWeekdayKey(date: Date): WeekdayKey {
  return (["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const)[date.getDay()];
}

export function formatThaiDate(date: string | Date) {
  const parsed = typeof date === "string" ? parse(date, "yyyy-MM-dd", new Date()) : date;
  return format(parsed, "EEEE d MMMM yyyy", { locale: th });
}

export function formatBangkokISODate(date: Date) {
  return date.toLocaleDateString("en-CA", { timeZone: "Asia/Bangkok" });
}

export function isClosedDate(shop: Shop, holidays: ShopHoliday[], date: Date) {
  const iso = format(date, "yyyy-MM-dd");
  const dayKey = toWeekdayKey(date);
  return (
    isBefore(date, set(new Date(), { hours: 0, minutes: 0, seconds: 0, milliseconds: 0 })) ||
    shop.regular_holidays.includes(dayKey) ||
    !shop.working_hours[dayKey]?.enabled ||
    holidays.some((holiday) => holiday.holiday_date === iso)
  );
}

export function calculateDuration(serviceIds: string[], services: ServiceItem[]) {
  return serviceIds.reduce((sum, id) => {
    const service = services.find((item) => item.id === id);
    return sum + (service?.duration_hours ?? 0);
  }, 0);
}

export function calculateEndTime(date: string, start: string, durationHours: number) {
  const startDate = parse(`${date} ${start}`, "yyyy-MM-dd HH:mm", new Date());
  return format(addHours(startDate, Math.max(durationHours, 1)), "HH:mm");
}

function normalizedCapacity(value: number | undefined, fallback: number, minimum: number) {
  const parsed = Number(value ?? fallback);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(minimum, Math.floor(parsed));
}

function isDailyWorkloadStatus(status: BookingSlot["status"]) {
  return !["cancelled", "no_show"].includes(status);
}

function isSlotWorkloadStatus(status: BookingSlot["status"]) {
  return ["confirmed", "in_progress"].includes(status);
}

function timePart(value: string) {
  return value.slice(0, 5);
}

function hasCapacityAcrossWindow(date: string, startAt: Date, endAt: Date, slotCapacity: number, bookings: BookingSlot[]) {
  let segmentStart = startAt;

  while (segmentStart < endAt) {
    const segmentEnd = addHours(segmentStart, 1) < endAt ? addHours(segmentStart, 1) : endAt;
    const segmentStartText = format(segmentStart, "HH:mm");
    const segmentEndText = format(segmentEnd, "HH:mm");
    const overlapCount = bookings.filter((booking) => {
      if (booking.booking_date !== date || !isSlotWorkloadStatus(booking.status)) return false;
      return segmentStartText < timePart(booking.booking_time_end) && segmentEndText > timePart(booking.booking_time_start);
    }).length;

    if (overlapCount >= slotCapacity) return false;
    segmentStart = segmentEnd;
  }

  return true;
}

export function buildTimeSlots(shop: Shop, date: string, durationHours: number, bookings: BookingSlot[]) {
  const dateObj = parse(date, "yyyy-MM-dd", new Date());
  const day = shop.working_hours[toWeekdayKey(dateObj)];
  if (!day?.enabled) return [];

  const slots: Array<{ start: string; end: string; available: boolean }> = [];
  const now = new Date();
  const duration = Math.max(durationHours, 1);
  const slotCapacity = normalizedCapacity(day.slot_capacity, 1, 1);
  const dailyLimit = normalizedCapacity(day.daily_limit, 0, 0);
  const dailyBookingCount = bookings.filter((booking) => booking.booking_date === date && isDailyWorkloadStatus(booking.status)).length;
  const hasDailyCapacity = dailyLimit === 0 || dailyBookingCount < dailyLimit;
  let cursor = parse(`${date} ${day.start}`, "yyyy-MM-dd HH:mm", new Date());
  const close = parse(`${date} ${day.end}`, "yyyy-MM-dd HH:mm", new Date());

  while (addHours(cursor, duration) <= close) {
    if (isSameDay(dateObj, now) && cursor <= now) {
      cursor = addHours(cursor, 1);
      continue;
    }

    const start = format(cursor, "HH:mm");
    const endAt = addHours(cursor, duration);
    const end = format(endAt, "HH:mm");
    const available = hasDailyCapacity && hasCapacityAcrossWindow(date, cursor, endAt, slotCapacity, bookings);
    slots.push({ start, end, available });
    cursor = addHours(cursor, 1);
  }

  return slots;
}

export function bookingCopy(shop: Shop, booking: BookingConfirmation, serviceNames: string[]) {
  const year = booking.bike_year ? ` (${booking.bike_year})` : "";
  const notes = booking.additional_notes?.trim() ? booking.additional_notes : "-";
  return [
    `🏍️ จองคิว ${shop.name}`,
    `📅 วันที่: ${formatThaiDate(booking.booking_date)}`,
    `⏰ เวลา: ${booking.booking_time_start.slice(0, 5)} - ${booking.booking_time_end.slice(0, 5)} น.`,
    `👤 ชื่อ: ${booking.customer_name}`,
    `📞 เบอร์: ${booking.customer_phone}`,
    `🏍️ รถ: ${booking.bike_model}${year}`,
    "🛠️ รายการบริการ:",
    ...serviceNames.map((name) => `• ${name}`),
    `💬 หมายเหตุ: ${notes}`,
    `รหัสการจอง: #${booking.id.slice(0, 8).toUpperCase()}`
  ].join("\n");
}
