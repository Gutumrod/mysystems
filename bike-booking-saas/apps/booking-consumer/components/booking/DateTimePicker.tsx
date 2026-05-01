"use client";

import { format } from "date-fns";
import { Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import type { BookingSlot, Shop, ShopHoliday } from "@/lib/types";
import { buildTimeSlots, cn, isClosedDate } from "@/lib/utils";

type Props = {
  shop: Shop;
  holidays: ShopHoliday[];
  bookings: BookingSlot[];
  date: string;
  time: string;
  durationHours: number;
  dateError?: string;
  timeError?: string;
  onDateChange: (date: string) => void;
  onTimeChange: (time: string) => void;
};

export function DateTimePicker({
  shop,
  holidays,
  bookings,
  date,
  time,
  durationHours,
  dateError,
  timeError,
  onDateChange,
  onTimeChange
}: Props) {
  const slots = date ? buildTimeSlots(shop, date, Math.max(durationHours, 1), bookings) : [];
  const selectedDateClosed = date ? isClosedDate(shop, holidays, new Date(`${date}T00:00:00`)) : false;

  return (
    <div className="flex flex-col gap-4">
      <Field>
        <FieldLabel htmlFor="booking_date">วันที่ *</FieldLabel>
        <Input
          id="booking_date"
          type="date"
          min={format(new Date(), "yyyy-MM-dd")}
          value={date}
          onChange={(event) => {
            onDateChange(event.target.value);
            onTimeChange("");
          }}
          aria-invalid={Boolean(dateError)}
        />
        <FieldError>{dateError}</FieldError>
        {selectedDateClosed ? <p className="text-sm text-red-600">ร้านหยุดในวันที่เลือก กรุณาเลือกวันอื่น</p> : null}
      </Field>

      <Field>
        <FieldLabel>เวลา * {durationHours > 0 ? `(ใช้เวลาประมาณ ${durationHours} ชั่วโมง)` : ""}</FieldLabel>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {slots.map((slot) => (
            <Button
              type="button"
              variant={time === slot.start ? "default" : "outline"}
              key={slot.start}
              disabled={!slot.available || selectedDateClosed}
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
    </div>
  );
}
