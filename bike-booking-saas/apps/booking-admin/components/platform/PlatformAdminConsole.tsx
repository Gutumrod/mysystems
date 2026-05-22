"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Store, Trash2, Plus } from "lucide-react";
import { BookingDetailDialog } from "@/components/bookings/BookingDetailDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog } from "@/components/ui/dialog";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { createBrowserClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import type { Booking, BookingStatus, ServiceItem } from "@/lib/types";
import { bookingViewKindLabel, formatBookingSchedule, serviceNames, statusClass, statusLabel } from "@/lib/utils";

export type PlatformShop = {
  id: string;
  slug: string;
  name: string;
  phone: string | null;
  line_id: string | null;
  facebook_url: string | null;
  subscription_status: "trial" | "active" | "suspended" | "cancelled";
  created_at: string;
};

type Props = {
  shops: PlatformShop[];
  initialBookings: Booking[];
  services: ServiceItem[];
};

const statusOptions: Array<{ value: BookingStatus | "all"; label: string }> = [
  { value: "all", label: "ทุกสถานะ" },
  { value: "confirmed", label: "ยืนยันแล้ว" },
  { value: "in_progress", label: "กำลังทำ" },
  { value: "completed", label: "เสร็จแล้ว" },
  { value: "cancelled", label: "ยกเลิก" },
  { value: "no_show", label: "ไม่มาตามนัด" }
];

