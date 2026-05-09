"use client";

import { useEffect, useMemo, useState } from "react";
import { addDays, format, parse } from "date-fns";
import { AlertTriangle, PencilLine, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createBrowserClient } from "@/lib/supabase/client";
import type { Booking, BookingStatus, ServiceItem } from "@/lib/types";
import { formatBangkokISODate, formatBookingSchedule, serviceNames, statusClass, statusLabel } from "@/lib/utils";

type BookingDraft = {
  booking_date: string;
  booking_end_date: string;
  booking_time_start: string;
  booking_time_end: string;
  additional_notes: string;
};

type Props = {
  booking: Booking | null;
  services: ServiceItem[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated: (booking: Booking) => void;
  onDeleted: (bookingId: string) => void;
  demoMode?: boolean;
};

export function BookingDetailDialog({ booking, services, open, onOpenChange, onUpdated, onDeleted, demoMode = false }: Props) {
  const supabase = useMemo(() => (demoMode ? null : createBrowserClient()), [demoMode]);
  const today = useMemo(() => formatBangkokISODate(), []);
  const [mode, setMode] = useState<"view" | "edit">("view");
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [draft, setDraft] = useState<BookingDraft | null>(null);

  const bookingServices = useMemo(() => {
    if (!booking) return [];
    return booking.service_items
      .map((serviceId) => services.find((service) => service.id === serviceId))
      .filter((service): service is ServiceItem => Boolean(service));
  }, [booking, services]);

  const bookingModeCount = useMemo(() => new Set(bookingServices.map((service) => service.duration_unit)).size, [bookingServices]);
  const inferredMode = useMemo<"hourly" | "daily" | null>(() => {
    if (bookingServices.length === 0 || bookingModeCount > 1) return null;
    return bookingServices[0]?.duration_unit === "day" ? "daily" : "hourly";
  }, [bookingModeCount, bookingServices]);
  const hasModeMismatch = Boolean(booking && inferredMode && booking.booking_kind !== inferredMode);
  const canEdit = Boolean(booking && !hasModeMismatch && booking.status !== "cancelled" && booking.status !== "completed" && booking.status !== "no_show" && booking.booking_date >= today);

  const requiredDailyDays = useMemo(() => {
    if (!booking || booking.booking_kind !== "daily") return 0;
    const sum = bookingServices.reduce((total, service) => total + Math.max(service.duration_unit === "day" ? service.duration_value : 0, 0), 0);
    return Math.max(sum, 1);
  }, [booking, bookingServices]);

  const minimumDailyEndDate = useMemo(() => {
    if (!draft?.booking_date) return "";
    const safeDays = Math.max(requiredDailyDays, 1);
    const parsedStart = parse(draft.booking_date, "yyyy-MM-dd", new Date());
    return format(addDays(parsedStart, safeDays - 1), "yyyy-MM-dd");
  }, [draft?.booking_date, requiredDailyDays]);

  useEffect(() => {
    if (!booking || !open) {
      setMode("view");
      setDraft(null);
      return;
    }

    setMode("view");
    setDraft({
      booking_date: booking.booking_date,
      booking_end_date: booking.booking_end_date ?? booking.booking_date,
      booking_time_start: booking.booking_time_start?.slice(0, 5) ?? "",
      booking_time_end: booking.booking_time_end?.slice(0, 5) ?? "",
      additional_notes: booking.additional_notes ?? ""
    });
  }, [booking, open]);

  async function updateStatus(nextStatus: BookingStatus) {
    if (!booking || isSaving) return;
    setIsSaving(true);

    if (!supabase) {
      const updated = {
        ...booking,
        status: nextStatus,
        customer_showed_up: nextStatus === "completed" ? true : nextStatus === "no_show" ? false : booking.customer_showed_up
      };
      onUpdated(updated);
      setIsSaving(false);
      toast.success("อัปเดตสถานะแล้ว (โหมดตัวอย่าง)");
      return;
    }

    const { data, error } = await supabase
      .schema("bike_booking")
      .from("bookings")
      .update({ status: nextStatus, customer_showed_up: nextStatus === "completed" ? true : nextStatus === "no_show" ? false : null })
      .eq("id", booking.id)
      .select("*")
      .single<Booking>();

    setIsSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }

    onUpdated(data);
    toast.success("อัปเดตสถานะแล้ว");
  }

  async function saveDraft() {
    if (!booking || !draft || isSaving) return;

    if (!canEdit) {
      toast.error("คิวนี้แก้ไขไม่ได้");
      return;
    }

    if (booking.booking_kind === "hourly") {
      if (!draft.booking_date || !draft.booking_time_start || !draft.booking_time_end) {
        toast.error("กรุณากรอกวันที่และเวลาให้ครบ");
        return;
      }

      if (draft.booking_time_end <= draft.booking_time_start) {
        toast.error("เวลาสิ้นสุดต้องมากกว่าเวลาเริ่ม");
        return;
      }
    } else {
      if (!draft.booking_date || !draft.booking_end_date) {
        toast.error("กรุณาเลือกช่วงวันให้ครบ");
        return;
      }

      if (draft.booking_end_date < draft.booking_date) {
        toast.error("วันสิ้นสุดต้องไม่ก่อนวันเริ่ม");
        return;
      }

      if (draft.booking_end_date < minimumDailyEndDate) {
        toast.error("วันสิ้นสุดสั้นกว่าระยะเวลาบริการรวม");
        return;
      }
    }

    setIsSaving(true);
    const payload =
      booking.booking_kind === "hourly"
        ? {
            booking_date: draft.booking_date,
            booking_end_date: null,
            booking_time_start: `${draft.booking_time_start.slice(0, 5)}:00`,
            booking_time_end: `${draft.booking_time_end.slice(0, 5)}:00`,
            additional_notes: draft.additional_notes.trim() ? draft.additional_notes.trim() : null
          }
        : {
            booking_date: draft.booking_date,
            booking_end_date: draft.booking_end_date,
            booking_time_start: null,
            booking_time_end: null,
            additional_notes: draft.additional_notes.trim() ? draft.additional_notes.trim() : null
          };

    if (!supabase) {
      const updated = { ...booking, ...payload };
      onUpdated(updated);
      setMode("view");
      setIsSaving(false);
      toast.success("บันทึกการแก้ไขแล้ว (โหมดตัวอย่าง)");
      return;
    }

    const { data, error } = await supabase.schema("bike_booking").from("bookings").update(payload).eq("id", booking.id).select("*").single<Booking>();
    setIsSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }

    onUpdated(data);
    setMode("view");
    toast.success("บันทึกการแก้ไขแล้ว");
  }

  async function deleteBooking() {
    if (!booking || isDeleting) return;
    const confirmed = window.confirm("ลบการจองนี้ถาวรใช่ไหม? ข้อมูลจะหายไปเลย");
    if (!confirmed) return;

    setIsDeleting(true);

    if (!supabase) {
      onDeleted(booking.id);
      setIsDeleting(false);
      onOpenChange(false);
      toast.success("ลบการจองแล้ว (โหมดตัวอย่าง)");
      return;
    }

    const { error } = await supabase.schema("bike_booking").from("bookings").delete().eq("id", booking.id);
    setIsDeleting(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    onDeleted(booking.id);
    onOpenChange(false);
    toast.success("ลบการจองแล้ว");
  }

  if (!booking) return null;

  return (
    <Dialog title={mode === "edit" ? "แก้ไขการจอง" : "รายละเอียดการจอง"} open={open} onOpenChange={(nextOpen) => {
      if (!nextOpen) {
        setMode("view");
      }
      onOpenChange(nextOpen);
    }}>
      {mode === "edit" ? (
        <div className="flex flex-col gap-4 text-sm">
          <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-amber-900">
            <p className="flex items-start gap-2 font-medium">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" />
              แก้ไขได้เฉพาะคิววันนี้หรืออนาคตเท่านั้น
            </p>
            <p className="mt-1 text-xs">ถ้าคิวนี้เป็นข้อมูลเก่าและ mode ไม่ตรงกัน แนะนำลบแล้วจองใหม่จะนิ่งกว่า</p>
          </div>

          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="edit_booking_date">วันที่นัด</FieldLabel>
              <Input
                id="edit_booking_date"
                type="date"
                min={today}
                value={draft?.booking_date ?? ""}
                onChange={(event) => setDraft((current) => (current ? { ...current, booking_date: event.target.value } : current))}
              />
            </Field>

            {booking.booking_kind === "hourly" ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="edit_booking_time_start">เวลาเริ่ม</FieldLabel>
                  <Input
                    id="edit_booking_time_start"
                    type="time"
                    value={draft?.booking_time_start ?? ""}
                    onChange={(event) => setDraft((current) => (current ? { ...current, booking_time_start: event.target.value } : current))}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="edit_booking_time_end">เวลาสิ้นสุด</FieldLabel>
                  <Input
                    id="edit_booking_time_end"
                    type="time"
                    value={draft?.booking_time_end ?? ""}
                    onChange={(event) => setDraft((current) => (current ? { ...current, booking_time_end: event.target.value } : current))}
                  />
                </Field>
              </div>
            ) : (
              <Field>
                <FieldLabel htmlFor="edit_booking_end_date">วันสิ้นสุด</FieldLabel>
                <Input
                  id="edit_booking_end_date"
                  type="date"
                  min={minimumDailyEndDate || draft?.booking_date || today}
                  value={draft?.booking_end_date ?? ""}
                  onChange={(event) => setDraft((current) => (current ? { ...current, booking_end_date: event.target.value } : current))}
                />
                <p className="text-xs text-muted-foreground">
                  ระยะเวลาขั้นต่ำ {requiredDailyDays} วัน
                </p>
              </Field>
            )}

            <Field>
              <FieldLabel htmlFor="edit_additional_notes">หมายเหตุ</FieldLabel>
              <Textarea
                id="edit_additional_notes"
                rows={4}
                value={draft?.additional_notes ?? ""}
                onChange={(event) => setDraft((current) => (current ? { ...current, additional_notes: event.target.value } : current))}
              />
            </Field>
          </FieldGroup>

          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={saveDraft} disabled={isSaving}>
              <PencilLine className="size-4" />
              บันทึก
            </Button>
            <Button type="button" variant="outline" onClick={() => setMode("view")} disabled={isSaving}>
              ยกเลิกการแก้ไข
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4 text-sm">
          {hasModeMismatch ? (
            <div className="rounded-md border border-red-300 bg-red-50 p-3 text-red-900">
              <p className="flex items-start gap-2 font-medium">
                <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                ข้อมูลชุดนี้เป็นข้อมูลเก่าที่ mode ของบริการไม่ตรงกับ booking
              </p>
              <p className="mt-1 text-xs">คิวแบบนี้แก้วัน/เวลาไม่ได้ แนะนำลบแล้วสร้างใหม่ให้ตรงกติกาปัจจุบัน</p>
            </div>
          ) : null}

          <div>
            <p className="text-lg font-semibold">{booking.customer_name}</p>
            <p className="text-muted-foreground">{booking.customer_phone}</p>
          </div>
          <div className="rounded-md border bg-muted/40 p-3">
            <p className="font-medium">วันที่/ช่วง {formatBookingSchedule(booking)}</p>
          </div>
          <p>รถ: {booking.bike_model} {booking.bike_year ?? ""}</p>
          <p>บริการ: {serviceNames(booking.service_items, services).join(", ")}</p>
          <p>หมายเหตุ: {booking.additional_notes || "-"}</p>
          <div className="flex flex-wrap items-center gap-2">
            <Badge className={statusClass(booking.status)}>{statusLabel(booking.status)}</Badge>
            <span className="text-xs text-muted-foreground">รหัสงาน: {booking.id.slice(0, 8).toUpperCase()}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {canEdit ? (
              <Button type="button" variant="outline" disabled={isSaving || isDeleting} onClick={() => setMode("edit")}>
                <PencilLine className="size-4" />
                แก้ไขวันนัด
              </Button>
            ) : null}
            <Button size="sm" variant="outline" disabled={isSaving || isDeleting} onClick={() => updateStatus("in_progress")}>
              เริ่มทำ
            </Button>
            <Button size="sm" disabled={isSaving || isDeleting} onClick={() => updateStatus("completed")}>
              ทำเสร็จ
            </Button>
            <Button size="sm" variant="destructive" disabled={isSaving || isDeleting} onClick={() => updateStatus("cancelled")}>
              ยกเลิก
            </Button>
            <Button size="sm" variant="outline" disabled={isSaving || isDeleting} onClick={() => updateStatus("no_show")}>
              ไม่มาตามนัด
            </Button>
            <Button type="button" variant="destructive" disabled={isSaving || isDeleting} onClick={deleteBooking}>
              <Trash2 className="size-4" />
              ลบถาวร
            </Button>
          </div>
        </div>
      )}
    </Dialog>
  );
}
