"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, LogIn, Store, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import type { PortalMode } from "@/lib/portal";
import { getPortalSignupCopy } from "@/lib/portal";
import { getSignupPreviewUrls, normalizeSignupSlug } from "@/lib/signup";

type Props = {
  mode: PortalMode;
};

type SignupState = {
  email: string;
  shopName: string;
  slug: string;
  password: string;
  confirmPassword: string;
  phone: string;
  note: string;
  loading: boolean;
  submitted: boolean;
  message: string;
};

export function PortalSignupForm({ mode }: Props) {
  const router = useRouter();
  const copy = getPortalSignupCopy(mode);
  const [state, setState] = useState<SignupState>({
    email: "",
    shopName: "",
    slug: "",
    password: "",
    confirmPassword: "",
    phone: "",
    note: "",
    loading: false,
    submitted: false,
    message: ""
  });
  const [slugTouched, setSlugTouched] = useState(false);

  const preview = useMemo(() => getSignupPreviewUrls(state.slug), [state.slug]);

  useEffect(() => {
    if (!slugTouched) {
      setState((current) => ({
        ...current,
        slug: normalizeSignupSlug(current.shopName)
      }));
    }
  }, [slugTouched, state.shopName]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (state.password !== state.confirmPassword) {
      toast.error("รหัสผ่านไม่ตรงกัน");
      return;
    }

    if (mode !== "control") {
      toast.error("การสมัครร้านใหม่ต้องทำผ่าน Control Center");
      return;
    }

    setState((current) => ({ ...current, loading: true, submitted: false, message: "" }));

    try {
      const response = await fetch("/api/signup", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email: state.email,
          shopName: state.shopName,
          slug: state.slug,
          password: state.password,
          confirmPassword: state.confirmPassword,
          phone: state.phone,
          note: state.note
        })
      });

      const payload = (await response.json().catch(() => null)) as
        | { ok: true; slug?: string }
        | { ok: false; message?: string; error?: string; issues?: { formErrors?: string[]; fieldErrors?: Record<string, string[]> } }
        | null;

      if (!response.ok || !payload || !payload.ok) {
        const message =
          payload && !payload.ok
            ? payload.message ||
              payload.issues?.formErrors?.[0] ||
              Object.values(payload.issues?.fieldErrors ?? {}).flat()[0] ||
              "สมัครร้านไม่สำเร็จ"
            : "สมัครร้านไม่สำเร็จ";

        toast.error(message);
        setState((current) => ({ ...current, loading: false, submitted: false, message }));
        return;
      }

      const finalSlug = payload.slug ?? state.slug;
      setState({
        email: "",
        shopName: "",
        slug: "",
        password: "",
        confirmPassword: "",
        phone: "",
        note: "",
        loading: false,
        submitted: true,
        message: `ส่งคำขอสมัครร้านแล้ว สำหรับ ${finalSlug}`
      });
      setSlugTouched(false);
      toast.success("ส่งคำขอสมัครร้านแล้ว");
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : "สมัครร้านไม่สำเร็จ";
      toast.error(message);
      setState((current) => ({ ...current, loading: false, submitted: false, message }));
    } finally {
      setState((current) => ({ ...current, loading: false }));
    }
  }

  if (mode !== "control") {
    return (
      <main className="flex min-h-screen items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>{copy.badge}</CardTitle>
            <CardDescription>{copy.description}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <p className="text-sm text-muted-foreground">เปิดสมัครร้านใหม่ที่ control.craftbikelab.com/signup เท่านั้น</p>
            <div className="flex flex-wrap gap-2">
              <Button asChild>
                <Link href="https://control.craftbikelab.com/signup">
                  <Store className="size-3.5" />
                  ไปที่ Control Signup
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/login">
                  <LogIn className="size-3.5" />
                  กลับไป login
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl items-center px-4 py-8">
      <Card className="w-full">
        <CardHeader className="space-y-2">
          <CardTitle>{copy.badge}</CardTitle>
          <CardDescription>{copy.description}</CardDescription>
        </CardHeader>
        <CardContent>
          {state.submitted ? (
            <div className="flex flex-col gap-4">
              <div className="rounded-md border bg-muted/30 p-4 text-sm">
                <p className="font-medium text-foreground">{state.message}</p>
                <p className="mt-2 text-muted-foreground">
                  พอเจ้าของระบบอนุมัติแล้ว จะได้ลิงก์ร้านและลิงก์แอดมินของตัวเอง
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button asChild>
                  <Link href="/login">
                    <LogIn className="size-3.5" />
                    ไปหน้าเข้าสู่ระบบ
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/signup">
                    <UserPlus className="size-3.5" />
                    สมัครอีกร้าน
                  </Link>
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-5">
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="email">อีเมล</FieldLabel>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="owner@yourshop.com"
                    value={state.email}
                    onChange={(event) => setState((current) => ({ ...current, email: event.target.value }))}
                    required
                  />
                  <p className="text-xs text-muted-foreground">ใช้เป็นบัญชีล็อกอินของเจ้าของร้าน</p>
                </Field>

                <Field>
                  <FieldLabel htmlFor="shopName">ชื่อร้าน</FieldLabel>
                  <Input
                    id="shopName"
                    placeholder="KMO RACK BAR CUSTOM"
                    value={state.shopName}
                    onChange={(event) => setState((current) => ({ ...current, shopName: event.target.value }))}
                    required
                  />
                  <p className="text-xs text-muted-foreground">ชื่อที่จะแสดงบนหน้าเว็บและใน control center</p>
                </Field>

                <Field>
                  <FieldLabel htmlFor="slug">Slug</FieldLabel>
                  <Input
                    id="slug"
                    placeholder="kmorackbarcustom"
                    value={state.slug}
                    onChange={(event) => {
                      setSlugTouched(true);
                      setState((current) => ({ ...current, slug: normalizeSignupSlug(event.target.value) }));
                    }}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    slug คือชื่อเว็บร้าน เช่น <span className="font-medium text-foreground">kmorackbarcustom</span> จะได้ลิงก์
                    <span className="mx-1 font-medium text-foreground">{preview.customer}</span>
                  </p>
                </Field>

                <Field>
                  <FieldLabel htmlFor="phone">เบอร์โทร (ไม่บังคับ)</FieldLabel>
                  <Input
                    id="phone"
                    type="tel"
                    autoComplete="tel"
                    placeholder="0812345678"
                    value={state.phone}
                    onChange={(event) => setState((current) => ({ ...current, phone: event.target.value }))}
                  />
                </Field>

                <div className="grid gap-3 md:grid-cols-2">
                  <Field>
                    <FieldLabel htmlFor="password">พาสเวิร์ด</FieldLabel>
                    <Input
                      id="password"
                      type="password"
                      autoComplete="new-password"
                      placeholder="อย่างน้อย 8 ตัวอักษร"
                      value={state.password}
                      onChange={(event) => setState((current) => ({ ...current, password: event.target.value }))}
                      required
                    />
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="confirmPassword">ยืนยันพาสเวิร์ด</FieldLabel>
                    <Input
                      id="confirmPassword"
                      type="password"
                      autoComplete="new-password"
                      placeholder="พิมพ์ซ้ำอีกครั้ง"
                      value={state.confirmPassword}
                      onChange={(event) => setState((current) => ({ ...current, confirmPassword: event.target.value }))}
                      required
                    />
                  </Field>
                </div>

                <Field>
                  <FieldLabel htmlFor="note">หมายเหตุ (ไม่บังคับ)</FieldLabel>
                  <textarea
                    id="note"
                    className="min-h-24 rounded-md border border-border bg-background px-3 py-2 text-sm outline-none"
                    placeholder="เช่น ต้องการเริ่มใช้งานเดือนหน้า / ใช้เบอร์นี้ติดต่อ"
                    value={state.note}
                    onChange={(event) => setState((current) => ({ ...current, note: event.target.value }))}
                  />
                </Field>

                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-md border bg-muted/20 p-3">
                    <p className="text-xs uppercase text-muted-foreground">Customer URL</p>
                    <p className="mt-1 break-all font-medium">{preview.customer}</p>
                  </div>
                  <div className="rounded-md border bg-muted/20 p-3">
                    <p className="text-xs uppercase text-muted-foreground">Admin URL</p>
                    <p className="mt-1 break-all font-medium">{preview.admin}</p>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground">
                  เจ้าของระบบจะตรวจคำขอและอนุมัติให้ร้านใช้งานต่อ หลังจากนั้นเจ้าของร้านจะใช้เมลและรหัสผ่านนี้ล็อกอินได้
                </p>

                <Button type="submit" disabled={state.loading}>
                  {state.loading ? <Loader2 className="animate-spin" /> : <UserPlus />}
                  {copy.button}
                </Button>
              </FieldGroup>
            </form>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
