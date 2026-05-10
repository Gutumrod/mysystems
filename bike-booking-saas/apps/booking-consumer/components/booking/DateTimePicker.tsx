"use client";

import { format } from "date-fns";
import { Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import type { BookingKind, BookingSlot, Shop, ShopHoliday } from "@/lib/types";
import { buildTimeSlots, cn, getBookingDateAvailability, formatThaiDate } from "@/lib/utils";

type Props = {
  shop: Shop;
  holidays: ShopHoliday[];
  bookings: BookingSlot[];
  date: string;
  endDate: string;
  time: string;
  bookingKind: BookingKind;
  durationValue: number;
  minimumEndDate: string;
  dateError?: string;
  endDateError?: string;
  timeError?: string;
  onDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  onTimeChange: (time: string) => void;
};

export function DateTimePicker({
  shop,
  holidays,
  bookings,
  date,
  endDate,
  time,
  bookingKind,
  durationValue,
  minimumEndDate,
  dateError,
  endDateError,
  timeError,
  onDateChange,
  onEndDateChange,
  onTimeChange
}: Props) {
  const slots = bookingKind === "hourly" && date ? buildTimeSlots(shop, date, Math.max(durationValue, 1), bookings) : [];
  const selectedDateStatus = date ? getBookingDateAvailability(shop, holidays, new Date(`${date}T00:00:00`)) : null;
  const selectedEndDateStatus = bookingKind === "daily" && endDate ? getBookingDateAvailability(shop, holidays, new Date(`${endDate}T00:00:00`)) : null;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-1 text-emerald-100">
          <span className="size-2 rounded-full bg-emerald-400" />
          เปิดรับจอง
        </span>
        <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-1 text-amber-100">
          <span className="size-2 rounded-full bg-amber-400" />
          วันหยุดประจำร้าน
        </span>
        <span className="inline-flex items-center gap-1 rounded-full border border-rose-500/20 bg-rose-500/10 px-2 py-1 text-rose-100">
          <span className="size-2 rounded-full bg-rose-400" />
          วันหยุดเพิ่มเติม
        </span>
      </div>

      <Field>
        <FieldLabel htmlFor="booking_date">{bookingKind === "daily" ? "วันที่เริ่ม *" : "วันที่ *"}</FieldLabel>
        <Input
          id="booking_date"
          type="date"
          min={format(new Date(), "yyyy-MM-dd")}
          value={date}
          onChange={(event) => {
            onDateChange(event.target.value);
            if (bookingKind === "daily") {
              onEndDateChange("");
            } else {
              onTimeChange("");
            }
          }}
          aria-invalid={Boolean(dateError)}
        />
        <FieldError>{dateError}</FieldError>
        {selectedDateStatus ? (
          <div
            className={cn(
              "flex items-start gap-2 rounded-lg border px-3 py-2 text-sm",
              selectedDateStatus.closed
                ? selectedDateStatus.kind === "extra_holiday"
                  ? "border-rose-500/30 bg-rose-500/10 text-rose-100"
                  : "border-amber-500/30 bg-amber-500/10 text-amber-100"
                : "border-emerald-500/30 bg-emerald-500/10 text-emerald-100"
            )}
          >
            <span
              className={cn(
                "mt-1 size-2 rounded-full",
                selectedDateStatus.closed
                  ? selectedDateStatus.kind === "extra_holiday"
                    ? "bg-rose-400"
                    : "bg-amber-400"
                  : "bg-emerald-400"
              )}
            />
            <div className="min-w-0">
              <p className="font-medium">
                {formatThaiDate(date)} · {selectedDateStatus.label}
              </p>
              <p className="text-xs text-muted-foreground">{selectedDateStatus.detail}</p>
            </div>
          </div>
        ) : null}
      </Field>

      {bookingKind === "daily" ? (
        <Field>
          <FieldLabel htmlFor="booking_end_date">วันที่สิ้นสุด *</FieldLabel>
          <Input
            id="booking_end_date"
            type="date"
            min={minimumEndDate || date || format(new Date(), "yyyy-MM-dd")}
            value={endDate}
            onChange={(event) => onEndDateChange(event.target.value)}
            aria-invalid={Boolean(endDateError)}
          />
          <FieldError>{endDateError}</FieldError>
          <p className="text-sm text-muted-foreground">
            งานแบบค้างหลายวันจะนับเฉพาะวันที่ร้านเปิดจริง ถ้ามีวันหยุดแทรกกลางทาง ระบบจะเลื่อนวันสิ้นสุดออกให้ครบ ({durationValue} วันทำการ)
          </p>
          {selectedEndDateStatus ? (
            <div
              className={cn(
                "flex items-start gap-2 rounded-lg border px-3 py-2 text-sm",
                selectedEndDateStatus.closed
                  ? selectedEndDateStatus.kind === "extra_holiday"
                    ? "border-rose-500/30 bg-rose-500/10 text-rose-100"
                    : "border-amber-500/30 bg-amber-500/10 text-amber-100"
                  : "border-emerald-500/30 bg-emerald-500/10 text-emerald-100"
              )}
            >
              <span
                className={cn(
                  "mt-1 size-2 rounded-full",
                  selectedEndDateStatus.closed
                    ? selectedEndDateStatus.kind === "extra_holiday"
                      ? "bg-rose-400"
                      : "bg-amber-400"
                    : "bg-emerald-400"
                )}
              />
              <div className="min-w-0">
                <p className="font-medium">
                  {formatThaiDate(endDate)} · {selectedEndDateStatus.label}
                </p>
                <p className="text-xs text-muted-foreground">{selectedEndDateStatus.detail}</p>
              </div>
            </div>
          ) : null}
        </Field>
      ) : (
        <Field>
          <FieldLabel>เวลา * {durationValue > 0 ? `(ใช้เวลาประมาณ ${durationValue} ชั่วโมง)` : ""}</FieldLabel>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {slots.map((slot) => (
              <Button
                type="button"
                variant={time === slot.start ? "default" : "outline"}
                key={slot.start}
                disabled={!slot.available || selectedDateStatus?.closed}
                onClick={() => onTimeChange(slot.start)}
                className={cn(!slot.available && "line-through")}
              >
                <Clock data-icon="inline-start" />
                {slot.start}
              </Button>
            ))}
          </div>
          {date && slots.length === 0 ? <p className="text-sm text-muted-foreground">ไม่มีเวลาว่างในวันนี้</p> : null}
          <FieldError>{timeError}</FieldError>
        </Field>
      )}
    </div>
  );
}
