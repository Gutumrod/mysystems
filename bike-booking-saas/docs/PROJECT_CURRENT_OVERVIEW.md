# Project Current Overview

อัปเดตล่าสุด: 2026-07-04

โปรเจกต์: `bike-booking-saas`

ชื่อสินค้า: **CraftBike Booking SaaS**

ชื่อหน้าผู้คุมระบบ: **CraftBike Control Center**

เอกสารนี้คือภาพรวมปัจจุบันของโปรเจกต์ สำหรับเจ้าของโปรเจกต์, Codex, Claude หรือ agent ตัวอื่นที่ต้องเข้ามาอ่านเร็วๆ แล้วเข้าใจว่าระบบนี้คืออะไร อยู่ตรงไหน และตอนนี้ทำถึงไหนแล้ว

## สรุปสั้น

CraftBike Booking SaaS คือระบบจองคิวออนไลน์แบบ multi-tenant สำหรับร้านทำงานมอเตอร์ไซค์ เช่น ร้านทำแคชบาร์, แร็คท้าย, แร็คข้าง, ของแต่ง, งานติดตั้ง และงานซ่อมที่ต้องจัดคิวหลายวัน

ระบบแบ่งเป็น 3 ฝั่ง:

1. **Customer booking**: ลูกค้าของแต่ละร้านเข้ามาจองคิวเอง
2. **Shop admin**: แอดมินของร้านนั้นจัดการคิว/บริการ/เวลาทำการ
3. **Platform admin**: เจ้าของระบบใช้ CraftBike Control Center คุมทุกร้าน

สถานะปัจจุบัน:

- หน้า customer booking ของ KMO ใช้งานได้
- หน้า shop admin ของ KMO ใช้งานได้
- หน้า platform admin เปิด/login ได้ และดึงข้อมูลร้าน/คิว/บริการ/activity/billing ได้
- lint ผ่าน
- production build ผ่าน
- live DB ตอนนี้มีร้าน KMO RACK BAR CUSTOM เป็นร้าน active หลัก
- ยังมีงานค้างเรื่อง production signup route และ Telegram notification ที่ยังไม่ควรนับว่าเสร็จ production

## Repo และที่อยู่ไฟล์

### GitHub

- repo: `https://github.com/Gutumrod/mysystems.git`
- project folder ใน repo: `bike-booking-saas`
- branch ที่ Codex ตรวจล่าสุด: `review-signup-form-v67`
- commit ล่าสุดของ branch นี้ ณ ตอนตรวจ: `d191992 docs: prepare claude sales handoff`
- remote branch: `origin/review-signup-form-v67`
- `origin/main` ณ ตอนตรวจ: `ff4a4ab feat(bike-booking-saas): implement dynamic subdomain routing, onboarding UI/DB procedure, and Thai manuals`

### Local path บนเครื่องนี้

- repo root: `C:\Users\Win10\Documents\mysystems`
- project root: `C:\Users\Win10\Documents\mysystems\bike-booking-saas`
- customer app: `C:\Users\Win10\Documents\mysystems\bike-booking-saas\apps\booking-consumer`
- admin/control app: `C:\Users\Win10\Documents\mysystems\bike-booking-saas\apps\booking-admin`
- Supabase migrations: `C:\Users\Win10\Documents\mysystems\bike-booking-saas\supabase\migrations`
- shared docs: `C:\Users\Win10\Documents\mysystems\bike-booking-saas\docs`

### ข้อควรระวังเรื่อง branch

ตอนนี้ branch ที่ควรใช้เป็นฐานอ่านสถานะล่าสุดคือ:

```text
review-signup-form-v67
```

ยังไม่ควร `git pull origin main` หรือ merge `origin/main` ตรงๆ เพราะเคยตรวจแล้วว่า `origin/main` มีของดีบางส่วน แต่มี regression เสี่ยง เช่น ลบ session notes/migrations บางส่วน และลดความสามารถบางจุดของ platform/signup/daily booking

## ลิงก์สำคัญ

### Production / Live

Customer booking ของร้าน KMO:

