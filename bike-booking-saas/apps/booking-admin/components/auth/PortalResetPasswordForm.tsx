"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ShieldCheck, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { createBrowserClient } from "@/lib/supabase/client";
import type { PortalMode } from "@/lib/portal";

type Props = {
  mode: PortalMode;
};

export function PortalResetPasswordForm({ mode }: Props) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [message, setMessage] = useState("");

  const title = mode === "control" ? "ตั้งรหัสใหม่ของ Control Center" : "ตั้งรหัสใหม่ของร้าน";
  const description =
    mode === "control"
      ? "ถ้าเปิดลิงก์จากอีเมลรีเซ็ตหรือกำลังล็อกอินอยู่ ให้ตั้งรหัสใหม่ได้จากหน้านี้"
      : "ถ้าเปิดลิงก์จากอีเมลรีเซ็ตหรือกำลังล็อกอินอยู่ ให้ตั้งรหัสใหม่ได้จากหน้านี้";

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (password !== confirmPassword) {
      toast.error("รหัสผ่านไม่ตรงกัน");
      return;
    }

    setLoading(true);
    setSubmitted(false);
    setMessage("");

    try {
      const supabase = createBrowserClient();
      const { data: sessionData } = await supabase.auth.getSession();

      if (!sessionData.session) {
        toast.error("กรุณาเปิดลิงก์รีเซ็ตรหัสจากอีเมลก่อน");
        return;
      }

      const { error } = await supabase.auth.updateUser({
        password
      });

      if (error) {
        toast.error(error.message || "ตั้งรหัสใหม่ไม่สำเร็จ");
        return;
      }

      const nextMessage = "ตั้งรหัสใหม่แล้ว กลับไปเข้าสู่ระบบได้เลย";
      setSubmitted(true);
      setMessage(nextMessage);
      toast.success(nextMessage);
      await supabase.auth.signOut();
      router.replace("/login");
      router.refresh();
    } catch (error) {
      const nextMessage = error instanceof Error ? error.message : "ตั้งรหัสใหม่ไม่สำเร็จ";
      toast.error(nextMessage);
      setMessage(nextMessage);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          {submitted ? (
            <div className="flex flex-col gap-4">
              <div className="rounded-md border bg-muted/30 p-4 text-sm">
                <p className="font-medium text-foreground">{message}</p>
                <p className="mt-2 text-muted-foreground">ระบบจะพากลับไปหน้า login เพื่อใช้รหัสใหม่ทันที</p>
              </div>
              <Button asChild>
                <Link href="/login">
                  <ArrowLeft className="size-3.5" />
                  ไปหน้าเข้าสู่ระบบ
                </Link>
              </Button>
            </div>
          ) : (
            <form onSubmit={submit}>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="password">รหัสผ่านใหม่</FieldLabel>
                  <Input
                    id="password"
                    type="password"
                    autoComplete="new-password"
                    placeholder="อย่างน้อย 8 ตัวอักษร"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="confirmPassword">ยืนยันรหัสผ่านใหม่</FieldLabel>
                  <Input
                    id="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    placeholder="พิมพ์ซ้ำอีกครั้ง"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    required
                  />
                </Field>
                <p className="text-xs text-muted-foreground">
                  ใช้รหัสนี้กับบัญชี Supabase Auth ของคุณจากนั้นเข้าสู่ระบบใหม่ได้เลย
                </p>
                <Button type="submit" disabled={loading}>
                  {loading ? <Loader2 className="animate-spin" /> : <ShieldCheck />}
                  ตั้งรหัสใหม่
                </Button>
                <Button asChild variant="ghost">
                  <Link href="/forgot-password">ส่งลิงก์รีเซ็ตอีกครั้ง</Link>
                </Button>
              </FieldGroup>
            </form>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
