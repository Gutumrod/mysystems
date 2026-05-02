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
    const nextForm = {
      name: form.name.trim(),
      phone: form.phone.trim(),
      line_id: form.line_id.trim(),
      facebook_url: form.facebook_url.trim()
    };

    if (!nextForm.name) {
      toast.error("กรุณากรอกชื่อร้าน");
      return;
    }

    const phoneDigits = nextForm.phone.replace(/\D/g, "");
    if (nextForm.phone && (phoneDigits.length < 9 || phoneDigits.length > 10)) {
      toast.error("กรุณากรอกเบอร์โทรให้ถูกต้อง");
      return;
    }

    if (nextForm.line_id && /\s/.test(nextForm.line_id)) {
      toast.error("LINE ID ต้องไม่มีช่องว่าง");
      return;
    }

    if (nextForm.facebook_url) {
      try {
        const url = new URL(nextForm.facebook_url);
        if (!["http:", "https:"].includes(url.protocol)) {
          toast.error("Facebook URL ต้องขึ้นต้นด้วย http:// หรือ https://");
          return;
        }
      } catch {
        toast.error("Facebook URL ไม่ถูกต้อง");
        return;
      }
    }

    setIsSaving(true);
    if (!supabase) {
      setForm(nextForm);
      toast.success("บันทึกข้อมูลร้านแล้ว (โหมดตัวอย่าง)");
      setIsSaving(false);
      return;
    }
    const { error } = await supabase.schema("bike_booking").from("shops").update(nextForm).eq("id", shop.id);
    setIsSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setForm(nextForm);
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

