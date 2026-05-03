import Link from "next/link";
import { redirect } from "next/navigation";
import { CalendarCheck, CalendarDays, ClipboardList, LayoutDashboard, Settings, Wrench } from "lucide-react";
import { hasSupabaseEnv } from "@/lib/mock-data";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getShopId } from "@/lib/utils";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/today", label: "งานวันนี้", icon: CalendarCheck },
  { href: "/calendar", label: "ปฏิทิน", icon: CalendarDays },
  { href: "/bookings", label: "การจอง", icon: ClipboardList },
  { href: "/services", label: "บริการ", icon: Wrench },
  { href: "/settings/shop", label: "ตั้งค่า", icon: Settings }
];

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  if (hasSupabaseEnv()) {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase.auth.getUser();
    if (!data.user) redirect("/login");

    const { data: membership } = await supabase
      .schema("bike_booking")
      .from("shop_users")
      .select("shop_id")
      .eq("shop_id", getShopId())
      .eq("user_id", data.user.id)
      .maybeSingle();

    if (!membership) redirect("/unauthorized");
  }

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[240px_1fr]">
      {/* Sidebar */}
      <aside className="hidden border-r border-border bg-card lg:block">
        <div className="border-b border-border px-5 py-4">
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Bike Booking</p>
          <h1 className="mt-0.5 text-lg font-bold">Admin</h1>
        </div>
        <nav className="flex flex-col gap-1 p-3">
          {nav.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex min-h-10 items-center gap-3 rounded-md px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <Icon className="size-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-col">
        {/* Mobile top nav */}
        <header className="sticky top-0 z-20 flex gap-1 overflow-x-auto border-b border-border bg-card p-2 lg:hidden">
          {nav.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex min-h-10 min-w-20 flex-col items-center justify-center gap-1 rounded-md px-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <Icon className="size-4" />
                {item.label}
              </Link>
            );
          })}
        </header>

        <main className="p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
