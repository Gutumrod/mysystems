import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function UnauthorizedPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldAlert className="size-5 text-red-500" />
            ไม่มีสิทธิ์เข้าร้านนี้
          </CardTitle>
          <CardDescription>
            บัญชีนี้ยังไม่ได้ถูกเพิ่มในรายชื่อผู้ดูแลร้าน กรุณาติดต่อเจ้าของระบบเพื่อผูกสิทธิ์ก่อนเข้าใช้งาน
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/login">
            <Button className="w-full" variant="outline">กลับไปหน้าเข้าสู่ระบบ</Button>
          </Link>
        </CardContent>
      </Card>
    </main>
  );
}
