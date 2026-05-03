import { redirect } from "next/navigation";
import { BarChart3, Building2, Shield, Store } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/mock-data";

type ShopRow = {
  id: string;
  slug: string;
  name: string;
  phone: string | null;
  line_id: string | null;
  facebook_url: string | null;
  subscription_status: "trial" | "active" | "suspended" | "cancelled";
  created_at: string;
};

type BookingRow = {
  shop_id: string;
};

export const dynamic = "force-dynamic";

export default async function PlatformPage() {
  if (!hasSupabaseEnv()) {
    return (
      <main className="mx-auto flex min-h-screen max-w-4xl items-center px-4">
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Platform admin</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            ตั้งค่า Supabase environment ก่อน ระบบจะใช้หน้านี้เป็นศูนย์กลางคุมหลายร้าน
          </CardContent>
        </Card>
      </main>
    );
  }

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: platformUser } = await supabase
    .schema("bike_booking")
    .from("platform_users")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!platformUser) {
    redirect("/unauthorized");
  }

  const { data: shops } = await supabase
    .schema("bike_booking")
    .from("shops")
    .select("*")
    .order("created_at", { ascending: false })
    .returns<ShopRow[]>();

  const shopRows = shops ?? [];
  const bookingCounts = await Promise.all(
    shopRows.map(async (shop) => {
      const { count } = await supabase
        .schema("bike_booking")
        .from("bookings")
        .select("id", { count: "exact", head: true })
        .eq("shop_id", shop.id);

      return { shop_id: shop.id, count: count ?? 0 } satisfies BookingRow & { count: number };
    })
  );
  const totalShops = shopRows.length;
  const activeShops = shopRows.filter((shop) => shop.subscription_status === "active").length;
  const suspendedShops = shopRows.filter((shop) => shop.subscription_status === "suspended").length;
  const totalBookings = bookingCounts.reduce((sum, row) => sum + row.count, 0);

  const bookingCountByShop = new Map<string, number>();
  for (const booking of bookingCounts) {
    bookingCountByShop.set(booking.shop_id, booking.count);
  }

  return (
    <main className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 lg:px-6">
      <header className="flex flex-col gap-2">
        <div className="inline-flex w-fit items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
          <Shield className="size-3.5" />
          Platform Admin
        </div>
        <h1 className="text-3xl font-bold">ศูนย์กลางคุมหลายร้าน</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          ใช้หน้านี้ดูภาพรวมของร้านทั้งหมด และเป็นจุดเริ่มต้นสำหรับการจัดการสิทธิ์ร้านใหม่แบบ 1 ร้าน = 1 owner
        </p>
      </header>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <Stat title="ร้านทั้งหมด" value={totalShops} icon={Building2} />
        <Stat title="ร้าน active" value={activeShops} icon={Store} />
        <Stat title="ร้าน suspended" value={suspendedShops} icon={Shield} />
        <Stat title="การจองทั้งหมด" value={totalBookings} icon={BarChart3} />
      </section>

      <Card>
        <CardHeader>
          <CardTitle>รายการร้าน</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="py-3 pr-4 font-medium">ชื่อร้าน</th>
                <th className="py-3 pr-4 font-medium">Slug</th>
                <th className="py-3 pr-4 font-medium">สถานะ</th>
                <th className="py-3 pr-4 font-medium">เบอร์</th>
                <th className="py-3 pr-4 font-medium">คิวทั้งหมด</th>
              </tr>
            </thead>
            <tbody>
              {shopRows.map((shop) => (
                <tr key={shop.id} className="border-b last:border-b-0">
                  <td className="py-4 pr-4 font-medium">{shop.name}</td>
                  <td className="py-4 pr-4 text-muted-foreground">{shop.slug}</td>
                  <td className="py-4 pr-4">
                    <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium capitalize">
                      {shop.subscription_status}
                    </span>
                  </td>
                  <td className="py-4 pr-4 text-muted-foreground">{shop.phone ?? "-"}</td>
                  <td className="py-4 pr-4 text-muted-foreground">{bookingCountByShop.get(shop.id) ?? 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </main>
  );
}

function Stat({ title, value, icon: Icon }: { title: string; value: number; icon: typeof Building2 }) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between gap-4 p-5">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="mt-2 text-3xl font-bold">{value}</p>
        </div>
        <Icon className="size-5 text-muted-foreground" />
      </CardContent>
    </Card>
  );
}
