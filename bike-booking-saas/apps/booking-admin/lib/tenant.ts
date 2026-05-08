import { headers } from "next/headers";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Shop } from "./types";
import { getShopId } from "./utils";

export type TenantShopContext = {
  shop: Shop | null;
  shopId: string | null;
  shopSlug: string | null;
};

export async function getTenantShopContext(supabase: SupabaseClient): Promise<TenantShopContext> {
  const headersList = await headers();
  const shopSlug = headersList.get("x-shop-slug");

  if (shopSlug) {
    const { data: shop } = await supabase.schema("bike_booking").from("shops").select("*").eq("slug", shopSlug).maybeSingle<Shop>();
    return { shop: shop ?? null, shopId: shop?.id ?? null, shopSlug };
  }

  const fallbackShopId = getShopId();
  const { data: shop } = await supabase.schema("bike_booking").from("shops").select("*").eq("id", fallbackShopId).maybeSingle<Shop>();
  return { shop: shop ?? null, shopId: fallbackShopId, shopSlug: null };
}
