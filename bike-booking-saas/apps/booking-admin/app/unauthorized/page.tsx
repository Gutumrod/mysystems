import { headers } from "next/headers";
import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getPortalModeFromHost } from "@/lib/portal";

export const dynamic = "force-dynamic";

export default async function UnauthorizedPage() {
  const headersList = await headers();
  const mode = getPortalModeFromHost(headersList.get("host"));
  const isControl = mode === "control";

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldAlert className="size-5 text-red-500" />
            {isControl ? "ไม่มีสิทธิ์เข้าถึง Control Center" : "ไม่มีสิทธิ์เข้าถึงหน้านี้"}
          </CardTitle>
          <CardDescription>
            {isControl
              ? "บัญชีนี้ยังไม่ได้ถูกเพิ่มในรายชื่อผู้ดูแลระบบที่มีสิทธิ์เข้าใช้งาน control.craftbikelab.com กรุณาติดต่อเจ้าของระบบเพื่อผูกสิทธิ์ก่อนเข้าใช้งาน"
              : "บัญชีนี้ยังไม่ได้ถูกเพิ่มในรายชื่อผู้ดูแลที่มีสิทธิ์เข้าใช้งานหน้านี้ กรุณาติดต่อเจ้าของระบบเพื่อผูกสิทธิ์ก่อนเข้าใช้งาน"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/login">
            <Button className="w-full" variant="outline">
              {isControl ? "กลับไปหน้าเข้าสู่ระบบเจ้าของระบบ" : "กลับไปหน้าเข้าสู่ระบบ"}
            </Button>
          </Link>
        </CardContent>
      </Card>
    </main>
  );
}
