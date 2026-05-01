"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { createBrowserClient } from "@/lib/supabase/client";
import type { Shop } from "@/lib/types";

export function ShopSettingsForm({ shop, demoMode = false }: { shop: Shop; demoMode?: boolean }) {
  const supabase = useMemo(() => (demoMode ? null : createBrowserClient()), [demoMode]);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState({
    name: shop.name,
    phone: shop.phone ?? "",
    line_id: shop.line_id ?? "",
    facebook_url: shop.facebook_url ?? ""
  });

  async function save() {
    if (isSaving) return;
    setIsSaving(true);
    if (!supabase) {
      toast.success("บันทึกข้อมูลร้านแล้ว (โหมดตัวอย่าง)");
      setIsSaving(false);
      return;
    }
    const { error } = await supabase.schema("bike_booking").from("shops").update(form).eq("id", shop.id);
    setIsSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("บันทึกข้อมูลร้านแล้ว");
  }

  return (
    <Card>
      <CardContent className="p-5">
        <FieldGroup>
          <Field>
            <FieldLabel>ชื่อร้าน</FieldLabel>
            <Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
          </Field>
          <Field>
            <FieldLabel>เบอร์โทร</FieldLabel>
            <Input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
          </Field>
          <Field>
            <FieldLabel>LINE ID</FieldLabel>
            <Input value={form.line_id} onChange={(event) => setForm({ ...form, line_id: event.target.value })} />
          </Field>
          <Field>
            <FieldLabel>Facebook URL</FieldLabel>
            <Input value={form.facebook_url} onChange={(event) => setForm({ ...form, facebook_url: event.target.value })} />
          </Field>
          <Button type="button" disabled={isSaving} onClick={save}>บันทึก</Button>
        </FieldGroup>
      </CardContent>
    </Card>
  );
}

