import { z } from "zod";
import type { ServiceItem, WorkingHours } from "./types";
import { formatBangkokISODate, getBangkokISODateOffset } from "./utils";

export const signupRequestSchema = z
  .object({
    email: z.string().trim().email("กรอกอีเมลให้ถูกต้อง"),
    shopName: z.string().trim().min(2, "กรอกชื่อร้านอย่างน้อย 2 ตัวอักษร").max(120, "ชื่อร้านยาวเกินไป"),
    slug: z
      .string()
      .trim()
      .min(3, "slug ต้องมีอย่างน้อย 3 ตัวอักษร")
      .max(40, "slug ยาวเกินไป")
      .regex(/^[a-z0-9-]+$/, "slug ใช้ได้เฉพาะ a-z, 0-9 และขีดกลาง"),
    password: z.string().min(8, "รหัสผ่านต้องอย่างน้อย 8 ตัวอักษร").max(72, "รหัสผ่านยาวเกินไป"),
    confirmPassword: z.string().min(8, "ยืนยันรหัสผ่านให้ครบ").max(72, "ยืนยันรหัสผ่านยาวเกินไป"),
    phone: z
      .string()
      .trim()
      .max(32, "เบอร์ยาวเกินไป")
      .optional()
      .or(z.literal("")),
    note: z.string().trim().max(500, "หมายเหตุยาวเกินไป").optional().or(z.literal(""))
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: "รหัสผ่านไม่ตรงกัน",
    path: ["confirmPassword"]
  });

export type SignupRequestInput = z.infer<typeof signupRequestSchema>;

export function normalizeSignupSlug(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

export function getSignupPreviewUrls(slug: string) {
  const normalizedSlug = normalizeSignupSlug(slug);
  return {
    customer: normalizedSlug ? `https://${normalizedSlug}.craftbikelab.com` : "https://[shop-slug].craftbikelab.com",
    admin: normalizedSlug ? `https://${normalizedSlug}-admin.craftbikelab.com` : "https://[shop-slug]-admin.craftbikelab.com"
  };
}

export function buildDefaultWorkingHours(): WorkingHours {
  return {
    mon: { enabled: true, start: "09:00", end: "18:00", slot_capacity: 1, daily_limit: 0 },
    tue: { enabled: true, start: "09:00", end: "18:00", slot_capacity: 1, daily_limit: 0 },
    wed: { enabled: true, start: "09:00", end: "18:00", slot_capacity: 1, daily_limit: 0 },
    thu: { enabled: true, start: "09:00", end: "18:00", slot_capacity: 1, daily_limit: 0 },
    fri: { enabled: true, start: "09:00", end: "18:00", slot_capacity: 1, daily_limit: 0 },
    sat: { enabled: true, start: "09:00", end: "17:00", slot_capacity: 1, daily_limit: 0 },
    sun: { enabled: false, start: "09:00", end: "17:00", slot_capacity: 1, daily_limit: 0 }
  };
}

export function buildDefaultServiceSeeds(): Array<Pick<ServiceItem, "name" | "duration_unit" | "duration_value" | "duration_hours" | "is_active" | "sort_order">> {
  return [
    { name: "ตรวจเช็ครถ", duration_unit: "hour", duration_value: 1, duration_hours: 1, is_active: true, sort_order: 1 },
    { name: "เปลี่ยนน้ำมันเครื่อง", duration_unit: "hour", duration_value: 1, duration_hours: 1, is_active: true, sort_order: 2 },
    { name: "ติดตั้งของแต่ง", duration_unit: "hour", duration_value: 3, duration_hours: 3, is_active: true, sort_order: 3 },
    { name: "ฝากรถค้าง", duration_unit: "day", duration_value: 1, duration_hours: 1, is_active: true, sort_order: 4 }
  ];
}

export function buildTrialDates() {
  const today = formatBangkokISODate();
  const dueDate = getBangkokISODateOffset(7);
  return { today, dueDate };
}

