"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Mail, ArrowLeft } from "lucide-react";
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

export function PortalForgotPasswordForm({ mode }: Props) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [message, setMessage] = useState("");

  const title = mode === "control" ? "รีเซ็ตรหัส Control Center" : "รีเซ็ตรหัสร้าน";
  const description =
    mode === "control"
      ? "กรอกอีเมลเจ้าของระบบ เราจะส่งลิงก์รีเซ็ตรหัสผ่านไปที่อีเมลนั้น"
      : "กรอกอีเมลเจ้าของร้าน เราจะส่งลิงก์รีเซ็ตรหัสผ่านไปที่อีเมลนั้น";

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setSubmitted(false);
    setMessage("");

    try {
      const supabase = createBrowserClient();
      const redirectTo = `${window.location.origin}/reset-password`;
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo
      });

      if (error) {
        toast.error(error.message || "ส่งลิงก์รีเซ็ตรหัสไม่สำเร็จ");
        return;
      }

      const nextMessage = "ส่งลิงก์รีเซ็ตรหัสผ่านแล้ว เช็กอีเมลเพื่อกดลิงก์ต่อ";
      setSubmitted(true);
      setMessage(nextMessage);
      toast.success(nextMessage);
      router.refresh();
    } catch (error) {
      const nextMessage = error instanceof Error ? error.message : "ส่งลิงก์รีเซ็ตรหัสไม่สำเร็จ";
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
                <p className="mt-2 text-muted-foreground">
                  ถ้าอีเมลนี้มีบัญชีในระบบจริง จะได้รับลิงก์รีเซ็ตรหัสผ่าน
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button asChild>
                  <Link href="/login">
                    <ArrowLeft className="size-3.5" />
                    กลับไป login
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/signup">
                    <Mail className="size-3.5" />
                    สมัครร้านใหม่
                  </Link>
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={submit}>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="email">อีเมล</FieldLabel>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="owner@yourshop.com"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                  />
                </Field>
                <p className="text-xs text-muted-foreground">
                  เราจะส่งลิงก์รีเซ็ตไปที่อีเมลนี้ แล้วให้คุณตั้งรหัสผ่านใหม่ได้
                </p>
                <Button type="submit" disabled={loading}>
                  {loading ? <Loader2 className="animate-spin" /> : <Mail />}
                  ส่งลิงก์รีเซ็ตรหัส
                </Button>
                <Button asChild variant="ghost">
                  <Link href="/login">กลับไปหน้าเข้าสู่ระบบ</Link>
                </Button>
              </FieldGroup>
            </form>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
