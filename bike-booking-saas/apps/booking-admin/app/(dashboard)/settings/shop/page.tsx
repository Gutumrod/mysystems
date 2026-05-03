import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ShopSettingsForm } from "@/components/settings/ShopSettingsForm";
import { demoShop, hasSupabaseEnv } from "@/lib/mock-data";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getShopId } from "@/lib/utils";
import type { Shop } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function ShopSettingsPage() {
  if (!hasSupabaseEnv()) {
    return <ShopSettingsShell shop={demoShop} demoMode />;
  }

  const supabase = await createSupabaseServerClient();
  const { data: shop } = await supabase.schema("bike_booking").from("shops").select("*").eq("id", getShopId()).single<Shop>();

  if (!shop) return null;

  return <ShopSettingsShell shop={shop} />;
}

function ShopSettingsShell({ shop, demoMode = false }: { shop: Shop; demoMode?: boolean }) {
  return (
    <div className="flex max-w-2xl flex-col gap-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">ข้อมูลร้าน</h1>
          <p className="text-sm text-muted-foreground">แก้ไขช่องทางติดต่อที่แสดงให้ลูกค้าเห็น</p>
        </div>
        <Link href="/settings/schedule">
          <Button variant="outline">เวลาทำการ</Button>
        </Link>
      </div>
      <ShopSettingsForm shop={shop} demoMode={demoMode} />
    </div>
  );
}