- `https://kmorackbarcustom.craftbikelab.com/`
- ตรวจล่าสุด: เปิดได้ `200`

Shop admin ของร้าน KMO:

- `https://kmorackbarcustom-admin.craftbikelab.com/login`
- ตรวจล่าสุด: เปิดได้ `200`

Platform owner login:

- `https://control.craftbikelab.com/login`
- ตรวจล่าสุด: เปิดได้ `200`
- ใช้สำหรับเจ้าของระบบ / platform user

Platform signup:

- `https://control.craftbikelab.com/signup`
- ตรวจล่าสุด: ได้ `404`
- สถานะ: route นี้มีใน code ฝั่ง admin app แต่ production link ยังไม่พร้อมหรือยังไม่ได้ deploy/map ให้ตรง
- ต้องแก้/ยืนยัน deployment ก่อนเอาไปใช้ขายจริง

Platform admin:

- `https://control.craftbikelab.com/platform`
- ต้อง login ก่อน
- local เคยตรวจแล้วเปิดได้หลัง login
- production ต้องเทสด้วย session จริงอีกครั้งเมื่อจะ demo

### Local development

Customer app:

- `http://localhost:3000`
- command: `npm run dev:shop`

Admin / Control app:

- `http://localhost:3001/login`
- command: `npm run dev:admin`

Control mode แบบ local ต้องจำลอง host เป็น `control.craftbikelab.com` ถ้าจะทดสอบ copy/mode ของ control domain

## Domain model ที่ตกลงกัน

Customer:

```text
https://[shop-slug].craftbikelab.com/
```

ตัวอย่าง:

```text
https://kmorackbarcustom.craftbikelab.com/
```

Shop admin:

```text
https://[shop-slug]-admin.craftbikelab.com/
```

ตัวอย่าง:

```text
https://kmorackbarcustom-admin.craftbikelab.com/
```

Platform admin:

```text
https://control.craftbikelab.com/
```

กติกาสำคัญ:

- `control.craftbikelab.com` เป็นของเจ้าของระบบ ไม่ผูกกับร้านใดร้านหนึ่ง
- แต่ละร้านควรได้ 2 ลิงก์ คือ customer และ shop admin
- เจ้าของระบบต้องคุมร้านทั้งหมดผ่าน CraftBike Control Center

## Stack ปัจจุบัน

### Frontend / App

- Next.js App Router
- React
- TypeScript
- Tailwind CSS
- ESLint
- lucide-react สำหรับ icons
- sonner สำหรับ toast
- react-hook-form + zod สำหรับ form validation
- date-fns สำหรับวันที่

เวอร์ชันที่ติดตั้งจริง ณ ตอนตรวจ:

- `next@15.5.15`
- `react@19.2.5`
- `@supabase/supabase-js@2.105.1`
- `@supabase/ssr@0.6.1`

หมายเหตุ: `package.json` ยังใช้ range แบบ `^` หลายตัว แต่ `node_modules/package-lock` ตอนนี้ resolve เป็นเวอร์ชันข้างบน

### Backend / Database

- Supabase
- Supabase Auth
- Supabase Postgres
- Row Level Security
- RPC / Postgres functions เช่น `create_public_booking`
- trigger / function สำหรับกันคิวชน, ตรวจวันหยุด, ตรวจบริการ hourly/daily

Supabase project ref:

```text
gsbbkdppaegrttcqmjuq
```

### Hosting

- Vercel
- มีอย่างน้อย admin project ที่เคยเห็นใน dashboard ชื่อ `craftbikelab-booking-admin`
- live domains ที่ใช้อยู่จริงดูที่หัวข้อ "ลิงก์สำคัญ"

## โครงสร้างแอป

### `apps/booking-consumer`

หน้าลูกค้าจองคิว

ไฟล์สำคัญ:

- `app/page.tsx`: หน้าแรกสำหรับลูกค้าจอง
- `app/success/page.tsx`: หน้ายืนยันหลังจองสำเร็จ
- `components/booking/BookingForm.tsx`: form จองหลัก
- `components/booking/DateTimePicker.tsx`: เลือกวัน/เวลา/วันสิ้นสุด
- `lib/utils.ts`: logic วันหยุด, slot, date formatting
- `lib/validations.ts`: zod schema ของ booking form
- `middleware.ts`: อ่าน subdomain เพื่อหา shop slug

