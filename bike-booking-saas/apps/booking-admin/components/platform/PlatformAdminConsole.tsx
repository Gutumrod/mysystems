"use client";

import { useMemo, useState } from "react";
import { Search, Store, Trash2 } from "lucide-react";
import { BookingDetailDialog } from "@/components/bookings/BookingDetailDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
  const preferredShop = shops.find((shop) => shop.slug === "kmorackbarcustom") ?? shops[0];
  const [selectedShopId, setSelectedShopId] = useState<string>(preferredShop?.id ?? "all");
  const [shopQuery, setShopQuery] = useState("");
  const [bookingQuery, setBookingQuery] = useState("");
  const [date, setDate] = useState("");
  const [status, setStatus] = useState<BookingStatus | "all">("all");
  const [bookings, setBookings] = useState(initialBookings);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

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
