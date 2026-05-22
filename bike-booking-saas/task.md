# Tasks — Bike Booking SaaS

รายการงานพัฒนาตามแผนงาน (Project Development Plan) งบประมาณ 0 บาท

---

## 📌 ขั้นตอนที่ 1: ตรวจสอบและทดสอบระบบเข้าสู่ระบบควบคุม (Control Login Verification)
- `[x]` ตรวจสอบไฟล์ Middleware (`apps/booking-admin/middleware.ts`) ในการแยกแยะโดเมนและป้องกัน `control.craftbikelab.com`
- `[x]` วิเคราะห์โค้ด Login Form และระบบจัดกลุ่มสิทธิ์ (`apps/booking-admin/app/login/page.tsx`, `components/auth/PortalLoginForm.tsx`)
- `[x]` ตรวจสอบการ Route ไปยังหน้า `/platform` และข้อกำหนดด้าน Security ในระดับหน้าบ้าน/หลังบ้าน
- `[x]` จัดทำรายงานสรุปผลพร้อมข้อเสนอแนะสำหรับการดำเนินการขั้นถัดไปให้ผู้ใช้พิจารณา

---

## 📌 ขั้นตอนที่ 2: ปรับปรุงระบบ Subdomain Routing ให้แข็งแกร่ง (Hardening Hostname Routing)
- `[x]` ออกแบบและปรับปรุงระบบ Hostname Tenant Resolution ในทั้งฝั่ง Consumer และ Admin
- `[x]` เปลี่ยนผ่านการตั้งค่า `NEXT_PUBLIC_SHOP_ID` เป็นระบบ dynamic resolving เต็มตัว

---

## 📌 ขั้นตอนที่ 3: ระบบการลงทะเบียนร้านค้าใหม่แบบขั้นตอนเดียว (One-Click Tenant Onboarding)
- `[x]` พัฒนาหน้าจอสมัครสมาชิกสำหรับแอดมินหรือระบบออโต้โพรวิชันนิ่ง
- `[x]` เขียน Supabase Store Procedure สำหรับสร้างร้านค้าพร้อมข้อมูลเริ่มต้นในคลิกเดียว

---

## 📌 ขั้นตอนที่ 4: Build Verification & Smoke Testing
- `[x]` รันการ Build ทั้ง Monorepo และแก้ไข Type Error/Lint Error
- `[x]` อัปเดตเอกสาร Handoff และประวัติใน `work_log.md`
