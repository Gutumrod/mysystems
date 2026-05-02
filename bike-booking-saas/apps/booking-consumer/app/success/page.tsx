import Link from "next/link";
import { format, parseISO } from "date-fns";
import { CopyBookingButton } from "@/components/booking/CopyBookingButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { demoBookings, demoServices, demoShop, hasSupabaseEnv } from "@/lib/mock-data";
import { bookingCopy, getShopId } from "@/lib/utils";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { BookingConfirmation, ServiceItem, Shop } from "@/lib/types";

export default async function SuccessPage({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const { id } = await searchParams;
  if (!hasSupabaseEnv()) {
    const booking = demoBookings.find((item) => item.id === id) ?? demoBookings[0];
    const selectedNames = demoServices.filter((service) => booking.service_items.includes(service.id)).map((service) => service.name);
    return <SuccessShell shop={demoShop} booking={booking} serviceNames={selectedNames} />;
  }

  const supabase = await createSupabaseServerClient();
  const shopId = getShopId();

  const [{ data: shop }, { data: booking }, { data: services }] = await Promise.all([
    supabase.schema("bike_booking").from("shops").select("*").eq("id", shopId).single<Shop>(),
    id
      ? supabase
          .schema("bike_booking")
          .rpc("get_public_booking_confirmation", { target_booking_id: id, target_shop_id: shopId })
          .single<BookingConfirmation>()
      : Promise.resolve({ data: null }),
    supabase.schema("bike_booking").from("service_items").select("*").eq("shop_id", shopId).returns<ServiceItem[]>()
  ]);

  if (!shop || !booking) {
    return (
      <main className="mx-auto flex min-h-screen max-w-xl items-center px-4">
        <Card>
          <CardContent className="p-5">
            <h1 className="text-lg font-semibold">ไม่พบข้อมูลการจอง</h1>
            <Link href="/">
              <Button className="mt-4">กลับไปจองใหม่</Button>
            </Link>
          </CardContent>
        </Card>
      </main>
    );
  }

  const selectedNames = (services ?? []).filter((service) => booking.service_items.includes(service.id)).map((service) => service.name);
  return <SuccessShell shop={shop} booking={booking} serviceNames={selectedNames} />;
}

function SuccessShell({ shop, booking, serviceNames }: { shop: Shop; booking: BookingConfirmation; serviceNames: string[] }) {
  const copyText = bookingCopy(shop, booking, serviceNames);
  const ticketId = `BK-${booking.id.slice(0, 8).toUpperCase()}`;
  const formattedDate = (() => {
    try {
      return format(parseISO(booking.booking_date), "d MMM yyyy");
    } catch {
      return booking.booking_date;
    }
  })();

  return (
    <>
      {/* Background */}
      <div className="fixed inset-0 -z-10 pointer-events-none bg-[#0e0e0e]">
        {/* motorcycle image */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/hero-bike.png"
          alt=""
          className="absolute inset-0 w-full h-full object-cover opacity-20 mix-blend-luminosity grayscale"
        />
        {/* dark overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0e0e0e] via-[#0e0e0e]/80 to-[#0e0e0e]/60" />
        {/* ambient glows */}
        <div className="absolute -top-40 -right-20 w-[500px] h-[500px] rounded-full bg-[#00cffc]/[0.06] blur-[120px]" />
        <div className="absolute -bottom-20 right-1/4 w-[300px] h-[300px] rounded-full bg-[#7c4dff]/[0.04] blur-[80px]" />
      </div>

      {/* Fixed top header */}
      <header className="fixed top-0 w-full z-50 h-16 flex items-center justify-between px-6 bg-black/60 backdrop-blur-xl border-b border-[#69daff]/10 shadow-[0_20px_40px_rgba(0,0,0,0.6)]">
        <h1 className="font-headline text-xl font-black italic uppercase tracking-wider text-[#69daff]">
          {shop.name}
        </h1>
        <span className="material-symbols-outlined text-zinc-500 cursor-pointer hover:text-[#69daff] transition-colors select-none">
          account_circle
        </span>
      </header>

      {/* Main scroll area */}
      <main className="pt-24 pb-36 px-6 max-w-lg mx-auto overflow-x-hidden">

        {/* Hero SUCCESS section */}
        <section className="mb-8 relative">
          <div className="absolute -left-20 -top-10 w-64 h-64 rounded-full bg-[#00cffc]/[0.06] blur-[100px] pointer-events-none" />
          <div className="relative bg-[#131313] rounded-3xl p-8 overflow-hidden border-l-4 border-[#69daff]/30">
            <span className="font-headline text-xs tracking-[0.2em] uppercase text-[#69daff]/50 block mb-1">
              STATUS: NOMINAL
            </span>
            <h2 className="font-headline text-6xl font-black uppercase italic leading-none tracking-tighter">
              SUCCESS
            </h2>
            <div className="flex items-center gap-2 mt-4">
              <span
                className="material-symbols-outlined text-[#69daff] text-4xl select-none"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                check_circle
              </span>
              <p className="text-xs text-[#adaaaa] uppercase tracking-widest">Booking Confirmed</p>
            </div>
            {/* decorative background icon */}
            <div className="absolute -right-8 -bottom-8 opacity-[0.06] pointer-events-none select-none">
              <span className="material-symbols-outlined text-[160px]">settings_suggest</span>
            </div>
          </div>
        </section>

        {/* Booking details glass card */}
        <section className="mb-8">
          <div className="bg-[#20201f]/60 backdrop-blur-xl rounded-3xl p-8 shadow-[0_40px_60px_rgba(0,0,0,0.5)] border border-white/[0.05]">

            {/* ticket header */}
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-[#69daff] text-xs uppercase tracking-widest mb-1">Service Ticket</p>
                <h3 className="font-headline text-2xl font-semibold">#{ticketId}</h3>
              </div>
              <div className="shrink-0 text-left sm:text-right">
                <p className="text-[#adaaaa] text-xs uppercase tracking-wide mb-1">เวลา</p>
                <p className="font-headline text-lg font-semibold">{booking.booking_time_start}</p>
              </div>
            </div>

            {/* detail rows */}
            <div className="border-t border-white/[0.06] mb-8">
              <div className="flex flex-col gap-2 py-3 border-b border-white/[0.04] sm:flex-row sm:items-center sm:justify-between">
                <span className="text-[#adaaaa] text-xs uppercase tracking-widest shrink-0">รุ่นรถ</span>
                <span className="break-words font-semibold text-sm text-left sm:text-right">
                  {booking.bike_model}{booking.bike_year ? ` (${booking.bike_year})` : ""}
                </span>
              </div>
              <div className="flex flex-col gap-2 py-3 border-b border-white/[0.04] sm:flex-row sm:items-start sm:justify-between">
                <span className="text-[#adaaaa] text-xs uppercase tracking-widest shrink-0">บริการ</span>
                <span className="break-words font-semibold text-sm text-left leading-relaxed sm:text-right">
                  {serviceNames.length > 0 ? serviceNames.join(" · ") : "-"}
                </span>
              </div>
              <div className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
                <span className="text-[#adaaaa] text-xs uppercase tracking-widest">วันที่</span>
                <span className="font-semibold text-sm text-left sm:text-right">{formattedDate}</span>
              </div>
            </div>

            <CopyBookingButton text={copyText} />
          </div>
        </section>

        {/* Contact telemetry chips */}
        <section className="space-y-3">
          <h4 className="text-[#adaaaa] text-xs uppercase tracking-[0.2em] px-2">Support Channels</h4>
          <div className="flex flex-col gap-3">
            <div className="bg-[#1a1a1a] p-4 flex flex-col items-start gap-3 border-l-[3px] border-[#ff7350] sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-center gap-3">
                <span className="material-symbols-outlined text-[#ff7350] text-xl select-none">call</span>
                <span className="text-xs uppercase tracking-widest text-[#adaaaa]">โทรศัพท์</span>
              </div>
              <span className="w-full break-all text-left font-semibold text-sm sm:w-auto sm:text-right">{shop.phone ?? "-"}</span>
            </div>
            <div className="bg-[#1a1a1a] p-4 flex flex-col items-start gap-3 border-l-[3px] border-[#ff7350] sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-center gap-3">
                <span className="material-symbols-outlined text-[#ff7350] text-xl select-none">chat</span>
                <span className="text-xs uppercase tracking-widest text-[#adaaaa]">LINE ID</span>
              </div>
              <span className="w-full break-all text-left font-semibold text-sm sm:w-auto sm:text-right">{shop.line_id ?? "-"}</span>
            </div>
            <div className="bg-[#1a1a1a] p-4 flex flex-col items-start gap-3 border-l-[3px] border-[#ff7350] sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-center gap-3">
                <span className="material-symbols-outlined text-[#ff7350] text-xl select-none">public</span>
                <span className="text-xs uppercase tracking-widest text-[#adaaaa]">Facebook</span>
              </div>
              <span className="w-full break-all text-left font-semibold text-sm sm:w-auto sm:text-right">{shop.facebook_url ?? "-"}</span>
            </div>
          </div>
        </section>

        {/* Back link */}
        <div className="mt-10 flex justify-center">
          <Link
            href="/"
            className="relative text-[#adaaaa] text-xs uppercase tracking-[0.15em] hover:text-white transition-colors py-2 after:absolute after:bottom-0 after:left-0 after:h-px after:w-[40%] after:bg-current"
          >
            จองคิวใหม่
          </Link>
        </div>
      </main>

      {/* Fixed bottom nav */}
      <nav className="fixed bottom-0 w-full rounded-t-3xl z-50 bg-zinc-900/80 backdrop-blur-2xl shadow-[0_-10px_30px_rgba(0,0,0,0.8)] flex justify-around items-center px-4 py-3 pb-6">
        <Link
          href="/"
          className="flex items-center justify-center text-zinc-600 p-3 rounded-xl hover:text-[#69daff] hover:bg-white/5 transition-all active:scale-90 duration-100"
        >
          <span className="material-symbols-outlined select-none">home_max</span>
        </Link>
        <div className="flex items-center justify-center bg-[#69daff]/20 text-[#69daff] rounded-xl p-3 shadow-[inset_0_0_10px_rgba(105,218,255,0.2)]">
          <span
            className="material-symbols-outlined select-none"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            check_circle
          </span>
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

