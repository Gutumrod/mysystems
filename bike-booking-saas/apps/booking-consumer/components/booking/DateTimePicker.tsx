"use client";

import { format } from "date-fns";
import { Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import type { BookingKind, BookingSlot, Shop, ShopHoliday } from "@/lib/types";
import { buildTimeSlots, cn, isClosedDate } from "@/lib/utils";

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
  const selectedDateClosed = date ? isClosedDate(shop, holidays, new Date(`${date}T00:00:00`)) : false;

  return (
    <div className="flex flex-col gap-4">
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
        {selectedDateClosed ? <p className="text-sm text-red-600">ร้านหยุดในวันที่เลือก กรุณาเลือกวันอื่น</p> : null}
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
            งานแบบค้างหลายวันจะนับโควตาตามวัน ไม่ใช้ช่องเวลา และต้องไม่น้อยกว่าระยะเวลาที่เลือก ({durationValue} วัน)
          </p>
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
      )}
    </div>
  );
}
