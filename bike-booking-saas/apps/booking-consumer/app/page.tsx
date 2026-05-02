import { addDays } from "date-fns";
import { headers } from "next/headers";
import { AlertCircle } from "lucide-react";
import { BookingForm } from "@/components/booking/BookingForm";
import { Card, CardContent } from "@/components/ui/card";
import { demoBookings, demoHolidays, demoServices, demoShop, hasSupabaseEnv } from "@/lib/mock-data";
import { formatBangkokISODate, getShopId } from "@/lib/utils";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { BookingSlot, ServiceItem, Shop, ShopHoliday } from "@/lib/types";

export default async function Page() {
  if (!hasSupabaseEnv()) {
    return <BookingShell shop={demoShop} services={demoServices} holidays={demoHolidays} bookings={demoBookings} demoMode />;
  }

  const supabase = await createSupabaseServerClient();
  const now = new Date();
  const today = formatBangkokISODate(now);
  const limit = formatBangkokISODate(addDays(now, 45));

  // Read slug injected by middleware (production subdomain routing).
  // Falls back to NEXT_PUBLIC_SHOP_ID UUID in local development.
  const headersList = await headers();
  const shopSlug = headersList.get("x-shop-slug");

  // Step 1: Fetch the shop record (slug → production, UUID → local dev)
  const { data: shop } = shopSlug
    ? await supabase.schema("bike_booking").from("shops").select("*").eq("slug", shopSlug).single<Shop>()
    : await supabase.schema("bike_booking").from("shops").select("*").eq("id", getShopId()).single<Shop>();

  if (!shop) {
    return (
      <main className="mx-auto flex min-h-screen max-w-2xl items-center px-4">
        <Card>
          <CardContent className="flex items-start gap-3 p-5">
            <AlertCircle className="mt-1 text-[#ff7350]" />
            <div>
              <h1 className="text-lg font-semibold">ร้านค้าไม่พบ</h1>
              <p className="text-sm text-muted-foreground">ไม่พบร้านค้านี้ในระบบ</p>
            </div>
          </CardContent>
        </Card>
      </main>
    );
  }

  // Step 2: Fetch services, holidays, and bookings in parallel using shop.id
  const [{ data: services }, { data: holidays }, { data: bookings }] = await Promise.all([
    supabase.schema("bike_booking").from("service_items").select("*").eq("shop_id", shop.id).eq("is_active", true).order("sort_order").returns<ServiceItem[]>(),
    supabase.schema("bike_booking").from("shop_holidays").select("*").eq("shop_id", shop.id).gte("holiday_date", today).returns<ShopHoliday[]>(),
    supabase
      .schema("bike_booking")
      .from("public_booking_slots")
      .select("*")
      .eq("shop_id", shop.id)
      .gte("booking_date", today)
      .lte("booking_date", limit)
      .returns<BookingSlot[]>()
  ]);

  return <BookingShell shop={shop} services={services ?? []} holidays={holidays ?? []} bookings={bookings ?? []} />;
}

