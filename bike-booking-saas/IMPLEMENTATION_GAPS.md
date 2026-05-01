# Implementation Gaps

เอกสารนี้บันทึกช่องว่างและข้อผิดพลาดที่พบในการ implement ระบบ เพื่อใช้เป็นแนวทางในการแก้ไขในภายหลัง

---

## Gap 1: Multi-tenant subdomain routing ไม่ได้ implement จริง

### Blueprint กำหนดไว้

แต่ละร้านได้ subdomain ของตัวเอง เช่น `bangkok-bike-care.booking.craftbikelab.com` → ระบบอ่าน subdomain → หา shop จาก slug → แสดงข้อมูลร้านนั้น

### ที่ implement จริง

`getShopId()` ใน `apps/booking-consumer/lib/utils.ts` อ่านแค่ `process.env.NEXT_PUBLIC_SHOP_ID` (env var) — หมายความว่า deployment หนึ่งรองรับได้แค่ร้านเดียว ถ้าอยากเพิ่มร้านใหม่ต้อง deploy ใหม่และเปลี่ยน env var

### ไฟล์ที่เกี่ยวข้อง

- `apps/booking-consumer/lib/utils.ts` — `getShopId()` function
- `apps/booking-consumer/app/page.tsx` — เรียก `getShopId()` แล้ว query by UUID
- ไม่มี `apps/booking-consumer/middleware.ts` เลย

### ผลกระทบ

ระบบยังเป็น single-tenant จริงๆ ไม่ใช่ multi-tenant SaaS

### สิ่งที่ต้องแก้

1. สร้าง `middleware.ts` ใน `apps/booking-consumer/`
2. อ่าน hostname จาก request → extract subdomain slug
3. Pass slug ไปที่ page
4. เปลี่ยน `page.tsx` ให้ query shop by `slug` แทน `id`
5. ลบ `NEXT_PUBLIC_SHOP_ID` env var ออก (ไม่จำเป็นอีกต่อไป)

---

## Gap 2: Audit ไม่ได้จับ gap นี้

การ audit ที่ทำใน session ก่อน (สแกน 34 pass / 12 fail / 22 warning) ไม่ได้ flag ว่า subdomain routing ขาดหาย เพราะ audit เน้นที่ error handling, validation, loading states — ไม่ได้ตรวจ business logic ของ multi-tenancy

---

## สถานะ

| รายการ | รายละเอียด |
|--------|-----------|
| พบเมื่อ | 1 พฤษภาคม 2569 |
| สถานะก่อน deploy | ✅ พบก่อน production (ยังทัน) |
| สถานะการแก้ไข | ⏳ ยังไม่ได้แก้ (รอ session ถัดไป) |
