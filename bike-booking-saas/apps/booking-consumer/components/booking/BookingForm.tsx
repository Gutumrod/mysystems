"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { BookingSlot, ServiceItem, Shop, ShopHoliday } from "@/lib/types";
import { bookingSchema, type BookingFormValues } from "@/lib/validations";
import { calculateDuration, calculateEndTime, cn } from "@/lib/utils";
import { createBrowserClient } from "@/lib/supabase/client";
import { BikeModelAutocomplete } from "./BikeModelAutocomplete";
import { DateTimePicker } from "./DateTimePicker";

type Props = {
  shop: Shop;
  services: ServiceItem[];
  holidays: ShopHoliday[];
  bookings: BookingSlot[];
  demoMode?: boolean;
};

export function BookingForm({ shop, services, holidays, bookings, demoMode = false }: Props) {
  const supabase = useMemo(() => (demoMode ? null : createBrowserClient()), [demoMode]);
  const [submitting, setSubmitting] = useState(false);
  const dateTimeRef = useRef<HTMLDivElement>(null);
  const {
    control,
    register,
    handleSubmit,
    watch,
    setValue,
    setError,
    formState: { errors }
  } = useForm<BookingFormValues>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      customer_name: "",
      customer_phone: "",
      customer_fb: "",
      customer_line_id: "",
      bike_model: "",
      bike_year: "",
      booking_date: "",
      booking_time_start: "",
      service_items: [],
      additional_notes: ""
    }
  });

  const selectedServices = watch("service_items");
  const bookingDate = watch("booking_date");
  const bookingTime = watch("booking_time_start");
  const durationHours = calculateDuration(selectedServices, services);

  async function onSubmit(values: BookingFormValues) {
    setSubmitting(true);
    const endTime = calculateEndTime(values.booking_date, values.booking_time_start, durationHours);

    if (demoMode || !supabase) {
      window.sessionStorage.setItem(
        "demo-booking",
        JSON.stringify({
          id: "demo-booking",
          shop_id: shop.id,
          ...values,
          customer_fb: values.customer_fb || null,
          customer_line_id: values.customer_line_id || null,
          bike_year: values.bike_year === "" ? null : values.bike_year,
          booking_time_end: endTime,
          additional_notes: values.additional_notes || null,
          status: "confirmed",
          created_at: new Date().toISOString()
        })
      );
      window.location.href = "/success?id=demo-booking";
      return;
    }

    const { data: bookingId, error } = await supabase
      .schema("bike_booking")
      .rpc("create_public_booking", {
        p_shop_id:            shop.id,
        p_customer_name:      values.customer_name,
        p_customer_phone:     values.customer_phone,
        p_customer_fb:        values.customer_fb || null,
        p_customer_line_id:   values.customer_line_id || null,
        p_bike_model:         values.bike_model,
        p_bike_year:          values.bike_year === "" ? null : values.bike_year,
        p_service_items:      values.service_items,
        p_booking_date:       values.booking_date,
        p_booking_time_start: values.booking_time_start,
        p_booking_time_end:   endTime,
        p_additional_notes:   values.additional_notes || null,
      });
    setSubmitting(false);

    if (error) {
      const msg = error.message;
      const isConflict = msg.includes("เวลานี้") || msg.includes("จองแล้ว") || msg.includes("overlap");
      if (isConflict) {
        setError("booking_time_start", { message: "เวลานี้มีคนจองแล้ว กรุณาเลือกเวลาใหม่" });
        dateTimeRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      } else {
        toast.error(msg.includes("ติดต่อร้านโดยตรง") ? "ติดต่อร้านโดยตรง" : `จองไม่สำเร็จ: ${msg}`);
      }
      return;
    }

    toast.success("จองคิวสำเร็จ");
    window.location.href = `/success?id=${bookingId}`;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>จองคิว {shop.name}</CardTitle>
        <CardDescription>กรอกข้อมูลให้ครบ ร้านจะเห็นคิวในระบบทันที</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
          <FieldGroup>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="customer_name">ชื่อ *</FieldLabel>
                <Input id="customer_name" {...register("customer_name")} aria-invalid={Boolean(errors.customer_name)} />
                <FieldError>{errors.customer_name?.message}</FieldError>
              </Field>
              <Field>
                <FieldLabel htmlFor="customer_phone">เบอร์โทร *</FieldLabel>
                <Input id="customer_phone" inputMode="tel" {...register("customer_phone")} aria-invalid={Boolean(errors.customer_phone)} />
                <FieldError>{errors.customer_phone?.message}</FieldError>
              </Field>
              <Field>
                <FieldLabel htmlFor="customer_fb">Facebook</FieldLabel>
                <Input id="customer_fb" {...register("customer_fb")} placeholder="ชื่อ Facebook หรือ URL" />
              </Field>
              <Field>
                <FieldLabel htmlFor="customer_line_id">LINE ID</FieldLabel>
                <Input id="customer_line_id" {...register("customer_line_id")} placeholder="@lineid" />
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-[1fr_160px]">
              <Field>
                <FieldLabel>รุ่นรถ *</FieldLabel>
                <Controller
                  control={control}
                  name="bike_model"
                  render={({ field }) => <BikeModelAutocomplete value={field.value} onChange={field.onChange} />}
                />
                <FieldError>{errors.bike_model?.message}</FieldError>
              </Field>
              <Field>
                <FieldLabel htmlFor="bike_year">ปี</FieldLabel>
                <Input id="bike_year" inputMode="numeric" {...register("bike_year")} placeholder="2024" />
                <FieldError>{errors.bike_year?.message}</FieldError>
              </Field>
            </div>

            <Field>
              <FieldLabel>บริการ *</FieldLabel>
              <div className="grid gap-2 sm:grid-cols-2">
                {services.map((service) => {
                  const checked = selectedServices.includes(service.id);
                  return (
                    <label
                      key={service.id}
                      className={cn(
                        "flex min-h-14 cursor-pointer items-center gap-3 rounded border border-white/10 bg-[#131313] px-3 text-sm transition hover:border-[#69daff]/30",
                        checked && "border-[#69daff]/50 bg-[#69daff]/10"
                      )}
                    >
                      <input
                        type="checkbox"
                        className="size-4"
                        checked={checked}
                        onChange={(event) => {
                          const next = event.target.checked
                            ? [...selectedServices, service.id]
                            : selectedServices.filter((id) => id !== service.id);
                          setValue("service_items", next, { shouldValidate: true });
                          setValue("booking_time_start", "");
                        }}
                      />
                      <span className="flex flex-col">
                        <span className="font-medium">{service.name}</span>
                        <span className="text-xs text-muted-foreground">{service.duration_hours} ชั่วโมง</span>
                      </span>
                    </label>
                  );
                })}
              </div>
              <FieldError>{errors.service_items?.message}</FieldError>
            </Field>

            <Field>
              <FieldLabel htmlFor="additional_notes">หมายเหตุเพิ่มเติม</FieldLabel>
              <Textarea
                id="additional_notes"
                maxLength={500}
                {...register("additional_notes")}
                placeholder="เช่น พกน้ำมันเครื่องมาเอง หรือบริการที่ไม่มีในตัวเลือก"
              />
              <FieldError>{errors.additional_notes?.message}</FieldError>
            </Field>

            <div ref={dateTimeRef}>
              <DateTimePicker
                shop={shop}
                holidays={holidays}
                bookings={bookings}
                date={bookingDate}
                time={bookingTime}
                durationHours={durationHours}
                dateError={errors.booking_date?.message}
                timeError={errors.booking_time_start?.message}
                onDateChange={(value) => setValue("booking_date", value, { shouldValidate: true })}
                onTimeChange={(value) => setValue("booking_time_start", value, { shouldValidate: true })}
              />
            </div>
          </FieldGroup>

          <Button type="submit" disabled={submitting || durationHours === 0} className="w-full">
            {submitting ? <Loader2 data-icon="inline-start" className="animate-spin" /> : null}
            ยืนยันการจอง
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

