# Implementation Gaps

เอกสารนี้บันทึกช่องว่างและข้อผิดพลาดที่พบในการ implement ระบบ เพื่อใช้เป็นแนวทางในการแก้ไขในภายหลัง

---

## Gap 1: Multi-tenant subdomain routing เคยไม่ได้ implement จริง

### Blueprint กำหนดไว้

แต่ละร้านได้ subdomain ของตัวเอง เช่น `bangkok-bike-care.craftbikelab.com` → ระบบอ่าน subdomain → หา shop จาก slug → แสดงข้อมูลร้านนั้น

### สถานะปัจจุบัน

แก้แล้วใน production path:

- `apps/booking-consumer/middleware.ts` อ่าน hostname แล้ว inject `x-shop-slug`
- `apps/booking-consumer/app/page.tsx` ใช้ slug หา `shops.slug` ก่อน และใช้ `NEXT_PUBLIC_SHOP_ID` เป็น fallback เฉพาะ local/base domain/preview
- `apps/booking-admin/middleware.ts` รองรับ `[shop-slug]-admin.craftbikelab.com` โดยตัด `-admin` ออกเป็น tenant slug
- `apps/booking-admin/lib/tenant.ts` resolve ร้านจาก `x-shop-slug` ก่อน fallback

ดังนั้น deployment กลาง 1 ชุดรองรับหลายร้านผ่าน subdomain ได้แล้ว เช่น `kmorackbarcustom.craftbikelab.com` และ `kmorackbarcustom-admin.craftbikelab.com`

### ไฟล์ที่เกี่ยวข้อง

- `apps/booking-consumer/middleware.ts`
- `apps/booking-consumer/app/page.tsx`
- `apps/booking-consumer/lib/utils.ts`
- `apps/booking-admin/middleware.ts`
- `apps/booking-admin/lib/tenant.ts`

### ข้อจำกัดที่ยังเหลือ

ระบบยังไม่มี self-service onboarding ร้านใหม่ ต้องสร้าง shop, owner, service เริ่มต้น และ domain/alias ด้วยมือหรือผ่าน platform admin/script ก่อน

---

## Gap 2: Audit ไม่ได้จับ gap นี้

การ audit ที่ทำใน session ก่อน (สแกน 34 pass / 12 fail / 22 warning) ไม่ได้ flag ว่า subdomain routing ขาดหาย เพราะ audit เน้นที่ error handling, validation, loading states — ไม่ได้ตรวจ business logic ของ multi-tenancy

---

## สถานะ

| รายการ | รายละเอียด |
|--------|-----------|
| พบเมื่อ | 1 พฤษภาคม 2569 |
| สถานะก่อน deploy | ✅ พบก่อน production (ยังทัน) |
| สถานะการแก้ไข | ✅ แก้แล้วสำหรับ production subdomain routing; เหลืองาน onboarding automation |