ฟีเจอร์ที่มี:

- เลือกรายการบริการ
- จองรายชั่วโมง
- จองรายวัน
- จองหลายวัน
- แสดงวันหยุดประจำร้านและวันหยุดเพิ่มเติม
- ป้องกันเลือกบริการรายชั่วโมงกับรายวันปนกัน
- คำนวณวันสิ้นสุดขั้นต่ำของงานรายวัน โดยนับเฉพาะวันที่ร้านเปิด
- ส่ง booking ผ่าน RPC `create_public_booking`
- copy ข้อความสรุปการจองให้ลูกค้าส่งต่อร้านได้

### `apps/booking-admin`

หน้า admin ของร้านและหน้าเจ้าของระบบ

ไฟล์สำคัญ:

- `app/login/page.tsx`: login
- `app/signup/page.tsx`: signup/request ร้านใหม่
- `app/api/signup/route.ts`: API สมัครร้านใหม่
- `app/platform/page.tsx`: CraftBike Control Center
- `components/platform/PlatformAdminConsole.tsx`: UI คุมร้านทั้งหมด
- `components/bookings/BookingDetailDialog.tsx`: ดู/แก้ไข/ลบ/เปลี่ยนสถานะ booking
- `components/today/TodayBoard.tsx`: งานวันนี้
- `components/dashboard/DashboardClient.tsx`: dashboard ร้าน
- `components/calendar/BookingCalendar.tsx`: ปฏิทิน
- `components/services/ServicesManager.tsx`: จัดการบริการ
- `components/settings/ScheduleSettings.tsx`: เวลาทำการ/วันหยุด
- `middleware.ts`: auth guard และ subdomain/admin/control routing
- `lib/portal.ts`: แยก mode ระหว่าง shop admin กับ control
- `lib/tenant.ts`: resolve shop จาก slug หรือ local shop id

ฟีเจอร์ shop admin ที่มี:

- login
- dashboard
- งานวันนี้
- รายการจอง
- ปฏิทิน
- จัดการบริการ
- ตั้งค่าเวลาทำการ
- ตั้งวันหยุดพิเศษ
- ดูรายละเอียด booking
- แก้วันนัด/เวลานัดบางกรณี
- เปลี่ยนสถานะ: เริ่มทำ, ทำเสร็จ, ยกเลิก, no-show
- ลบ booking

ฟีเจอร์ platform admin ที่มี:

- CraftBike Control Center ที่ `/platform`
- ตรวจ platform user จาก `platform_users`
- เห็นร้านทั้งหมด
- เห็นจำนวน booking/service/activity/billing/signup request
- แก้สถานะร้าน
- แก้ billing plan / due date / expiry / note
- suspend / reactivate
- delete shop
- ดู activity log
- ดู billing events
- ดู signup request queue
- approve/reject signup request ผ่าน RPC

## Supabase schema / migration ที่สำคัญ

ตาราง/แนวคิดหลัก:

- `shops`
- `service_items`
- `shop_holidays`
- `customers`
- `bookings`
- `shop_users`
- `platform_users`
- `platform_activity_logs`
- `shop_billing_events`
- `signup_requests`
- `public_booking_slots`

migration สำคัญ:

- `initial.sql`: schema หลัก, RLS, indexes, triggers, functions รวม baseline
- `20260507000000_daily_booking_support.sql`: รองรับ booking รายวัน
- `20260509000000_daily_booking_duration_floor.sql`: กันเลือกวันสิ้นสุดน้อยกว่าระยะเวลาบริการจริง
- `20260510000000_booking_delete_support.sql`: รองรับลบ booking
- `20260510000004_bootstrap_platform_users.sql`: platform users
- `20260510000005_shop_billing_controls.sql`: billing controls
- `20260510000007_platform_activity_logs.sql`: activity logs
- `20260510000008_shop_billing_events.sql`: billing events
- `20260510000009_signup_requests.sql`: signup request flow
- `20260510000010_signup_requests_hardening.sql`: hardening signup policies/functions
- `20260511000000_daily_working_day_holidays.sql`: คำนวณงานรายวันข้ามวันหยุด

