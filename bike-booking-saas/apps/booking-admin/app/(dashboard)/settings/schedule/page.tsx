import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ScheduleSettings } from "@/components/settings/ScheduleSettings";
import { demoHolidays, demoShop, hasSupabaseEnv } from "@/lib/mock-data";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getShopId } from "@/lib/utils";
import type { Shop, ShopHoliday } from "@/lib/types";

export default async function SchedulePage() {
  if (!hasSupabaseEnv()) {
    return <ScheduleShell shop={demoShop} holidays={demoHolidays} demoMode />;
  }

  const supabase = await createSupabaseServerClient();
  const shopId = getShopId();
  const [{ data: shop }, { data: holidays }] = await Promise.all([
    supabase.schema("bike_booking").from("shops").select("*").eq("id", shopId).single<Shop>(),
    supabase.schema("bike_booking").from("shop_holidays").select("*").eq("shop_id", shopId).order("holiday_date").returns<ShopHoliday[]>()
  ]);

  if (!shop) return null;

  return <ScheduleShell shop={shop} holidays={holidays ?? []} />;
}

function ScheduleShell({ shop, holidays, demoMode = false }: { shop: Shop; holidays: ShopHoliday[]; demoMode?: boolean }) {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">เวลาทำการ</h1>
          <p className="text-sm text-muted-foreground">ตั้งวันเปิดปิดและวันหยุดพิเศษ</p>
        </div>
        <Link href="/settings/shop">
          <Button variant="outline">ข้อมูลร้าน</Button>
        </Link>
      </div>
      <ScheduleSettings shop={shop} initialHolidays={holidays} demoMode={demoMode} />
    </div>
  );
}

