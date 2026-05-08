"use client";

import { DragDropContext, Draggable, Droppable, type DropResult } from "@hello-pangea/dnd";
import { GripVertical, Loader2, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { createBrowserClient } from "@/lib/supabase/client";
import type { ServiceDurationUnit, ServiceItem } from "@/lib/types";

type Props = {
  initialServices: ServiceItem[];
  shopId: string;
  demoMode?: boolean;
};

export function ServicesManager({ initialServices, shopId, demoMode = false }: Props) {
  const supabase = useMemo(() => (demoMode ? null : createBrowserClient()), [demoMode]);
  const [services, setServices] = useState(initialServices);
  const [name, setName] = useState("");
  const [durationUnit, setDurationUnit] = useState<ServiceDurationUnit>("hour");
  const [durationValue, setDurationValue] = useState(1);
  const [saving, setSaving] = useState(false);

  function toDurationHours(unit: ServiceDurationUnit, value: number) {
    return unit === "day" ? 1 : value;
  }

  async function addService() {
    if (!name.trim()) return;
    setSaving(true);
    const nextDurationValue = Math.max(1, durationValue);
    if (!supabase) {
      setServices([
        ...services,
        {
          id: crypto.randomUUID(),
          shop_id: shopId,
          name,
          duration_unit: durationUnit,
          duration_value: nextDurationValue,
          duration_hours: toDurationHours(durationUnit, nextDurationValue),
          is_active: true,
          sort_order: services.length + 1
        }
      ]);
      setName("");
      setDurationUnit("hour");
      setDurationValue(1);
      setSaving(false);
      toast.success("เพิ่มบริการแล้ว (โหมดตัวอย่าง)");
      return;
    }
    const { data, error } = await supabase
      .schema("bike_booking")
      .from("service_items")
      .insert({
        shop_id: shopId,
        name,
        duration_unit: durationUnit,
        duration_value: nextDurationValue,
        duration_hours: toDurationHours(durationUnit, nextDurationValue),
        is_active: true,
        sort_order: services.length + 1
      })
      .select("*")
      .single<ServiceItem>();
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setServices([...services, data]);
    setName("");
    setDurationUnit("hour");
    setDurationValue(1);
    toast.success("เพิ่มบริการแล้ว");
  }

  function updateServiceDraft(service: ServiceItem, patch: Partial<ServiceItem>) {
    const next = { ...service, ...patch };
    setServices((items) => items.map((item) => (item.id === service.id ? next : item)));
  }

  async function persistService(service: ServiceItem, patch: Partial<Pick<ServiceItem, "name" | "duration_unit" | "duration_value" | "is_active">>) {
    const nextPatch: Partial<ServiceItem> = { ...patch };
    if (typeof nextPatch.name === "string") {
      nextPatch.name = nextPatch.name.trim();
      if (!nextPatch.name) {
        toast.error("กรุณากรอกชื่อบริการ");
        return;
      }
    }
    if (typeof nextPatch.duration_value === "number" && (nextPatch.duration_value < 1 || nextPatch.duration_value > 365)) {
      toast.error("ระยะเวลาต้องมากกว่า 0");
      return;
    }

    const nextUnit = nextPatch.duration_unit ?? service.duration_unit;
    const nextValue = typeof nextPatch.duration_value === "number" ? nextPatch.duration_value : service.duration_value;
    nextPatch.duration_hours = toDurationHours(nextUnit, nextValue);

    const next = { ...service, ...nextPatch };
    setServices((items) => items.map((item) => (item.id === service.id ? next : item)));
    if (!supabase) return;
    const { error } = await supabase.schema("bike_booking").from("service_items").update(nextPatch).eq("id", service.id);
    if (error) toast.error(error.message);
  }

  async function deleteService(id: string) {
    if (!window.confirm("ยืนยันการลบบริการนี้?")) return;
    if (!supabase) {
      setServices((items) => items.filter((item) => item.id !== id));
      return;
    }
    const { count } = await supabase.schema("bike_booking").from("bookings").select("id", { count: "exact", head: true }).contains("service_items", [id]);
    if ((count ?? 0) > 0) {
      toast.error("ลบบริการไม่ได้ เพราะมีการจองใช้งานอยู่");
      return;
    }
    const { error } = await supabase.schema("bike_booking").from("service_items").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    setServices((items) => items.filter((item) => item.id !== id));
  }

  async function onDragEnd(result: DropResult) {
    if (!result.destination) return;
    const next = Array.from(services);
    const [moved] = next.splice(result.source.index, 1);
    next.splice(result.destination.index, 0, moved);
    const ordered = next.map((service, index) => ({ ...service, sort_order: index + 1 }));
    setServices(ordered);
    if (!supabase) return;
    try {
      await Promise.all(ordered.map((service) => supabase.schema("bike_booking").from("service_items").update({ sort_order: service.sort_order }).eq("id", service.id)));
    } catch {
      toast.error("ไม่สามารถบันทึกลำดับได้ กรุณาลองใหม่");
    }
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[360px_1fr]">
      <Card>
        <CardContent className="p-5">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="name">ชื่อบริการ</FieldLabel>
              <Input id="name" value={name} onChange={(event) => setName(event.target.value)} placeholder="เช่น เปลี่ยนน้ำมันเครื่อง" />
            </Field>
            <div className="grid gap-3 sm:grid-cols-[1fr_1fr]">
              <Field>
                <FieldLabel htmlFor="duration_unit">ประเภทเวลา</FieldLabel>
                <select
                  id="duration_unit"
                  className="min-h-10 rounded-md border border-border bg-background px-3 text-sm outline-none"
                  value={durationUnit}
                  onChange={(event) => setDurationUnit(event.target.value as ServiceDurationUnit)}
                >
                  <option value="hour">ชั่วโมง</option>
                  <option value="day">วัน</option>
                </select>
              </Field>
              <Field>
                <FieldLabel htmlFor="duration">ระยะเวลา ({durationUnit === "day" ? "วัน" : "ชั่วโมง"})</FieldLabel>
                <Input id="duration" type="number" min={1} max={365} value={durationValue} onChange={(event) => setDurationValue(Number(event.target.value))} />
              </Field>
            </div>
            <Button type="button" onClick={addService} disabled={saving}>
              {saving ? <Loader2 className="animate-spin" /> : <Plus />}
              เพิ่มบริการ
            </Button>
          </FieldGroup>
        </CardContent>
      </Card>
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="services">
          {(provided) => (
            <div ref={provided.innerRef} {...provided.droppableProps} className="flex flex-col gap-3">
              {services.map((service, index) => (
                <Draggable draggableId={service.id} index={index} key={service.id}>
                  {(dragProvided) => (
                    <div ref={dragProvided.innerRef} {...dragProvided.draggableProps} className="grid gap-3 rounded-lg border bg-muted/40 p-4 lg:grid-cols-[auto_1fr_140px_120px_140px_auto] lg:items-center">
                      <button {...dragProvided.dragHandleProps} className="cursor-grab text-muted-foreground" aria-label="ลากเพื่อเรียงลำดับ">
                        <GripVertical />
                      </button>
                      <Input
                        value={service.name}
                        onChange={(event) => updateServiceDraft(service, { name: event.target.value })}
                        onBlur={(event) => persistService(service, { name: event.target.value })}
                      />
                      <select
                        className="min-h-10 rounded-md border border-border bg-background px-3 text-sm outline-none"
                        value={service.duration_unit}
                        onChange={(event) => {
                          const nextUnit = event.target.value as ServiceDurationUnit;
                          updateServiceDraft(service, { duration_unit: nextUnit, duration_hours: toDurationHours(nextUnit, service.duration_value) });
                          void persistService(service, { duration_unit: nextUnit });
                        }}
                      >
                        <option value="hour">ชั่วโมง</option>
                        <option value="day">วัน</option>
                      </select>
                      <Input
                        type="number"
                        min={1}
                        max={365}
                        value={service.duration_value}
                        onChange={(event) => updateServiceDraft(service, { duration_value: Number(event.target.value), duration_hours: toDurationHours(service.duration_unit, Number(event.target.value)) })}
                        onBlur={(event) => persistService(service, { duration_value: Number(event.target.value) })}
                      />
                      <label className="flex items-center gap-2 text-sm">
                        <input type="checkbox" checked={service.is_active} onChange={(event) => persistService(service, { is_active: event.target.checked })} />
                        แสดง
                      </label>
                      <Button variant="ghost" size="icon" onClick={() => deleteService(service.id)} aria-label="ลบบริการ">
                        <Trash2 />
                      </Button>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
}