untracked migration/function ที่ยังไม่ควรนับว่า production-ready:

- `supabase/config.toml`
- `supabase/functions/`
- `supabase/migrations/20260521000000_telegram_notifications.sql`

ชุดนี้เกี่ยวกับ Telegram notification ยังต้อง review/security/test ก่อน commit/deploy

## Environment variables

### Customer app

อยู่ที่:

```text
apps/booking-consumer/.env.local
```

ใช้:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
NEXT_PUBLIC_SHOP_ID
```

### Admin / Control app

อยู่ที่:

```text
apps/booking-admin/.env.local
```

ใช้:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
NEXT_PUBLIC_SHOP_ID
```

ข้อควรจำ:

- `SUPABASE_SERVICE_ROLE_KEY` ต้องอยู่ฝั่ง server เท่านั้น
- ห้ามใช้ prefix `NEXT_PUBLIC_` กับ service role key
- ตอนตรวจล่าสุด local มี service role key แล้ว และ `/api/signup` ไม่ 500 แล้ว

## Live data snapshot

ตรวจล่าสุดจาก Supabase live project:

- project ref: `gsbbkdppaegrttcqmjuq`
- platform user: 1 คน
- platform role: `super_admin`
- shop count: 1
- ร้านหลัก: `KMO RACK BAR CUSTOM`
- slug: `kmorackbarcustom`
- shop id: `a20672f2-59a7-4b4f-99da-0065ae98b73d`
- status: `active`
- billing plan: `year`
- billing due date: `2026-05-17`
- expires at: `2027-05-10`
- active services: 6
- bookings: 7
- signup requests: 0

ข้อสังเกต:

- `billing_due_date` เป็นวันที่เก่ากว่าวันปัจจุบัน แต่ `expires_at` ยังเป็นปี 2027
- นี่เป็น data จากรอบทดสอบ billing ก่อนหน้า ไม่ใช่ code crash
- ถ้าจะ demo/sales ควร clean ค่า billing ให้ตรง logic ที่ต้องการก่อน

## สถานะตรวจระบบล่าสุด

ตรวจเมื่อ: 2026-07-04

คำสั่งที่ผ่าน:

```bash
npm run lint
npm run build
```

ผล:

- lint ผ่านทั้ง `apps/booking-consumer`
- lint ผ่านทั้ง `apps/booking-admin`
- production build ผ่านทั้งสองแอป
- มี webpack cache warning เรื่อง serializing big strings ตอน build admin แต่ไม่ใช่ failure

Live URL ที่เช็ก:

- `https://kmorackbarcustom.craftbikelab.com/` ได้ `200`
- `https://kmorackbarcustom-admin.craftbikelab.com/login` ได้ `200`
- `https://control.craftbikelab.com/login` ได้ `200`
- `https://control.craftbikelab.com/signup` ได้ `404`

## สิ่งที่ทำถึงแล้ว

### เสร็จ/ใช้ได้ระดับ demo

- Multi-tenant concept
- Customer booking page
- Shop admin
- Platform admin concept + UI
- Booking hourly/daily
- Multi-day booking
- Holiday-aware daily booking
- Today board แสดงคิวรายวันคร่อมวัน
- Dashboard แสดงคิววันนี้
- Booking detail/edit/delete/status
- Service management
- Schedule/holiday settings
- Platform billing fields
- Platform activity logs
- Signup request schema/flow ใน code และ DB
- Local control signup API หลังใส่ service role key

### ใช้จริงได้แบบ controlled pilot

เหมาะกับร้านแรก/ร้านนำร่อง เช่น KMO ถ้า owner/admin ทดสอบ flow เองแล้วรับข้อจำกัดต่อไปนี้ได้:

