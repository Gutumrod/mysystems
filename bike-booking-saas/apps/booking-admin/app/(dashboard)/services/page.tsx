import { ServicesManager } from "@/components/services/ServicesManager";
import { demoServices, hasSupabaseEnv } from "@/lib/mock-data";
import { getTenantShopContext } from "@/lib/tenant";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ServiceItem } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function ServicesPage() {
  if (!hasSupabaseEnv()) {
    return <ServicesShell services={demoServices} shopId="11111111-1111-1111-1111-111111111111" demoMode />;
  }

  const supabase = await createSupabaseServerClient();
  const { shopId } = await getTenantShopContext(supabase);
  if (!shopId) return null;
  const { data } = await supabase.schema("bike_booking").from("service_items").select("*").eq("shop_id", shopId).order("sort_order").returns<ServiceItem[]>();

  return <ServicesShell services={data ?? []} shopId={shopId} />;
}

function ServicesShell({ services, shopId, demoMode = false }: { services: ServiceItem[]; shopId: string; demoMode?: boolean }) {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-bold">บริการ</h1>
        <p className="text-sm text-muted-foreground">เพิ่ม แก้ไข ซ่อน และลากเรียงลำดับบริการ</p>
      </div>
      <ServicesManager initialServices={services} shopId={shopId} demoMode={demoMode} />
    </div>
  );
}
