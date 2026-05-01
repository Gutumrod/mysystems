"use client";

import { Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { createBrowserClient } from "@/lib/supabase/client";
import type { Shop, ShopHoliday, WeekdayKey, WorkingHours } from "@/lib/types";

const days: Array<{ key: WeekdayKey; label: string }> = [
  { key: "mon", label: "จันทร์" },
  { key: "tue", label: "อังคาร" },
  { key: "wed", label: "พุธ" },
  { key: "thu", label: "พฤหัส" },
  { key: "fri", label: "ศุกร์" },
  { key: "sat", label: "เสาร์" },
  { key: "sun", label: "อาทิตย์" }
];

export function ScheduleSettings({ shop, initialHolidays, demoMode = false }: { shop: Shop; initialHolidays: ShopHoliday[]; demoMode?: boolean }) {
  const supabase = useMemo(() => (demoMode ? null : createBrowserClient()), [demoMode]);
  const [hours, setHours] = useState<WorkingHours>(shop.working_hours);
  const [holidays, setHolidays] = useState(initialHolidays);
  const [holidayDate, setHolidayDate] = useState("");
  const [reason, setReason] = useState("");
  const [isSavingHours, setIsSavingHours] = useState(false);
  const [isAddingHoliday, setIsAddingHoliday] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function saveHours() {
    if (isSavingHours) return;
    setIsSavingHours(true);
    const regular_holidays = days.filter((day) => !hours[day.key].enabled).map((day) => day.key);
    if (!supabase) {
      toast.success("บันทึกเวลาทำการแล้ว (โหมดตัวอย่าง)");
      setIsSavingHours(false);
      return;
    }
    const { error } = await supabase.schema("bike_booking").from("shops").update({ working_hours: hours, regular_holidays }).eq("id", shop.id);
    setIsSavingHours(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("บันทึกเวลาทำการแล้ว");
  }

  async function addHoliday() {
    if (!holidayDate || isAddingHoliday) return;
    setIsAddingHoliday(true);
    if (!supabase) {
      setHolidays([...holidays, { id: crypto.randomUUID(), shop_id: shop.id, holiday_date: holidayDate, reason }]);
      setHolidayDate("");
      setReason("");
      setIsAddingHoliday(false);
      return;
    }
    const { data, error } = await supabase.schema("bike_booking").from("shop_holidays").insert({ shop_id: shop.id, holiday_date: holidayDate, reason }).select("*").single<ShopHoliday>();
    setIsAddingHoliday(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setHolidays([...holidays, data]);
    setHolidayDate("");
    setReason("");
  }

  async function deleteHoliday(id: string) {
    if (deletingId) return;
    setDeletingId(id);
    if (!supabase) {
      setHolidays((items) => items.filter((item) => item.id !== id));
      setDeletingId(null);
      return;
    }
    const { error } = await supabase.schema("bike_booking").from("shop_holidays").delete().eq("id", id);
    setDeletingId(null);
    if (error) {
      toast.error(error.message);
      return;
    }
    setHolidays((items) => items.filter((item) => item.id !== id));
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_420px]">
      <Card>
        <CardHeader>
          <CardTitle>เวลาทำการ</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {days.map((day) => (
            <div key={day.key} className="grid gap-3 rounded-md border bg-muted/40 p-3 sm:grid-cols-[110px_1fr_1fr] sm:items-center">
              <label className="flex items-center gap-2 text-sm font-medium">
                <input
                  type="checkbox"
                  checked={hours[day.key].enabled}
                  onChange={(event) => setHours({ ...hours, [day.key]: { ...hours[day.key], enabled: event.target.checked } })}
                />
                {day.label}
              </label>
              <Input type="time" value={hours[day.key].start} onChange={(event) => setHours({ ...hours, [day.key]: { ...hours[day.key], start: event.target.value } })} />
              <Input type="time" value={hours[day.key].end} onChange={(event) => setHours({ ...hours, [day.key]: { ...hours[day.key], end: event.target.value } })} />
            </div>
          ))}
          <Button disabled={isSavingHours} onClick={saveHours}>บันทึกเวลาทำการ</Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>วันหยุดพิเศษ</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Field>
            <FieldLabel>วันที่</FieldLabel>
            <Input type="date" value={holidayDate} onChange={(event) => setHolidayDate(event.target.value)} />
          </Field>
          <Field>
            <FieldLabel>เหตุผล</FieldLabel>
            <Input value={reason} onChange={(event) => setReason(event.target.value)} />
          </Field>
          <Button disabled={isAddingHoliday} onClick={addHoliday}>
            <Plus />
            เพิ่มวันหยุด
          </Button>
          <div className="flex flex-col gap-2">
            {holidays.map((holiday) => (
              <div key={holiday.id} className="flex items-center justify-between gap-3 rounded-md border bg-muted/40 p-3 text-sm">
                <span>{holiday.holiday_date} · {holiday.reason || "-"}</span>
                <Button variant="ghost" size="icon" disabled={deletingId === holiday.id} onClick={() => deleteHoliday(holiday.id)}>
                  <Trash2 />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