- onboarding ร้านใหม่ยังต้องให้เจ้าของระบบช่วยดูแล
- payment ยัง manual
- notification ยังไม่ production-ready
- production control signup ยัง 404 ต้องแก้ deployment/domain

## สิ่งที่ยังไม่เสร็จ / ต้องระวังก่อนขายจริง

1. **Production signup route ยังไม่พร้อม**
   - `control.craftbikelab.com/signup` ตอนตรวจล่าสุดได้ `404`
   - code มี route แล้ว แต่ production/domain/deploy ยังไม่ตรง

2. **Telegram notification ยัง untracked**
   - มี SQL migration และ edge function ค้างอยู่
   - ต้อง review เรื่อง `verify_jwt = false`, secret, webhook auth, retry, logging

3. **Billing data ของ KMO ยังเป็นข้อมูลทดสอบ**
   - due date เก่า แต่ expiry ยังไกล
   - ควร reset/clean ก่อน demo

4. **`origin/main` ยังไม่ควร merge ตรง**
   - ต้องทำ merge-cleanup branch ถ้าจะเอาของใน main เข้ามา

5. **Payment ยัง manual**
   - ยังไม่มี Stripe/online payment
   - แผนตอนนี้เหมาะกับ manual payment ก่อน

6. **Production deployment ต้องเช็ก Vercel ซ้ำ**
   - customer/admin/control login เปิดได้
   - แต่ signup control 404 แปลว่ายังมี deployment/domain gap

## คำสั่งเริ่มทำงานต่อ

```bash
cd C:\Users\Win10\Documents\mysystems
git fetch --all --prune
git status --short --branch
git log --oneline --decorate -5
cd bike-booking-saas
npm install
npm run lint
npm run build
```

รัน dev:

```bash
npm run dev:shop
npm run dev:admin
```

เปิด:

```text
http://localhost:3000
http://localhost:3001/login
```

## คำสั่งที่ควรบอก agent ตัวอื่น

```text
เข้า repo C:\Users\Win10\Documents\mysystems แล้วทำงานเฉพาะ bike-booking-saas
อ่าน START_HERE.md, README.md, docs/PROJECT_CURRENT_OVERVIEW.md, SESSION_NOTES_CURRENT.md ก่อน
ห้าม pull/merge origin/main ตรงๆ
ห้ามแตะโปรเจกต์อื่นใน repo
ห้าม commit ไฟล์ untracked Telegram/Supabase จนกว่าจะ review
ถ้าจะสรุป/ทำแผนขาย ให้อ้างอิง docs/PROJECT_CURRENT_OVERVIEW.md และ docs/CLAUDE_SALES_HANDOFF.md
```

## เอกสารที่ควรอ่านต่อ

- `START_HERE.md`
- `README.md`
- `SESSION_NOTES_CURRENT.md`
- `CLAUDE.md`
- `docs/CLAUDE_SALES_HANDOFF.md`
- `docs/DOMAIN_STANDARD.md`
- `docs/WORKFLOW.md`
- `docs/AGENT_START_END.md`
- `docs/AGENT_REVIEW_LESSONS.md`
- `MASTER BLUEPRINT - Bike Booking SaaS.md`

## สรุปสำหรับเจ้าของโปรเจกต์

เว็บนี้ชื่อ **CraftBike Booking SaaS**

หน้าผู้คุมชื่อ **CraftBike Control Center**

ร้านแรกที่อยู่ในระบบคือ **KMO RACK BAR CUSTOM**

ลิงก์ที่ต้องจำที่สุด:

- ลูกค้าจอง: `https://kmorackbarcustom.craftbikelab.com/`
- แอดมินร้าน: `https://kmorackbarcustom-admin.craftbikelab.com/login`
- เจ้าของระบบ: `https://control.craftbikelab.com/login`
- GitHub: `https://github.com/Gutumrod/mysystems.git`

สถานะตอนนี้:

- แกนระบบจองและ admin ใช้ได้
- platform/control ใช้ได้ระดับ local/login/data
- ก่อนขายจริงต้องแก้ production signup 404, clean billing data, และตัดสินใจเรื่อง notification/payment
