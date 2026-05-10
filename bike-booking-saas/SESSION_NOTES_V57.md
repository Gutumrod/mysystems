# SESSION NOTES V57

## Path
- repo: `C:\Users\Win10\Documents\mysystems\bike-booking-saas`

## สรุปงาน
- เพิ่ม flow สมัครร้านแบบ manual approval เข้ากับ `control.craftbikelab.com`
- หน้า `/signup` ใช้ฟอร์มสมัครร้านที่กรอก
  - อีเมล
  - ชื่อร้าน
  - slug
  - พาสเวิร์ด
  - ยืนยันพาสเวิร์ด
  - เบอร์โทร (ไม่บังคับ)
  - หมายเหตุ (ไม่บังคับ)
- ฝั่งสมัครร้านจะสร้าง `signup_requests` และสร้าง/อัปเดต Supabase Auth user ตามอีเมล
- control center มีคิวคำขอสมัครร้าน:
  - ดูข้อมูลคำขอ
  - อนุมัติ
  - ปฏิเสธ
  - สร้างร้านจริงพร้อม service seed / owner mapping เมื่ออนุมัติ
- เพิ่มหน้า reset password:
  - `/forgot-password`
  - `/reset-password`
- ปรับปุ่มให้รองรับ `asChild` เพื่อใช้ Link ได้ถูก
- อัปเดต blueprint สมัครร้านให้เป็น manual approval ก่อน

## สิ่งที่ตรวจแล้ว
- `npm run lint` ผ่าน
- `npm run build` ผ่าน

## ไฟล์สำคัญที่แตะ
- `apps/booking-admin/app/api/signup/route.ts`
- `apps/booking-admin/app/forgot-password/page.tsx`
- `apps/booking-admin/app/reset-password/page.tsx`
- `apps/booking-admin/app/signup/page.tsx`
- `apps/booking-admin/app/platform/page.tsx`
- `apps/booking-admin/components/auth/PortalForgotPasswordForm.tsx`
- `apps/booking-admin/components/auth/PortalLoginForm.tsx`
- `apps/booking-admin/components/auth/PortalResetPasswordForm.tsx`
- `apps/booking-admin/components/auth/PortalSignupForm.tsx`
- `apps/booking-admin/components/platform/PlatformAdminConsole.tsx`
- `apps/booking-admin/components/ui/button.tsx`
- `apps/booking-admin/lib/signup.ts`
- `apps/booking-admin/lib/supabase/admin.ts`
- `docs/SELF_SERVICE_SIGNUP_BLUEPRINT.md`
- `supabase/migrations/20260510000009_signup_requests.sql`
- `supabase/migrations/initial.sql`

## สิ่งที่ต้องทำต่อ
- รัน migration `20260510000009_signup_requests.sql` ใน Supabase live project
- เทส flow จริง:
  - สมัครร้านผ่าน `control.craftbikelab.com/signup`
  - อนุมัติจาก `/platform`
  - ลอง forgot/reset password

## ข้อควรระวัง
- current signup route ถ้าเจอ auth email เดิม จะอัปเดต password ให้บัญชีเดิมด้วย
- manual approval ยังเป็นจุดหลักของ flow; ยังไม่ผูก payment gateway

## ลงชื่อ
- codex

## ส่งต่อให้ใคร
- codex บนเครื่องถัดไป / Mac
