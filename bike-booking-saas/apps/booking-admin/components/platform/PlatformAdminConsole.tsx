"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, Clock3, Save, Search, Shield, Store, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { BookingDetailDialog } from "@/components/bookings/BookingDetailDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createBrowserClient } from "@/lib/supabase/client";
import type { Booking, BookingStatus, PlatformActivityLog, ServiceItem, ShopBillingEvent } from "@/lib/types";
import { bookingViewKindLabel, billingEventLabel, formatBookingSchedule, formatThaiDate, formatThaiDateTime, getBangkokISODateOffset, getShopBillingHealth, platformActivityLabel, serviceNames, statusClass, statusLabel } from "@/lib/utils";

export type PlatformShop = {
  id: string;
  slug: string;
  name: string;
  phone: string | null;
  line_id: string | null;
  facebook_url: string | null;
  subscription_status: "trial" | "active" | "suspended" | "cancelled";
  billing_plan: string | null;
  billing_due_date: string | null;
  expires_at: string | null;
  billing_note: string | null;
  created_at: string;
};

type ShopDraft = {
  subscription_status: PlatformShop["subscription_status"];
  billing_plan: string;
  billing_due_date: string;
  expires_at: string;
  billing_note: string;
};

type Props = {
  shops: PlatformShop[];
  initialBookings: Booking[];
  services: ServiceItem[];
  activityLogs: PlatformActivityLog[];
  billingEvents: ShopBillingEvent[];
  actorEmail: string;
  actorUserId: string;
};

const statusOptions: Array<{ value: BookingStatus | "all"; label: string }> = [
  { value: "all", label: "ทุกสถานะ" },
  { value: "confirmed", label: "ยืนยันแล้ว" },
  { value: "in_progress", label: "กำลังทำ" },
  { value: "completed", label: "เสร็จแล้ว" },
  { value: "cancelled", label: "ยกเลิก" },
  { value: "no_show", label: "ไม่มาตามนัด" }
];

function buildDraftFromShop(shop: PlatformShop): ShopDraft {
  return {
    subscription_status: shop.subscription_status,
    billing_plan: shop.billing_plan ?? "",
    billing_due_date: shop.billing_due_date ?? "",
    expires_at: shop.expires_at ?? "",
    billing_note: shop.billing_note ?? ""
  };
}

