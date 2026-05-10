"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, LogIn } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { createBrowserClient } from "@/lib/supabase/client";
import type { PortalMode } from "@/lib/portal";
import { getPortalLoginCopy } from "@/lib/portal";

type Props = {
  mode: PortalMode;
};

export function PortalLoginForm({ mode }: Props) {
  const router = useRouter();
  const copy = getPortalLoginCopy(mode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function login(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);

    try {
      const supabase = createBrowserClient();
      const { error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        toast.error("เข้าสู่ระบบไม่สำเร็จ");
        return;
      }

      await supabase.auth.getSession();
      router.replace(copy.successPath);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{copy.badge}</CardTitle>
          <CardDescription>{copy.description}</CardDescription>
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
                {copy.button}
              </Button>

              <div className="flex flex-wrap gap-2 pt-1">
                <Button asChild variant="outline" size="sm">
                  <Link href="/signup">สมัครร้านใหม่</Link>
                </Button>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/forgot-password">ลืมรหัสผ่าน</Link>
                </Button>
              </div>

              <p className="text-xs text-muted-foreground">{copy.signupHint}</p>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
