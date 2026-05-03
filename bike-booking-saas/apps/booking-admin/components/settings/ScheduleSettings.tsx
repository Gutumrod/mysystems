"use client";

import { Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { createBrowserClient } from "@/lib/supabase/client";
import type { Shop, ShopHoliday, WeekdayKey, WorkingDay, WorkingHours } from "@/lib/types";

const days: Array<{ key: WeekdayKey; label: string }> = [
  { key: "mon", label: "จันทร์" },
  { key: "tue", label: "อังคาร" },
  { key: "wed", label: "พุธ" },
  { key: "thu", label: "พฤหัส" },
  { key: "fri", label: "ศุกร์" },
  { key: "sat", label: "เสาร์" },
  { key: "sun", label: "อาทิตย์" }
];

function sanitizeCapacity(value: number | undefined, fallback: number, minimum: number) {
  const parsed = Number(value ?? fallback);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(minimum, Math.floor(parsed));
}

function normalizeWorkingDay(day?: Partial<WorkingDay>): WorkingDay {
  return {
    enabled: day?.enabled ?? false,
    start: day?.start || "09:00",
    end: day?.end || "18:00",
    slot_capacity: sanitizeCapacity(day?.slot_capacity, 1, 1),
    daily_limit: sanitizeCapacity(day?.daily_limit, 0, 0)
  };
}

function normalizeWorkingHours(input: WorkingHours): WorkingHours {
  return Object.fromEntries(days.map((day) => [day.key, normalizeWorkingDay(input[day.key])])) as WorkingHours;
}

export function ScheduleSettings({ shop, initialHolidays, demoMode = false }: { shop: Shop; initialHolidays: ShopHoliday[]; demoMode?: boolean }) {
  const supabase = useMemo(() => (demoMode ? null : createBrowserClient()), [demoMode]);
  const [hours, setHours] = useState<WorkingHours>(() => normalizeWorkingHours(shop.working_hours));
  const [holidays, setHolidays] = useState(initialHolidays);
  const [holidayDate, setHolidayDate] = useState("");
  const [reason, setReason] = useState("");
  const [isSavingHours, setIsSavingHours] = useState(false);
  const [isAddingHoliday, setIsAddingHoliday] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  function updateDay(dayKey: WeekdayKey, patch: Partial<WorkingDay>) {
    setHours((current) => ({
      ...current,
      [dayKey]: normalizeWorkingDay({ ...current[dayKey], ...patch })
    }));
  }

  async function saveHours() {
    if (isSavingHours) return;
    setIsSavingHours(true);
    const nextHours = normalizeWorkingHours(hours);
    const regular_holidays = days.filter((day) => !nextHours[day.key].enabled).map((day) => day.key);
    if (!supabase) {
      setHours(nextHours);
      toast.success("บันทึกเวลาทำการแล้ว (โหมดตัวอย่าง)");
      setIsSavingHours(false);
      return;
    }
    const { error } = await supabase.schema("bike_booking").from("shops").update({ working_hours: nextHours, regular_holidays }).eq("id", shop.id);
    setIsSavingHours(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setHours(nextHours);
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
            <div key={day.key} className="grid gap-3 rounded-md border bg-muted/40 p-3 sm:grid-cols-[100px_1fr_1fr_145px_145px] sm:items-end">
              <label className="flex items-center gap-2 text-sm font-medium">
                <input
                  type="checkbox"
                  checked={hours[day.key].enabled}
                  onChange={(event) => updateDay(day.key, { enabled: event.target.checked })}
                />
                {day.label}
              </label>
              <Field>
                <FieldLabel>เปิด</FieldLabel>
                <Input type="time" value={hours[day.key].start} onChange={(event) => updateDay(day.key, { start: event.target.value })} />
              </Field>
              <Field>
                <FieldLabel>ปิด</FieldLabel>
                <Input type="time" value={hours[day.key].end} onChange={(event) => updateDay(day.key, { end: event.target.value })} />
              </Field>
              <Field>
                <FieldLabel>รับพร้อมกัน</FieldLabel>
                <Input
                  type="number"
                  min={1}
                  inputMode="numeric"
                  value={hours[day.key].slot_capacity}
                  onChange={(event) => updateDay(day.key, { slot_capacity: Number(event.target.value) })}
                />
              </Field>
              <Field>
                <FieldLabel>จำกัด/วัน</FieldLabel>
                <Input
                  type="number"
                  min={0}
                  inputMode="numeric"
                  value={hours[day.key].daily_limit}
                  onChange={(event) => updateDay(day.key, { daily_limit: Number(event.target.value) })}
                />
              </Field>
            </div>
          ))}
          <p className="text-sm text-muted-foreground">รับพร้อมกัน = จำนวนคิวที่รับซ้อนในช่วงเวลาเดียวกัน, จำกัด/วัน ใส่ 0 คือไม่จำกัด</p>
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

