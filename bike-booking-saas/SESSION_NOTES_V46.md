# SESSION_NOTES_V46 - Hardening Routing & One-Click Onboarding

## path

- `/Users/wachirayachankhonkan/antigravity/bike-booking-saas`

## สรุปงาน

- **ขั้นตอนที่ 2: ปรับปรุงระบบ Subdomain Routing ให้แข็งแกร่ง (Hardening Hostname Routing) [SUCCESS]:**
  - เปลี่ยนผ่านการตรวจจับโฮสต์มาเป็นระบบ Dynamic Resolving เต็มตัวใน Middleware ทั้งฝั่ง `booking-consumer` และ `booking-admin`
  - รองรับการทำงานของพอร์ตจำลอง, โฮสต์จำลองเครื่องเครื่องตัวเอง (`[slug].localhost:3000`), โดเมนปกติ, และซับโดเมนจริงแบบคลาวด์ Vercel
  - แทรกค่า Shop Slug ผ่าน Header `x-shop-slug` ปลอดภัยจากปัญหาพอร์ตและพาร์ทการทำงานในทุกสภาวะแวดล้อม
- **ขั้นตอนที่ 3: ระบบการลงทะเบียนร้านค้าใหม่ในคลิกเดียว (One-Click Tenant Onboarding) [SUCCESS]:**
  - พัฒนา PostgreSQL Stored Procedure `bike_booking.onboard_shop` ใน Migration `20260522000000_one_click_onboarding.sql` ทำงานแบบ Transaction ปลอดภัยสูง สร้างร้านค้าใหม่ พร้อมโพรวิชันนิ่งบริการเริ่มต้น 3 รายการ ได้แก่ *ตรวจเช็ครถ (1 ชม.)*, *เปลี่ยนน้ำมันเครื่อง (1 ชม.)* และ *ติดตั้งของแต่ง (3 ชม.)* และผูกสิทธิ์ความเป็นเจ้าของให้บัญชีผู้ใช้งานทันที
  - พัฒนาฟอร์มสมัครสมาชิกร้านค้าใหม่บน **Platform Admin Console** (`PlatformAdminConsole.tsx`) มีกล่อง Dialog สวยงาม, Regex คัดกรองตัวอักษรของ Slug และ UUID ของบัญชีผู้ใช้, ระบบตรวจสอบ UI Loading และการรีเฟรชข้อมูลแบบ Dynamic Server Refresh (`router.refresh()`) ด้วย `sonner` แจ้งเตือนกระชับ
  - เพิ่มส่วนของ **Live URL Preview** จำลองที่อยู่เว็บจริงและเว็บ Local แบบเรียลไทม์ขณะที่พิมพ์ชื่อ Slug ป้องกันความสับสนของแอดมิน
- **ขั้นตอนที่ 4: จัดทำคู่มือและใบสรุปความคืบหน้า [SUCCESS]:**
  - เขียนคู่มือฉบับเต็มภาษาไทยสำหรับเจ้าของระบบใน `OWNERS_MANUAL.md` อธิบายแผน 0 บาท และสถาปัตยกรรมระบบ
  - ลงประวัติประเด็นการพัฒนาครบถ้วนใน `work_log.md`, `walkthrough.md` และเคลียร์แผนงานทั้งหมดใน `task.md`

## สิ่งที่เปลี่ยน

- `apps/booking-consumer/middleware.ts`
- `apps/booking-admin/middleware.ts`
- `apps/booking-admin/components/platform/PlatformAdminConsole.tsx`
- `supabase/migrations/20260522000000_one_click_onboarding.sql`
- `OWNERS_MANUAL.md` [NEW]
- `task.md`
- `work_log.md`
- `walkthrough.md`

## สิ่งที่ต้องทำต่อ

1.  **การ Deploy ฐานข้อมูลสู่ระบบจริง (Supabase Production):**
    - รันไฟล์ SQL Migration `20260522000000_one_click_onboarding.sql` บนแผงควบคุม SQL Editor ของ Supabase Project ของคุณเพื่อสร้าง Procedure รับงานลงทะเบียนร้านค้า
2.  **การทดสอบระบบสมัครหน้าร้านค้าจริง:**
    - ไปที่หน้าแผงควบคุมกลาง `https://control.craftbikelab.com/platform` ทำการทดลองกดปุ่ม "+ เพิ่มร้านค้าใหม่" เพื่อทดสอบการสมัครสมาชิกแบบครอบคลุม
3.  **การเชื่อมโยงระบบโดเมนจริง:**
    - เมื่อพร้อมทำการตลาด ให้ทำการตั้งค่า Wildcard Subdomain บน Vercel (`*.craftbikelab.com`) และชี้ DNS CNAME ไปที่ `cname.vercel-dns.com` เพื่อเปิดบริการรับแอดมินหลายร้าน

## ข้อควรระวัง

- **การประหยัดทรัพยากร Supabase DB (Free Size Limit 500 MB):** หมั่นตรวจเช็คปริมาณข้อมูล และล้างประวัติการจองเก่าๆ ที่สำเร็จการทำงานไปเกินกว่า 1 ปี เพื่อไม่ให้ขีดจำกัดหน่วยความจำคลาวด์ฟรีพุ่งเกินตัว
- **ป้องกันระบบหลับ (Database Inactivity Pausing):** Supabase ระดับ Free tier จะเข้าสู่โหมดหลับหากแอปไม่มีกิจกรรมการเชื่อมต่อ 7 วัน ป้องกันได้ง่ายๆ โดยการเข้าใช้งานแผงควบคุมของคุณสัปดาห์ละ 1 ครั้ง
- **ความถูกต้องของ UUID ผู้ดูแล:** เจ้าของร้านต้องลงทะเบียนบัญชีในระบบให้เรียบร้อยเพื่อรับรหัส UUID ก่อนที่ Platform Admin จะนำมากรอกเพื่อส่งมอบสิทธิ์ความเป็นเจ้าของในระบบบอร์ดดิ้ง

## ลงชื่อ

- Antigravity (Google DeepMind Team)

## ส่งต่อให้ใคร

- Claude / Gemini เครื่องถัดไป หรือแอดมินผู้ดูแลระบบที่จะเข้ามาทำงานสานต่อ โดยให้อ่าน `SESSION_NOTES_CURRENT.md` และ `OWNERS_MANUAL.md` ก่อนเริ่มรันระบบเสมอ
