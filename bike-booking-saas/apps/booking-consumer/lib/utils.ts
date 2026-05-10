import { addDays, addHours, format, isBefore, isSameDay, parse, set } from "date-fns";
import { th } from "date-fns/locale";
import type { BookingConfirmation, BookingKind, BookingSlot, ServiceItem, Shop, ShopHoliday, WeekdayKey } from "./types";

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

export type BookingDateAvailability = {
  kind: "past" | "open" | "regular_holiday" | "extra_holiday";
  closed: boolean;
  label: string;
  detail: string;
  reason: string | null;
};

function midnightToday() {
  return set(new Date(), { hours: 0, minutes: 0, seconds: 0, milliseconds: 0 });
}

export function getBookingDateAvailability(shop: Shop, holidays: ShopHoliday[], date: Date): BookingDateAvailability {
  const iso = format(date, "yyyy-MM-dd");
  const dayKey = toWeekdayKey(date);

  if (isBefore(date, midnightToday())) {
    return {
      kind: "past",
      closed: true,
      label: "วันที่ผ่านมาแล้ว",
      detail: "เลือกวันนี้หรือวันในอนาคต",
      reason: null
    };
  }

  const extraHoliday = holidays.find((holiday) => holiday.holiday_date === iso);
  if (extraHoliday) {
    return {
      kind: "extra_holiday",
      closed: true,
      label: "วันหยุดเพิ่มเติม",
      detail: extraHoliday.reason?.trim() ? extraHoliday.reason : "ร้านหยุดพิเศษในวันนี้",
      reason: extraHoliday.reason ?? null
    };
  }

  const workingDay = shop.working_hours[dayKey];
  const regularHoliday = shop.regular_holidays.includes(dayKey) || !workingDay?.enabled;
  if (regularHoliday) {
    return {
      kind: "regular_holiday",
      closed: true,
      label: "วันหยุดประจำร้าน",
      detail: "ตามตารางเปิดทำการของร้าน",
      reason: null
    };
  }

  return {
    kind: "open",
    closed: false,
    label: "เปิดรับจอง",
    detail: "เลือกจองได้ตามเวลาทำการ",
    reason: null
  };
}

export function isClosedDate(shop: Shop, holidays: ShopHoliday[], date: Date) {
  return getBookingDateAvailability(shop, holidays, date).closed;
}

export function resolveSelectedBookingMode(serviceIds: string[], services: ServiceItem[]): { kind: BookingKind | null; value: number; mixed: boolean } {
  const selected = serviceIds
    .map((id) => services.find((item) => item.id === id))
    .filter((service): service is ServiceItem => Boolean(service));

  if (selected.length === 0) {
    return { kind: null, value: 0, mixed: false };
  }

  const units = new Set(selected.map((service) => service.duration_unit));
  if (units.size > 1) {
    return { kind: null, value: 0, mixed: true };
  }

  const [unit] = [...units];
  return {
    kind: unit === "day" ? "daily" : "hourly",
    value: selected.reduce((sum, service) => sum + Math.max(service.duration_value ?? service.duration_hours ?? 1, 1), 0),
    mixed: false
  };
}

export function calculateEndTime(date: string, start: string, durationHours: number) {
  const startDate = parse(`${date} ${start}`, "yyyy-MM-dd HH:mm", new Date());
  return format(addHours(startDate, Math.max(durationHours, 1)), "HH:mm");
}

export function calculateMinimumDailyEndDate(startDate: string, requiredDays: number, shop: Shop, holidays: ShopHoliday[]) {
  if (!startDate) return "";
  const parsedStart = parse(startDate, "yyyy-MM-dd", new Date());
  const safeDays = Math.max(Math.floor(requiredDays), 1);
  let countedDays = 0;
  let cursor = parsedStart;
  let lastOpenDate = parsedStart;

  for (let guard = 0; guard < 370 && countedDays < safeDays; guard += 1) {
    if (!isClosedDate(shop, holidays, cursor)) {
      countedDays += 1;
      lastOpenDate = cursor;
    }

    if (countedDays >= safeDays) {
      break;
    }

    cursor = addDays(cursor, 1);
  }

  return format(lastOpenDate, "yyyy-MM-dd");
}

function normalizedCapacity(value: number | undefined, fallback: number, minimum: number) {
  const parsed = Number(value ?? fallback);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(minimum, Math.floor(parsed));
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
      if (booking.booking_kind !== "hourly" || booking.booking_date !== date || !isSlotWorkloadStatus(booking.status)) return false;
      if (!booking.booking_time_start || !booking.booking_time_end) return false;
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
    const available = hasCapacityAcrossWindow(date, cursor, endAt, slotCapacity, bookings);
    slots.push({ start, end, available });
    cursor = addHours(cursor, 1);
  }

  return slots;
}

export function formatBookingSchedule(booking: BookingConfirmation) {
  if (booking.booking_kind === "daily") {
    const endDate = booking.booking_end_date ?? booking.booking_date;
    return `${formatThaiDate(booking.booking_date)} - ${formatThaiDate(endDate)}`;
  }

  const start = booking.booking_time_start?.slice(0, 5) || "--:--";
  const end = booking.booking_time_end?.slice(0, 5) || "--:--";
  return `${formatThaiDate(booking.booking_date)} · ${start} - ${end} น.`;
}

export function bookingCopy(shop: Shop, booking: BookingConfirmation, serviceNames: string[]) {
  const year = booking.bike_year ? ` (${booking.bike_year})` : "";
  const notes = booking.additional_notes?.trim() ? booking.additional_notes : "-";
  const scheduleText =
    booking.booking_kind === "daily"
      ? `📅 ช่วงวัน: ${formatThaiDate(booking.booking_date)} - ${formatThaiDate(booking.booking_end_date ?? booking.booking_date)}`
      : `📅 วันที่: ${formatThaiDate(booking.booking_date)}\n⏰ เวลา: ${booking.booking_time_start?.slice(0, 5) || "--:--"} - ${booking.booking_time_end?.slice(0, 5) || "--:--"} น.`;
  return [
    `🏍️ จองคิว ${shop.name}`,
    scheduleText,
    `👤 ชื่อ: ${booking.customer_name}`,
    `📞 เบอร์: ${booking.customer_phone}`,
    `🏍️ รถ: ${booking.bike_model}${year}`,
    "🛠️ รายการบริการ:",
    ...serviceNames.map((name) => `• ${name}`),
    `💬 หมายเหตุ: ${notes}`,
    `รหัสการจอง: #${booking.id.slice(0, 8).toUpperCase()}`
  ].join("\n");
}
