import type { Booking, ServiceItem, Shop, ShopHoliday } from "./types";

export const demoShop: Shop = {
  id: "11111111-1111-1111-1111-111111111111",
  slug: "bangkok-bike-care",
  name: "Bangkok Bike Care",
  phone: "081-111-2222",
  line_id: "@bangkokbike",
  facebook_url: "https://facebook.com/bangkokbikecare",
  subscription_status: "active",
  regular_holidays: ["sun"],
  working_hours: {
    mon: { enabled: true, start: "09:00", end: "18:00", slot_capacity: 1, daily_limit: 0 },
    tue: { enabled: true, start: "09:00", end: "18:00", slot_capacity: 1, daily_limit: 0 },
    wed: { enabled: true, start: "09:00", end: "18:00", slot_capacity: 1, daily_limit: 0 },
    thu: { enabled: true, start: "09:00", end: "18:00", slot_capacity: 1, daily_limit: 0 },
    fri: { enabled: true, start: "09:00", end: "18:00", slot_capacity: 1, daily_limit: 0 },
    sat: { enabled: true, start: "09:00", end: "17:00", slot_capacity: 1, daily_limit: 0 },
    sun: { enabled: false, start: "09:00", end: "17:00", slot_capacity: 1, daily_limit: 0 }
  }
};

export const demoServices: ServiceItem[] = [
  {
    id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
    shop_id: demoShop.id,
    name: "เปลี่ยนน้ำมันเครื่อง",
    duration_unit: "hour",
    duration_value: 1,
    duration_hours: 1,
    is_active: true,
    sort_order: 1
  },
  {
    id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
    shop_id: demoShop.id,
    name: "เช็คระยะทั่วไป",
    duration_unit: "hour",
    duration_value: 2,
    duration_hours: 2,
    is_active: true,
    sort_order: 2
  },
  {
    id: "cccccccc-cccc-cccc-cccc-cccccccccccc",
    shop_id: demoShop.id,
    name: "ฝากรถค้าง",
    duration_unit: "day",
    duration_value: 1,
    duration_hours: 1,
    is_active: true,
    sort_order: 3
  }
];

export const demoHolidays: ShopHoliday[] = [];

export const demoBookings: Booking[] = [
  {
    id: "demo-booking",
    shop_id: demoShop.id,
    customer_name: "สมชาย ใจดี",
    customer_phone: "0812345678",
    customer_fb: null,
    customer_line_id: "@somchai",
    booking_date: new Date().toISOString().slice(0, 10),
    booking_end_date: null,
    booking_kind: "hourly",
    booking_time_start: "10:00",
    booking_time_end: "12:00",
    bike_model: "Honda Click 160",
    bike_year: 2023,
    service_items: [demoServices[1].id],
    additional_notes: "มีเสียงดังช่วงออกตัว",
    status: "confirmed",
    customer_showed_up: null,
    created_at: new Date().toISOString()
  }
];

export function hasSupabaseEnv() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}