export function PlatformAdminConsole({ shops, initialBookings, services }: Props) {
  const router = useRouter();
  const [selectedShopId, setSelectedShopId] = useState<string>("all");
  const [shopQuery, setShopQuery] = useState("");
  const [bookingQuery, setBookingQuery] = useState("");
  const [date, setDate] = useState("");
  const [status, setStatus] = useState<BookingStatus | "all">("all");
  const [bookings, setBookings] = useState(initialBookings);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  // Onboarding modal states
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [newShopSlug, setNewShopSlug] = useState("");
  const [newShopName, setNewShopName] = useState("");
  const [newShopPhone, setNewShopPhone] = useState("");
  const [newShopOwnerId, setNewShopOwnerId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const shopById = useMemo(() => new Map(shops.map((shop) => [shop.id, shop])), [shops]);
  const bookingCountByShop = useMemo(() => {
    const counts = new Map<string, number>();
    for (const booking of bookings) {
      counts.set(booking.shop_id, (counts.get(booking.shop_id) ?? 0) + 1);
    }
    return counts;
  }, [bookings]);

  const filteredShops = shops.filter((shop) => {
    const haystack = [shop.name, shop.slug, shop.id, shop.phone ?? "", shop.line_id ?? ""].join(" ").toLowerCase();
    return haystack.includes(shopQuery.toLowerCase());
  });

  const selectedShop = selectedShopId === "all" ? null : shopById.get(selectedShopId) ?? null;
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

  const handleOnboardShop = async (e: React.FormEvent) => {
    e.preventDefault();

    const slugPattern = /^[a-z0-9-]+$/;
    const cleanSlug = newShopSlug.trim().toLowerCase();
    if (!slugPattern.test(cleanSlug)) {
      toast.error("Slug ต้องเป็นภาษาอังกฤษตัวพิมพ์เล็ก ตัวเลข และเครื่องหมายขีดกลาง (-) เท่านั้น (เช่น kmorackbarcustom)");
      return;
    }

    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const cleanOwnerId = newShopOwnerId.trim();
    if (!uuidPattern.test(cleanOwnerId)) {
      toast.error("รหัสผู้ดูแลร้าน (Owner User ID) ต้องอยู่ในรูปแบบ UUID ที่ถูกต้อง");
      return;
    }

    if (!newShopName.trim()) {
      toast.error("กรุณาระบุชื่อร้านค้า");
      return;
    }

    setIsSubmitting(true);
    try {
      const supabase = createBrowserClient();
      const { error } = await supabase.rpc("onboard_shop", {
        p_slug: cleanSlug,
        p_name: newShopName.trim(),
        p_phone: newShopPhone.trim() || null,
        p_owner_id: cleanOwnerId,
      });

      if (error) {
        throw new Error(error.message);
      }

      toast.success(`สร้างร้านค้า "${newShopName}" สำเร็จเรียบร้อยแล้ว!`);
      setIsOnboardingOpen(false);
      
      // Reset form
      setNewShopSlug("");
      setNewShopName("");
      setNewShopPhone("");
      setNewShopOwnerId("");
      
      // Refresh router to fetch updated shops list from server component
      router.refresh();
    } catch (err: unknown) {
      console.error("Onboarding failed:", err);
      const errMsg = err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการลงทะเบียนร้านค้าใหม่";
      toast.error(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid gap-5 xl:grid-cols-[360px_1fr]">
      <aside className="flex flex-col gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle>เลือกร้าน</CardTitle>
            <Button
              type="button"
              size="sm"
              className="gap-1 bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={() => setIsOnboardingOpen(true)}
            >
              <Plus className="size-4" />
              เพิ่มร้านค้าใหม่
            </Button>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="ค้นหาชื่อร้าน / slug / uuid"
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
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </aside>

      <section className="flex min-w-0 flex-col gap-4">
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
                  <option key={option.value} value={option.value}>{option.label}</option>
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
                        <td className="p-3">{booking.bike_model} {booking.bike_year ?? ""}</td>
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
                      <td className="p-6 text-center text-muted-foreground" colSpan={7}>ไม่พบรายการจอง</td>
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

      <Dialog
        title="เพิ่มร้านค้าใหม่ (One-Click Shop Onboarding)"
        open={isOnboardingOpen}
        onOpenChange={setIsOnboardingOpen}
      >
        <form onSubmit={handleOnboardShop} className="space-y-5">
          <div className="rounded-lg bg-primary/5 p-4 text-sm text-primary border border-primary/10">
            ระบบจะสร้างร้านค้าใหม่ พร้อมตั้งค่าบริการเริ่มต้นให้อัตโนมัติ:
            <ul className="list-disc list-inside mt-2 space-y-1 font-medium text-xs">
              <li>ตรวจเช็ครถ (1 ชั่วโมง)</li>
              <li>เปลี่ยนน้ำมันเครื่อง (1 ชั่วโมง)</li>
              <li>ติดตั้งของแต่ง (3 ชั่วโมง)</li>
            </ul>
          </div>

          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="shop-slug">ชื่อย่อโดเมนภาษาอังกฤษ (Slug)</FieldLabel>
              <Input
                id="shop-slug"
                placeholder="เช่น my-awesome-shop"
                value={newShopSlug}
                onChange={(e) => setNewShopSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                required
              />
              <span className="text-[11px] text-muted-foreground">
                รองรับเฉพาะภาษาอังกฤษตัวพิมพ์เล็ก, ตัวเลข และขีดกลาง (-) เท่านั้น
              </span>
              {newShopSlug && (
                <div className="mt-1 rounded-md bg-muted p-2 text-xs text-muted-foreground space-y-1">
                  <div>🔗 Local URL: <strong className="text-foreground">{newShopSlug}.localhost:3000</strong></div>
                  <div>🔗 Production URL: <strong className="text-foreground">{newShopSlug}.craftbikelab.com</strong></div>
                </div>
              )}
            </Field>

            <Field>
              <FieldLabel htmlFor="shop-name">ชื่อร้านค้า (Shop Name)</FieldLabel>
              <Input
                id="shop-name"
                placeholder="เช่น K-Morack Bar Custom"
                value={newShopName}
                onChange={(e) => setNewShopName(e.target.value)}
                required
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="shop-phone">เบอร์โทรศัพท์ติดต่อ (Phone)</FieldLabel>
              <Input
                id="shop-phone"
                placeholder="เช่น 081-234-5678"
                value={newShopPhone}
                onChange={(e) => setNewShopPhone(e.target.value)}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="shop-owner">รหัสผู้ดูแลร้าน (Owner User UUID)</FieldLabel>
              <Input
                id="shop-owner"
                placeholder="เช่น 123e4567-e89b-12d3-a456-426614174000"
                value={newShopOwnerId}
                onChange={(e) => setNewShopOwnerId(e.target.value)}
                required
              />
              <span className="text-[11px] text-muted-foreground">
                รหัส UUID ของบัญชีผู้ใช้งานจากระบบ Supabase Auth ที่จะมอบสิทธิ์ความเป็นเจ้าของร้านนี้
              </span>
            </Field>
          </FieldGroup>

          <div className="flex justify-end gap-3 border-t pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOnboardingOpen(false)}
              disabled={isSubmitting}
            >
              ยกเลิก
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isSubmitting ? "กำลังดำเนินการ..." : "สร้างร้านค้าทันที"}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
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
