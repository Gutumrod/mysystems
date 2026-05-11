"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, Loader2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { BookingSlot, ServiceItem, Shop, ShopHoliday } from "@/lib/types";
import { bookingSchema, type BookingFormValues } from "@/lib/validations";
import { calculateEndTime, calculateMinimumDailyEndDate, cn, getBookingDateAvailability, resolveSelectedBookingMode } from "@/lib/utils";
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
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const dateTimeRef = useRef<HTMLDivElement>(null);
  const {
    control,
    register,
    handleSubmit,
    watch,
    setValue,
    setError,
    clearErrors,
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
      booking_end_date: "",
      minimum_booking_end_date: "",
      booking_kind: "hourly",
      booking_time_start: "",
      booking_time_end: "",
      service_items: [],
      additional_notes: ""
    }
  });

  const selectedServices = selectedServiceIds;
  const bookingDate = watch("booking_date");
  const bookingEndDate = watch("booking_end_date");
  const bookingTime = watch("booking_time_start");
  const selectedMode = resolveSelectedBookingMode(selectedServices, services);
  const bookingKind = selectedMode.kind ?? "hourly";
  const isDailyBooking = bookingKind === "daily";
  const hasMixedServices = selectedMode.mixed;
  const durationValue = selectedMode.value;
  const bookingDateAvailability = useMemo(
    () => (bookingDate ? getBookingDateAvailability(shop, holidays, new Date(`${bookingDate}T00:00:00`)) : null),
    [bookingDate, holidays, shop]
  );
  const bookingEndDateAvailability = useMemo(
    () => (bookingEndDate ? getBookingDateAvailability(shop, holidays, new Date(`${bookingEndDate}T00:00:00`)) : null),
    [bookingEndDate, holidays, shop]
  );
  const minimumEndDate = useMemo(
    () => (isDailyBooking && bookingDate ? calculateMinimumDailyEndDate(bookingDate, durationValue, shop, holidays) : ""),
    [bookingDate, durationValue, holidays, isDailyBooking, shop]
  );

  useEffect(() => {
    setValue("booking_kind", bookingKind, { shouldValidate: true });
    if (bookingKind === "hourly") {
      setValue("booking_end_date", "", { shouldValidate: true });
      setValue("minimum_booking_end_date", "", { shouldValidate: true });
    } else if (bookingKind === "daily") {
      setValue("booking_time_start", "", { shouldValidate: true });
      setValue("booking_time_end", "", { shouldValidate: true });
      setValue("minimum_booking_end_date", minimumEndDate, { shouldValidate: true });
      if (bookingDateAvailability?.closed) {
        setError(
          "booking_date",
          {
            type: "validate",
            message: bookingDateAvailability.kind === "extra_holiday" ? "วันที่เริ่มตรงกับวันหยุดเพิ่มเติมของร้าน" : "ร้านหยุดในวันที่เลือก"
          }
        );
      } else {
        clearErrors("booking_date");
      }

      if (bookingEndDateAvailability?.closed) {
        setError(
          "booking_end_date",
          {
            type: "validate",
            message: bookingEndDateAvailability.kind === "extra_holiday" ? "วันสิ้นสุดตรงกับวันหยุดเพิ่มเติมของร้าน" : "วันสิ้นสุดต้องเป็นวันเปิดรับจอง"
          }
        );
      } else if (bookingEndDate) {
        if (minimumEndDate && bookingEndDate < minimumEndDate) {
          setError("booking_end_date", { type: "validate", message: "วันสิ้นสุดสั้นกว่าระยะเวลาบริการรวม" });
        } else {
          clearErrors("booking_end_date");
        }
      }
    }
  }, [bookingDateAvailability, bookingEndDate, bookingEndDateAvailability, bookingKind, clearErrors, minimumEndDate, setError, setValue]);

  async function onSubmit(values: BookingFormValues) {
    if (hasMixedServices) {
      toast.error("กรุณาอย่าเลือกบริการรายชั่วโมงและรายวันปนกัน");
      return;
    }

    if (isDailyBooking && minimumEndDate && values.booking_end_date && values.booking_end_date < minimumEndDate) {
      setError("booking_end_date", { type: "validate", message: "วันสิ้นสุดสั้นกว่าระยะเวลาบริการรวม" });
      toast.error("วันสิ้นสุดสั้นกว่าระยะเวลาบริการรวม");
      return;
    }

    setSubmitting(true);
    const endTime = isDailyBooking ? null : calculateEndTime(values.booking_date, values.booking_time_start || "", durationValue);

    if (demoMode || !supabase) {
      window.sessionStorage.setItem(
        "demo-booking",
        JSON.stringify({
          id: "demo-booking",
          shop_id: shop.id,
          ...values,
          service_items: selectedServiceIds,
          booking_kind: bookingKind,
          customer_fb: values.customer_fb || null,
          customer_line_id: values.customer_line_id || null,
          bike_year: values.bike_year === "" ? null : values.bike_year,
          booking_end_date: values.booking_end_date || null,
          booking_time_start: isDailyBooking ? null : values.booking_time_start,
          booking_time_end: isDailyBooking ? null : endTime,
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
        p_service_items:      selectedServiceIds,
        p_booking_date:       values.booking_date,
        p_booking_end_date:   values.booking_end_date || null,
        p_booking_kind:       bookingKind,
        p_booking_time_start: isDailyBooking ? null : values.booking_time_start || null,
        p_booking_time_end:   isDailyBooking ? null : endTime,
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
            {services.length === 0 ? (
                <div className="rounded border border-[#ff7350]/30 bg-[#ff7350]/10 px-4 py-3 text-sm text-[#ffd7ce]">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="mt-0.5 size-4 shrink-0 text-[#ff7350]" />
                    <div>
                      <p className="font-medium text-white">ยังไม่มีบริการให้เลือก</p>
                      <p className="mt-1 text-xs text-[#ffd7ce]/90">กรุณาติดต่อร้าน หรือกลับมาอีกครั้งหลังร้านเพิ่มรายการบริการในระบบ</p>
                    </div>
                  </div>
                </div>
              ) : (
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
                            setSelectedServiceIds(next);
                            setValue("service_items", next, { shouldValidate: true, shouldDirty: true });
                            setValue("booking_time_start", "", { shouldValidate: true, shouldDirty: true });
                          }}
                        />
                          <span className="flex flex-col">
                            <span className="font-medium">{service.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {service.duration_unit === "day"
                                ? `${service.duration_value ?? service.duration_hours ?? 1} วัน`
                                : `${service.duration_value ?? service.duration_hours ?? 1} ชั่วโมง`}
                            </span>
                          </span>
                        </label>
                    );
                  })}
                </div>
              )}
              <FieldError>{errors.service_items?.message}</FieldError>
              {hasMixedServices ? (
                <p className="text-sm text-red-500">กรุณาเลือกบริการแบบชั่วโมงหรือแบบวันอย่างใดอย่างหนึ่งในหนึ่งการจอง</p>
              ) : null}
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
                endDate={bookingEndDate ?? ""}
                time={bookingTime ?? ""}
                bookingKind={bookingKind}
                durationValue={durationValue}
                minimumEndDate={minimumEndDate}
                dateError={errors.booking_date?.message}
                endDateError={errors.booking_end_date?.message}
                timeError={errors.booking_time_start?.message}
                onDateChange={(value) => setValue("booking_date", value, { shouldValidate: true })}
                onEndDateChange={(value) => setValue("booking_end_date", value, { shouldValidate: true })}
                onTimeChange={(value) => setValue("booking_time_start", value, { shouldValidate: true })}
              />
            </div>
          </FieldGroup>

          <Button type="submit" disabled={submitting || durationValue === 0 || hasMixedServices} className="w-full">
            {submitting ? <Loader2 data-icon="inline-start" className="animate-spin" /> : null}
            ยืนยันการจอง
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