export function PlatformAdminConsole({ shops, initialBookings, services, activityLogs, billingEvents, actorEmail, actorUserId }: Props) {
  const supabase = useMemo(() => createBrowserClient(), []);
  const [selectedShopId, setSelectedShopId] = useState<string>("all");
  const [shopQuery, setShopQuery] = useState("");
  const [bookingQuery, setBookingQuery] = useState("");
  const [date, setDate] = useState("");
  const [status, setStatus] = useState<BookingStatus | "all">("all");
  const [bookings, setBookings] = useState(initialBookings);
  const [shopRows, setShopRows] = useState(shops);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [savingShopId, setSavingShopId] = useState<string | null>(null);
  const [deletingShopId, setDeletingShopId] = useState<string | null>(null);
  const [activityRows, setActivityRows] = useState(activityLogs);
  const [billingRows, setBillingRows] = useState(billingEvents);
  const [shopDrafts, setShopDrafts] = useState<Record<string, ShopDraft>>(
    Object.fromEntries(shops.map((shop) => [shop.id, buildDraftFromShop(shop)])) as Record<string, ShopDraft>
  );

  const shopById = useMemo(() => new Map(shopRows.map((shop) => [shop.id, shop])), [shopRows]);
  const bookingCountByShop = useMemo(() => {
    const counts = new Map<string, number>();
    for (const booking of bookings) {
      counts.set(booking.shop_id, (counts.get(booking.shop_id) ?? 0) + 1);
    }
    return counts;
  }, [bookings]);

  const filteredShops = shopRows.filter((shop) => {
    const haystack = [shop.name, shop.slug, shop.id, shop.phone ?? "", shop.line_id ?? "", shop.billing_plan ?? ""].join(" ").toLowerCase();
    return haystack.includes(shopQuery.toLowerCase());
  });

  const selectedShop = selectedShopId === "all" ? null : shopById.get(selectedShopId) ?? null;
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Bangkok" });
  const dueSoonThreshold = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString("en-CA", { timeZone: "Asia/Bangkok" });
  const dueSoonShops = shopRows.filter((shop) => Boolean(shop.billing_due_date && shop.billing_due_date >= today && shop.billing_due_date <= dueSoonThreshold)).length;
  const expiredShops = shopRows.filter((shop) => Boolean(shop.expires_at && shop.expires_at < today)).length;

  async function recordActivity(entry: Omit<PlatformActivityLog, "id" | "created_at" | "actor_user_id" | "actor_email">) {
    const { data, error } = await supabase
      .schema("bike_booking")
      .from("platform_activity_logs")
      .insert({
        actor_user_id: actorUserId,
        actor_email: actorEmail,
        action: entry.action,
        target_shop_id: entry.target_shop_id,
        target_shop_slug: entry.target_shop_slug,
        target_shop_name: entry.target_shop_name,
        before_status: entry.before_status,
        after_status: entry.after_status,
        note: entry.note
      })
      .select("*")
      .single<PlatformActivityLog>();

    if (error || !data) {
      return false;
    }

    setActivityRows((items) => [data, ...items].slice(0, 20));
    return true;
  }

  async function recordBillingEvent(entry: Omit<ShopBillingEvent, "id" | "created_at" | "actor_user_id" | "actor_email">) {
    const { data, error } = await supabase
      .schema("bike_booking")
      .from("shop_billing_events")
      .insert({
        actor_user_id: actorUserId,
        actor_email: actorEmail,
        shop_id: entry.shop_id,
        event_type: entry.event_type,
        billing_plan: entry.billing_plan,
        billing_due_date: entry.billing_due_date,
        expires_at: entry.expires_at,
        note: entry.note
      })
      .select("*")
      .single<ShopBillingEvent>();

    if (error || !data) {
      return false;
    }

    setBillingRows((items) => [data, ...items].slice(0, 20));
    return true;
  }

  async function persistShop(
    shopId: string,
    patch: Partial<ShopDraft> = {},
    billingEventType: ShopBillingEvent["event_type"] = "manual_update"
  ) {
    const shop = shopById.get(shopId);
    if (!shop) {
      toast.error("ไม่พบร้านที่เลือก");
      return;
    }

    const current = shopDrafts[shopId] ?? buildDraftFromShop(shop);
    const nextDraft: ShopDraft = { ...current, ...patch };

    setSavingShopId(shopId);
    const { error } = await supabase
      .schema("bike_booking")
      .from("shops")
      .update({
        subscription_status: nextDraft.subscription_status,
        billing_plan: nextDraft.billing_plan.trim() || null,
        billing_due_date: nextDraft.billing_due_date || null,
        expires_at: nextDraft.expires_at || null,
        billing_note: nextDraft.billing_note.trim() || null
      })
      .eq("id", shopId);
    setSavingShopId(null);

    if (error) {
      toast.error(error.message);
      return;
    }

    const activityNoteParts: string[] = [];
    if (shop.subscription_status !== nextDraft.subscription_status) {
      activityNoteParts.push(`สถานะ ${shop.subscription_status} → ${nextDraft.subscription_status}`);
    }
    if ((shop.billing_plan ?? "") !== nextDraft.billing_plan.trim()) {
      activityNoteParts.push(`แผน ${shop.billing_plan ?? "-"} → ${nextDraft.billing_plan.trim() || "-"}`);
    }
    if ((shop.billing_due_date ?? "") !== (nextDraft.billing_due_date || "")) {
      activityNoteParts.push(`ครบจ่าย ${shop.billing_due_date ?? "-"} → ${nextDraft.billing_due_date || "-"}`);
    }
    if ((shop.expires_at ?? "") !== (nextDraft.expires_at || "")) {
      activityNoteParts.push(`หมดอายุ ${shop.expires_at ?? "-"} → ${nextDraft.expires_at || "-"}`);
    }
    if ((shop.billing_note ?? "") !== nextDraft.billing_note.trim()) {
      activityNoteParts.push("แก้หมายเหตุบิล");
    }

    if (activityNoteParts.length > 0) {
      void recordActivity({
        action: shop.subscription_status !== nextDraft.subscription_status ? "status_change" : "billing_update",
        target_shop_id: shop.id,
        target_shop_slug: shop.slug,
        target_shop_name: shop.name,
        before_status: shop.subscription_status,
        after_status: nextDraft.subscription_status,
        note: activityNoteParts.join(" · ")
      });
    }

    const billingNoteParts = [
      nextDraft.billing_plan.trim() ? `แผน ${nextDraft.billing_plan.trim()}` : null,
      nextDraft.billing_due_date ? `ครบจ่าย ${nextDraft.billing_due_date}` : null,
      nextDraft.expires_at ? `หมดอายุ ${nextDraft.expires_at}` : null,
      nextDraft.billing_note.trim() || null
    ].filter((part): part is string => Boolean(part));

    if (
      shop.subscription_status !== nextDraft.subscription_status ||
      (shop.billing_plan ?? "") !== nextDraft.billing_plan.trim() ||
      (shop.billing_due_date ?? "") !== (nextDraft.billing_due_date || "") ||
      (shop.expires_at ?? "") !== (nextDraft.expires_at || "") ||
      (shop.billing_note ?? "") !== nextDraft.billing_note.trim()
    ) {
      void recordBillingEvent({
        shop_id: shop.id,
        event_type: billingEventType,
        billing_plan: nextDraft.billing_plan.trim() || null,
        billing_due_date: nextDraft.billing_due_date || null,
        expires_at: nextDraft.expires_at || null,
        note: billingNoteParts.join(" · ") || null
      });
    }

    setShopRows((items) => items.map((item) => (item.id === shopId ? { ...item, ...nextDraft, billing_plan: nextDraft.billing_plan.trim() || null, billing_due_date: nextDraft.billing_due_date || null, expires_at: nextDraft.expires_at || null, billing_note: nextDraft.billing_note.trim() || null } : item)));
    setShopDrafts((items) => ({ ...items, [shopId]: nextDraft }));
    toast.success("บันทึกข้อมูลร้านแล้ว");
  }

  async function deleteShop(shop: PlatformShop) {
    const ok = window.confirm(`ลบร้าน ${shop.name} ใช่ไหม? การลบจะลบข้อมูล booking/service/customer ที่เกี่ยวข้องด้วย`);
    if (!ok) return;

    setDeletingShopId(shop.id);
    const { error } = await supabase.schema("bike_booking").from("shops").delete().eq("id", shop.id);
    setDeletingShopId(null);

    if (error) {
      toast.error(error.message);
      return;
    }

    void recordActivity({
      action: "shop_deleted",
      target_shop_id: null,
      target_shop_slug: shop.slug,
      target_shop_name: shop.name,
      before_status: shop.subscription_status,
      after_status: null,
      note: "ลบร้านออกจาก control center"
    });

    setShopRows((items) => items.filter((item) => item.id !== shop.id));
    setBookings((items) => items.filter((item) => item.shop_id !== shop.id));
    setBillingRows((items) => items.filter((item) => item.shop_id !== shop.id));
    setShopDrafts((items) => {
      const next = { ...items };
      delete next[shop.id];
      return next;
    });
    if (selectedShopId === shop.id) {
      setSelectedShopId("all");
    }
    toast.success(`ลบร้าน ${shop.name} แล้ว`);
  }

  const visibleBookings = bookings.filter((booking) => {
    const shop = shopById.get(booking.shop_id);
    const servicesText = serviceNames(booking.service_items, services).join(" ");
    const matchesShop = selectedShopId === "all" || booking.shop_id === selectedShopId;
    const matchesDate = !date || booking.booking_date === date || (booking.booking_end_date && booking.booking_date <= date && booking.booking_end_date >= date);
    const matchesStatus = status === "all" || booking.status === status;
    const haystack = [
      shop?.name ?? "",
      shop?.slug ?? "",
      booking.id,
      booking.customer_name,
      booking.customer_phone,
      booking.customer_fb ?? "",
      booking.customer_line_id ?? "",
      booking.bike_model,
      servicesText,
      booking.additional_notes ?? ""
    ].join(" ").toLowerCase();

    return matchesShop && matchesDate && matchesStatus && haystack.includes(bookingQuery.toLowerCase());
  });

  const selectedDraft = selectedShop ? shopDrafts[selectedShop.id] ?? buildDraftFromShop(selectedShop) : null;
  const selectedBillingHealth = selectedShop ? getShopBillingHealth(selectedShop, today) : null;
  const visibleBillingRows = selectedShop ? billingRows.filter((entry) => entry.shop_id === selectedShop.id) : billingRows;

  async function extendBilling(days: number) {
    if (!selectedShop || !selectedDraft) return;
    const dueDate = getBangkokISODateOffset(days);
    const nextBillingNote = [selectedDraft.billing_note.trim(), `ต่ออายุ ${days} วัน ถึง ${dueDate}`].filter(Boolean).join(" · ");
    await persistShop(selectedShop.id, {
      subscription_status: "active",
      billing_due_date: dueDate,
      expires_at: dueDate,
      billing_note: nextBillingNote
    }, "renewal");
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[360px_1fr]">
      <aside className="flex flex-col gap-4">
        <Card>
          <CardHeader>
            <CardTitle>เลือกร้าน</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="ค้นหาชื่อร้าน / slug / uuid / แพ็กเกจ"
                value={shopQuery}
                onChange={(event) => setShopQuery(event.target.value)}
              />
            </div>
            <Button
              type="button"
              variant={selectedShopId === "all" ? "default" : "outline"}
              className="justify-between"
              onClick={() => setSelectedShopId("all")}
            >
              <span>ทุกร้าน</span>
              <span>{bookings.length}</span>
            </Button>
            <div className="max-h-[520px] overflow-auto rounded-md border">
              {filteredShops.map((shop) => {
                const active = selectedShopId === shop.id;
                const billingHealth = getShopBillingHealth(shop, today);
                return (
                  <button
                    key={shop.id}
                    type="button"
                    className={`flex w-full flex-col gap-1 border-b px-3 py-3 text-left last:border-b-0 hover:bg-muted ${active ? "bg-primary/10" : ""}`}
                    onClick={() => setSelectedShopId(shop.id)}
                  >
                    <span className="flex items-center justify-between gap-2">
                      <span className="font-medium">{shop.name}</span>
                      <Badge className="bg-muted text-muted-foreground">{bookingCountByShop.get(shop.id) ?? 0}</Badge>
                    </span>
                    <span className="text-xs text-muted-foreground">{shop.slug}</span>
                    <span className="break-all text-[11px] text-muted-foreground">{shop.id}</span>
                    <span className="text-[11px] text-muted-foreground">
                      {shop.subscription_status} · {billingHealth.label}
                      {shop.billing_due_date ? ` · ครบจ่าย ${formatThaiDate(shop.billing_due_date)}` : ""}
                      {shop.expires_at ? ` · หมดอายุ ${formatThaiDate(shop.expires_at)}` : ""}
                    </span>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </aside>

      <section className="flex min-w-0 flex-col gap-4">
        <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
          <Stat title="ร้านทั้งหมด" value={shopRows.length} icon={Store} />
          <Stat title="ร้าน active" value={shopRows.filter((shop) => shop.subscription_status === "active").length} icon={Shield} />
          <Stat title="ร้าน suspended" value={shopRows.filter((shop) => shop.subscription_status === "suspended").length} icon={AlertTriangle} />
          <Stat title="ครบจ่ายใน 7 วัน" value={dueSoonShops} icon={Clock3} />
          <Stat title="หมดอายุแล้ว" value={expiredShops} icon={AlertTriangle} />
          <Stat title="การจองทั้งหมด" value={bookings.length} icon={Store} />
        </section>

        <Card>
          <CardHeader>
            <CardTitle className="flex flex-wrap items-center gap-2">
              <Store className="size-5 text-muted-foreground" />
              {selectedShop ? selectedShop.name : "ทุกร้าน"}
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm md:grid-cols-2 xl:grid-cols-4">
            <Info label="Slug" value={selectedShop?.slug ?? "-"} />
            <Info label="Shop UUID" value={selectedShop?.id ?? "-"} copy />
            <Info label="โทร" value={selectedShop?.phone ?? "-"} />
            <Info label="LINE" value={selectedShop?.line_id ?? "-"} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>กิจกรรมล่าสุด</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {activityRows.length === 0 ? (
              <p className="text-sm text-muted-foreground">ยังไม่มี log ของ control center</p>
            ) : (
              activityRows.slice(0, 10).map((entry) => (
                <div key={entry.id} className="rounded-md border bg-muted/30 p-3 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className="bg-muted text-muted-foreground">{platformActivityLabel(entry.action)}</Badge>
                      <span className="font-medium">{entry.target_shop_name}</span>
                      <span className="text-muted-foreground">({entry.target_shop_slug})</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{formatThaiDateTime(entry.created_at)}</span>
                  </div>
                  <p className="mt-2 text-muted-foreground">{entry.note || "-"}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    โดย {entry.actor_email}
                    {entry.before_status || entry.after_status ? ` · ${entry.before_status ?? "-"} → ${entry.after_status ?? "-"}` : ""}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>ประวัติบิลล่าสุด</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {visibleBillingRows.length === 0 ? (
              <p className="text-sm text-muted-foreground">ยังไม่มีประวัติบิล</p>
            ) : (
              visibleBillingRows.slice(0, 10).map((entry) => (
                <div key={entry.id} className="rounded-md border bg-muted/30 p-3 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className="bg-muted text-muted-foreground">{billingEventLabel(entry.event_type)}</Badge>
                      <span className="font-medium">{shopById.get(entry.shop_id)?.name ?? entry.shop_id}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{formatThaiDateTime(entry.created_at)}</span>
                  </div>
                  <p className="mt-2 text-muted-foreground">
                    {entry.billing_plan ? `แผน ${entry.billing_plan}` : "ไม่มีแผน"}{" "}
                    {entry.billing_due_date ? `· ครบจ่าย ${formatThaiDate(entry.billing_due_date)}` : ""}{" "}
                    {entry.expires_at ? `· หมดอายุ ${formatThaiDate(entry.expires_at)}` : ""}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    โดย {entry.actor_email}
                    {entry.note ? ` · ${entry.note}` : ""}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {selectedShop && selectedDraft ? (
          <Card>
            <CardHeader>
              <CardTitle>จัดการร้านที่เลือก</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-md border bg-muted/40 p-3">
                  <p className="text-xs uppercase text-muted-foreground">สถานะปัจจุบัน</p>
                  <p className="mt-1 font-medium capitalize">{selectedShop.subscription_status}</p>
                </div>
                <div className="rounded-md border bg-muted/40 p-3">
                  <p className="text-xs uppercase text-muted-foreground">สถานะบิล</p>
                  <p className="mt-1 font-medium">{selectedBillingHealth?.label ?? "-"}</p>
                </div>
                <div className="rounded-md border bg-muted/40 p-3">
                  <p className="text-xs uppercase text-muted-foreground">แพ็กเกจบิล</p>
                  <p className="mt-1 font-medium">{selectedDraft.billing_plan.trim() || "-"}</p>
                </div>
                <div className="rounded-md border bg-muted/40 p-3">
                  <p className="text-xs uppercase text-muted-foreground">ครบจ่าย</p>
                  <p className="mt-1 font-medium">{selectedDraft.billing_due_date ? formatThaiDate(selectedDraft.billing_due_date) : "-"}</p>
                </div>
                <div className="rounded-md border bg-muted/40 p-3">
                  <p className="text-xs uppercase text-muted-foreground">หมดอายุ</p>
                  <p className="mt-1 font-medium">{selectedDraft.expires_at ? formatThaiDate(selectedDraft.expires_at) : "-"}</p>
                </div>
              </div>

              <div className="grid gap-3 lg:grid-cols-2">
                <label className="flex flex-col gap-2 text-sm">
                  <span className="font-medium">สถานะร้าน</span>
                  <select
                    className="min-h-10 rounded-md border border-border bg-background px-3 text-sm outline-none"
                    value={selectedDraft.subscription_status}
                    onChange={(event) =>
                      setShopDrafts((items) => ({
                        ...items,
                        [selectedShop.id]: {
                          ...selectedDraft,
                          subscription_status: event.target.value as PlatformShop["subscription_status"]
                        }
                      }))
                    }
                  >
                    <option value="trial">trial</option>
                    <option value="active">active</option>
                    <option value="suspended">suspended</option>
                    <option value="cancelled">cancelled</option>
                  </select>
                </label>

                <label className="flex flex-col gap-2 text-sm">
                  <span className="font-medium">แพ็กเกจ / แผนบิล</span>
                  <Input
                    value={selectedDraft.billing_plan}
                    onChange={(event) =>
                      setShopDrafts((items) => ({
                        ...items,
                        [selectedShop.id]: { ...selectedDraft, billing_plan: event.target.value }
                      }))
                    }
                    placeholder="เช่น monthly / yearly / custom"
                  />
                </label>

                <label className="flex flex-col gap-2 text-sm">
                  <span className="font-medium">วันครบจ่าย</span>
                  <Input
                    type="date"
                    value={selectedDraft.billing_due_date}
                    onChange={(event) =>
                      setShopDrafts((items) => ({
                        ...items,
                        [selectedShop.id]: { ...selectedDraft, billing_due_date: event.target.value }
                      }))
                    }
                  />
                </label>

                <label className="flex flex-col gap-2 text-sm">
                  <span className="font-medium">วันหมดอายุ</span>
                  <Input
                    type="date"
                    value={selectedDraft.expires_at}
                    onChange={(event) =>
                      setShopDrafts((items) => ({
                        ...items,
                        [selectedShop.id]: { ...selectedDraft, expires_at: event.target.value }
                      }))
                    }
                  />
                </label>
              </div>

              <label className="flex flex-col gap-2 text-sm">
                <span className="font-medium">โน้ตบิล / หมายเหตุร้าน</span>
                <textarea
                  className="min-h-28 rounded-md border border-border bg-background px-3 py-2 text-sm outline-none"
                  value={selectedDraft.billing_note}
                  onChange={(event) =>
                    setShopDrafts((items) => ({
                      ...items,
                      [selectedShop.id]: { ...selectedDraft, billing_note: event.target.value }
                    }))
                  }
                  placeholder="จดสถานะชำระเงิน, หมายเหตุการต่ออายุ, หรือเรื่องที่ต้องตามต่อ"
                />
              </label>

              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  disabled={savingShopId === selectedShop.id}
                  onClick={() => void persistShop(selectedShop.id)}
                >
                  {savingShopId === selectedShop.id ? <Shield className="size-3.5 animate-pulse" /> : <Save className="size-3.5" />}
                  บันทึกข้อมูลร้าน
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={savingShopId === selectedShop.id}
                  onClick={() => void persistShop(selectedShop.id, { subscription_status: "active" })}
                >
                  เปิดใช้งาน
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={savingShopId === selectedShop.id}
                  onClick={() => void persistShop(selectedShop.id, { subscription_status: "suspended" })}
                >
                  พักร้าน
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={savingShopId === selectedShop.id}
                  onClick={() => void persistShop(selectedShop.id, { subscription_status: "trial" })}
                >
                  ตั้ง trial
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={savingShopId === selectedShop.id}
                  onClick={() => void extendBilling(7)}
                >
                  ต่อ 7 วัน
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={savingShopId === selectedShop.id}
                  onClick={() => void extendBilling(30)}
                >
                  ต่อ 30 วัน
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={savingShopId === selectedShop.id}
                  onClick={() => void extendBilling(365)}
                >
                  ต่อ 365 วัน
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  disabled={savingShopId === selectedShop.id || deletingShopId === selectedShop.id}
                  onClick={() => void deleteShop(selectedShop)}
                >
                  {deletingShopId === selectedShop.id ? <Shield className="size-3.5 animate-pulse" /> : <Trash2 className="size-3.5" />}
                  ลบร้าน
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle>รายการร้าน</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full min-w-[1080px] border-collapse text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="py-3 pr-4 font-medium">ชื่อร้าน</th>
                  <th className="py-3 pr-4 font-medium">Slug</th>
                  <th className="py-3 pr-4 font-medium">สถานะ</th>
                  <th className="py-3 pr-4 font-medium">แพ็กเกจ</th>
                  <th className="py-3 pr-4 font-medium">ครบจ่าย</th>
                  <th className="py-3 pr-4 font-medium">หมดอายุ</th>
                  <th className="py-3 pr-4 font-medium">คิวทั้งหมด</th>
                </tr>
              </thead>
              <tbody>
                {shopRows.map((shop) => (
                  <tr key={shop.id} className="border-b last:border-b-0">
                    <td className="py-4 pr-4 font-medium">{shop.name}</td>
                    <td className="py-4 pr-4 text-muted-foreground">{shop.slug}</td>
                    <td className="py-4 pr-4">
                      <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium capitalize">{shop.subscription_status}</span>
                    </td>
                    <td className="py-4 pr-4 text-muted-foreground">{shop.billing_plan ?? "-"}</td>
                    <td className="py-4 pr-4 text-muted-foreground">{shop.billing_due_date ? formatThaiDate(shop.billing_due_date) : "-"}</td>
                    <td className="py-4 pr-4 text-muted-foreground">{shop.expires_at ? formatThaiDate(shop.expires_at) : "-"}</td>
                    <td className="py-4 pr-4 text-muted-foreground">{bookingCountByShop.get(shop.id) ?? 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>รายการจองที่จัดการได้</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="grid gap-3 lg:grid-cols-[1fr_180px_180px]">
              <Input
                placeholder="ค้นหาลูกค้า / เบอร์ / รถ / บริการ / รหัส booking"
                value={bookingQuery}
                onChange={(event) => setBookingQuery(event.target.value)}
              />
              <Input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
              <select
                className="min-h-10 rounded-md border border-border bg-muted px-3 text-sm text-foreground outline-none"
                value={status}
                onChange={(event) => setStatus(event.target.value as BookingStatus | "all")}
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="overflow-x-auto rounded-lg border bg-card">
              <table className="w-full min-w-[1100px] text-left text-sm">
                <thead className="bg-muted text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="p-3">ร้าน</th>
                    <th className="p-3">วัน/เวลา</th>
                    <th className="p-3">ลูกค้า</th>
                    <th className="p-3">รถ</th>
                    <th className="p-3">บริการ</th>
                    <th className="p-3">สถานะ</th>
                    <th className="p-3">จัดการ</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleBookings.map((booking) => {
                    const shop = shopById.get(booking.shop_id);
                    return (
                      <tr key={booking.id} className="border-t hover:bg-muted/60">
                        <td className="p-3">
                          <p className="font-medium">{shop?.name ?? booking.shop_id}</p>
                          <p className="text-xs text-muted-foreground">{shop?.slug ?? booking.shop_id}</p>
                        </td>
                        <td className="p-3">
                          <p>{formatBookingSchedule(booking)}</p>
                          <p className="text-xs text-muted-foreground">{bookingViewKindLabel(booking.booking_kind)}</p>
                        </td>
                        <td className="p-3">
                          <p className="font-medium">{booking.customer_name}</p>
                          <p className="text-muted-foreground">{booking.customer_phone}</p>
                          <p className="text-xs text-muted-foreground">{booking.customer_line_id || booking.customer_fb || ""}</p>
                        </td>
                        <td className="p-3">
                          {booking.bike_model} {booking.bike_year ?? ""}
                        </td>
                        <td className="p-3">{serviceNames(booking.service_items, services).join(", ") || `${booking.service_items.length} รายการ`}</td>
                        <td className="p-3">
                          <Badge className={statusClass(booking.status)}>{statusLabel(booking.status)}</Badge>
                        </td>
                        <td className="p-3">
                          <Button type="button" size="sm" variant="outline" onClick={() => setSelectedBooking(booking)}>
                            <Trash2 className="size-3.5" />
                            เปิดจัดการ
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                  {visibleBookings.length === 0 ? (
                    <tr>
                      <td className="p-6 text-center text-muted-foreground" colSpan={7}>
                        ไม่พบรายการจอง
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </section>

      <BookingDetailDialog
        booking={selectedBooking}
        services={services}
        open={Boolean(selectedBooking)}
        onOpenChange={(open) => {
          if (!open) setSelectedBooking(null);
        }}
        onUpdated={(updated) => {
          setBookings((items) => items.map((item) => (item.id === updated.id ? updated : item)));
          setSelectedBooking(updated);
        }}
        onDeleted={(deletedId) => {
          setBookings((items) => items.filter((item) => item.id !== deletedId));
          setSelectedBooking(null);
        }}
      />
    </div>
  );
}

function Stat({ title, value, icon: Icon }: { title: string; value: number; icon: typeof Store }) {
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

function Info({ label, value, copy = false }: { label: string; value: string; copy?: boolean }) {
  return (
    <div className="rounded-md border bg-muted/40 p-3">
      <p className="text-xs uppercase text-muted-foreground">{label}</p>
      <p className="mt-1 break-all font-medium">{value}</p>
      {copy && value !== "-" ? (
        <button
          type="button"
          className="mt-2 text-xs font-medium text-primary"
          onClick={() => navigator.clipboard.writeText(value)}
        >
          คัดลอก
        </button>
      ) : null}
    </div>
  );
}
