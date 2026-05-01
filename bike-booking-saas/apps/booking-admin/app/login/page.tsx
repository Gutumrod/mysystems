"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, LogIn } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { createBrowserClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function login(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    const supabase = createBrowserClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (error) {
      toast.error("เข้าสู่ระบบไม่สำเร็จ");
      return;
    }

    await supabase.auth.getSession();
    router.replace("/dashboard");
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>เข้าสู่ระบบร้าน</CardTitle>
          <CardDescription>ใช้บัญชี Supabase Auth ที่ผูกกับร้านในตาราง shop_users</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={login}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="email">อีเมล</FieldLabel>
                <Input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
              </Field>
              <Field>
                <FieldLabel htmlFor="password">รหัสผ่าน</FieldLabel>
                <Input id="password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required />
              </Field>
              <Button type="submit" disabled={loading}>
                {loading ? <Loader2 className="animate-spin" /> : <LogIn />}
                เข้าสู่ระบบ
              </Button>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