function BookingShell({
  shop,
  services,
  holidays,
  bookings,
  demoMode = false
}: {
  shop: Shop;
  services: ServiceItem[];
  holidays: ShopHoliday[];
  bookings: BookingSlot[];
  demoMode?: boolean;
}) {
  return (
    <>
      {/* Background */}
      <div className="fixed inset-0 -z-10 pointer-events-none bg-[#0e0e0e]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/hero-bike.png"
          alt=""
          className="absolute inset-0 w-full h-full object-cover opacity-[0.12] mix-blend-luminosity grayscale"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0e0e0e] via-[#0e0e0e]/85 to-[#0e0e0e]/60" />
        <div className="absolute -top-40 -right-20 w-[600px] h-[600px] rounded-full bg-[#00cffc]/[0.04] blur-[150px]" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-[#ff7350]/[0.03] blur-[120px]" />
      </div>

      {/* Fixed header */}
      <header className="fixed top-0 w-full z-50 h-16 flex items-center justify-between px-6 bg-black/60 backdrop-blur-xl border-b border-[#69daff]/10 shadow-[0_20px_40px_rgba(0,0,0,0.6)]">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-zinc-500 cursor-pointer hover:text-[#69daff] transition-colors select-none">
            menu
          </span>
          <h1 className="min-w-0 truncate font-headline text-xl font-black italic uppercase tracking-wider text-[#69daff]">
            {shop.name}
          </h1>
        </div>
        <span className="material-symbols-outlined text-zinc-500 cursor-pointer hover:text-[#69daff] transition-colors select-none">
          account_circle
        </span>
      </header>

      {/* Main content */}
      <main className="pt-20 px-4 pb-[calc(7rem+env(safe-area-inset-bottom,0px))]">
        <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[360px_1fr] lg:py-8">

          {/* Aside */}
          <aside className="flex flex-col gap-5">

            {/* Shop hero card */}
            <div className="relative bg-[#131313] rounded-3xl p-8 overflow-hidden border-l-4 border-[#69daff]/30">
              <span className="font-headline text-xs tracking-[0.2em] uppercase text-[#69daff]/60 block mb-1">
                ระบบจองคิวออนไลน์
              </span>
              <h2 className="break-words font-headline text-4xl font-black italic uppercase leading-none tracking-tighter">
                {shop.name}
              </h2>
              <p className="mt-3 text-sm text-[#adaaaa] leading-relaxed">
                เลือกบริการและเวลาที่สะดวกได้เลย ระบบจะยืนยันคิวให้อัตโนมัติ
              </p>
              {/* decorative icon */}
              <div className="absolute -right-6 -bottom-6 opacity-[0.06] pointer-events-none select-none">
                <span className="material-symbols-outlined text-[120px]">sports_motorsports</span>
              </div>
            </div>

            {/* Contact telemetry chips */}
            <div>
              <h4 className="text-[#adaaaa] text-xs uppercase tracking-[0.2em] px-2 mb-3">Support Channels</h4>
              <div className="flex flex-col gap-3">
                <div className="bg-[#1a1a1a] p-4 flex flex-col items-start gap-3 border-l-[3px] border-[#ff7350] sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="material-symbols-outlined text-[#ff7350] text-xl select-none">call</span>
                    <span className="shrink-0 text-xs uppercase tracking-widest text-[#adaaaa]">โทรศัพท์</span>
                  </div>
                  <span className="w-full break-all text-left text-sm font-semibold sm:w-auto sm:text-right">{shop.phone ?? "-"}</span>
                </div>
                <div className="bg-[#1a1a1a] p-4 flex flex-col items-start gap-3 border-l-[3px] border-[#ff7350] sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="material-symbols-outlined text-[#ff7350] text-xl select-none">chat</span>
                    <span className="shrink-0 text-xs uppercase tracking-widest text-[#adaaaa]">LINE ID</span>
                  </div>
                  <span className="w-full break-all text-left text-sm font-semibold sm:w-auto sm:text-right">{shop.line_id ?? "-"}</span>
                </div>
                <div className="bg-[#1a1a1a] p-4 flex flex-col items-start gap-3 border-l-[3px] border-[#ff7350] sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="material-symbols-outlined text-[#ff7350] text-xl select-none">public</span>
                    <span className="shrink-0 text-xs uppercase tracking-widest text-[#adaaaa]">Facebook</span>
                  </div>
                  <span className="w-full break-all text-left text-sm font-semibold sm:w-auto sm:text-right">{shop.facebook_url ?? "-"}</span>
                </div>
              </div>
            </div>
          </aside>

          {/* Booking form */}
          <BookingForm
            shop={shop}
            services={services}
            holidays={holidays}
            bookings={bookings}
            demoMode={demoMode}
          />
        </div>
      </main>

      {/* Fixed bottom nav */}
      <nav
        className="fixed bottom-0 w-full rounded-t-3xl z-50 bg-zinc-900/80 backdrop-blur-2xl shadow-[0_-10px_30px_rgba(0,0,0,0.8)] flex justify-around items-center px-4 py-3"
        style={{ paddingBottom: "calc(1.5rem + env(safe-area-inset-bottom, 0px))" }}
      >
        <div className="flex items-center justify-center bg-[#69daff]/20 text-[#69daff] rounded-xl p-3 shadow-[inset_0_0_10px_rgba(105,218,255,0.2)]">
          <span
            className="material-symbols-outlined select-none"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            home_max
          </span>
        </div>
        <div className="flex items-center justify-center text-zinc-700 p-3 rounded-xl">
          <span className="material-symbols-outlined select-none">calendar_month</span>
        </div>
        <div className="flex items-center justify-center text-zinc-700 p-3 rounded-xl">
          <span className="material-symbols-outlined select-none">sports_motorsports</span>
        </div>
        <div className="flex items-center justify-center text-zinc-700 p-3 rounded-xl">
          <span className="material-symbols-outlined select-none">settings_input_component</span>
        </div>
      </nav>
    </>
  );
}
