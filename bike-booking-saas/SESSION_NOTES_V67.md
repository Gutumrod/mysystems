# SESSION NOTES V67

## Path

- repo: `C:\Users\Win10\Documents\mysystems\bike-booking-saas`
- incoming review copy: `D:\AI-Workspace\projects-local\booking-saas-mac-review\bike-booking-saas`

## วันที่

- 2026-05-24

## เหตุการณ์หลัก

ผู้ใช้ copy ก้อน `bike-booking-saas` จาก Mac/Drive ลง local เพื่อให้ตรวจและเลือก merge เข้าระบบหลักก่อน commit/push

## Incoming review result

ก้อน incoming มี path:

- `D:\AI-Workspace\projects-local\booking-saas-mac-review\bike-booking-saas`

พบว่าเป็น repo แยก มี:

- `.git`
- `node_modules`
- `.next`
- `.vercel`

ขนาดประมาณ:

- 35,779 files
- 3,234 directories
- 1.47 GB

สถานะ incoming repo:

- commit: `36ca2d6 feat: initial commit with subdomain routing, onboarding system, and Thai manuals`
- มีงานค้างที่ยังไม่ commit:
  - `apps/booking-admin/components/auth/PortalLoginForm.tsx`
  - `apps/booking-admin/lib/tenant.ts`
  - `apps/booking-admin/middleware.ts`
  - `apps/booking-admin/app/register/page.tsx`
  - `apps/booking-admin/components/auth/RegisterForm.tsx`
  - `supabase/migrations/20260524000000_self_service_onboarding.sql`

## Incoming verification

ตอนแรก lint/build ใน incoming ล้ม เพราะ `node_modules` ที่ copy มาจาก Mac ใช้บน Windows ไม่ได้ (`eslint` / `next` not recognized)

แก้ด้วย:

- `npm ci`

หลังจากนั้นตรวจแล้ว:

- `npm run lint` ผ่าน
- `npm --workspace apps/booking-admin run build` ผ่าน
- `npm --workspace apps/booking-consumer run build` ผ่าน

## สิ่งที่ดีจาก incoming

- แนวคิดฟอร์มสมัครร้านดีขึ้น
- มีฟิลด์ที่ร้านจริงต้องกรอก:
  - email
  - password
  - confirm password
  - shop name
  - slug
  - phone
- มีตัวอย่าง slug และ production URL ให้ผู้ใช้เห็น
- UI idea เอามาใช้ปรับ signup form เดิมได้

## สิ่งที่ห้าม merge จาก incoming

ไม่เอาเข้าโปรเจกต์หลัก:

- `apps/booking-admin/app/register/page.tsx`
- `apps/booking-admin/components/auth/RegisterForm.tsx`
- `supabase/migrations/20260524000000_self_service_onboarding.sql`

เหตุผล:

- migration ใหม่สร้าง `self_onboard_shop()` ให้ authenticated user สร้างร้านได้ทันที
- ไม่ผ่าน platform approval
- ไม่ผ่าน billing/payment/manual review
- ใช้ `security definer` และ grant execute ให้ `authenticated`
- default services ใน migration ใส่แค่ `duration_hours` ไม่ครบ `duration_unit` / `duration_value`
- ถ้า signup สำเร็จแต่ RPC สร้างร้าน fail อาจเกิด auth user ค้าง
- ขัดกับ flow หลักที่ถูกกว่า คือ `/signup` -> `signup_requests` -> platform owner approve

## สิ่งที่ merge เข้าโปรเจกต์หลักแล้ว

แก้เฉพาะไฟล์:

- `apps/booking-admin/components/auth/PortalSignupForm.tsx`

การเปลี่ยนแปลง:

- เพิ่ม `Textarea` component แทน raw textarea
- ปรับ placeholder ของ email/shop/slug/phone ให้ชัดขึ้น
- เพิ่ม `autoComplete="organization"` ให้ชื่อร้าน
- เพิ่ม client-side password length guard 8 ตัวอักษร
- เพิ่ม `minLength={8}` ที่ password และ confirm password
- จัดลำดับฟอร์มให้ใกล้กับ requirement:
  - email
  - shop name
  - slug
  - password
  - confirm password
  - phone
  - note
- ปรับข้อความท้ายฟอร์มให้ชัดว่า:
  - ระบบส่งคำขอเข้า Control Center ก่อน
  - ยังไม่สร้างร้านทันที
  - platform owner ต้องตรวจและอนุมัติก่อน

## Verification ในโปรเจกต์หลัก

รันแล้วผ่าน:

- `npm --workspace apps/booking-admin run lint`
- `npm --workspace apps/booking-admin run build`

ไม่ได้รัน consumer build ในโปรเจกต์หลัก เพราะแก้เฉพาะ admin signup form

## สถานะที่ยังต้องระวัง

- local main ยัง behind `origin/main` 1 commit
- ห้าม `git pull origin/main` ตรงๆ เพราะ commit `ff4a4ab` ยังมี regression และต้อง merge-cleanup ก่อน
- ยังมี untracked Telegram/Supabase files เดิมที่ไม่ได้แตะ:
  - `supabase/config.toml`
  - `supabase/functions/`
  - `supabase/migrations/20260521000000_telegram_notifications.sql`
- ยังมี docs/session note changes จาก V66 ที่ยังไม่ได้ commit

## งานต่อไป

1. ตรวจ diff ทั้งหมดของโปรเจกต์หลักอีกครั้ง
2. ทำ merge-cleanup branch แยก ถ้าจะรวมของจาก `origin/main`
3. อย่าเอา self-service onboarding SQL เข้า live
4. หลัง review ครบ ค่อย commit/push จาก repo หลัก

## ลงชื่อ

- codex

