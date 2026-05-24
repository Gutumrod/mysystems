# Agent Review Lessons

เอกสารนี้ใช้สอน Codex / Claude / Gemini / agent ใหม่ที่เข้ามาช่วยงาน `bike-booking-saas`
โดยเฉพาะกรณีที่มีการทำงานจากอีกเครื่องแล้ว push commit ใหญ่เข้ามา

## เหตุการณ์ที่ต้องจำ

- วันที่ตรวจ: 2026-05-23
- commit ที่ตรวจจาก GitHub: `ff4a4ab feat(bike-booking-saas): implement dynamic subdomain routing, onboarding UI/DB procedure, and Thai manuals`
- base ในเครื่อง Windows ก่อน pull: `5e393db docs: add session v65 and test plan`
- สถานะสำคัญ: ยังไม่ควร `git pull` ทับเครื่องหลักทันที

## สิ่งที่น้องใหม่ทำได้ดี

### 1. มองทิศทางระบบถูก

งานที่เพิ่มมาใน commit ใหม่พยายามพาระบบไปทางที่ถูกต้อง:

- multi-tenant / dynamic subdomain routing
- one-click shop onboarding
- คู่มือสำหรับเจ้าของระบบและร้านค้า
- walkthrough สำหรับส่งต่อ/ตรวจงาน

ทิศทางนี้สอดคล้องกับเป้าหมายใหญ่ของระบบ:

- `customer = https://[shop].craftbikelab.com`
- `shop admin = https://[shop]-admin.craftbikelab.com`
- `platform admin = https://control.craftbikelab.com`

### 2. ทำให้โค้ด build ผ่าน

ตรวจใน worktree แยกจาก `origin/main` แล้ว:

- `npm ci` ผ่าน
- `npm run lint` ผ่าน
- `npm --workspace apps/booking-consumer run build` ผ่าน
- `npm --workspace apps/booking-admin run build` ผ่าน

แปลว่า syntax, TypeScript, lint, Next.js build อยู่ในระดับที่ดี

### 3. เอกสารใหม่มีประโยชน์

ไฟล์ใหม่ที่ควรเก็บไปพิจารณาต่อ:

- `OWNERS_MANUAL.md`
- `SHOP_MANUAL.md`
- `walkthrough.md`
- `project_development_plan.md`
- `task.md`
- `work_log.md`

เอกสารเหล่านี้อาจยังต้อง verify แต่มีประโยชน์มากสำหรับการทำระบบให้ใช้งานจริง

## สิ่งที่พลาดและต้องแก้

### 1. commit ใหญ่เกินไป

commit เดียวมีทั้ง:

- routing
- onboarding
- platform console
- documentation
- migration
- delete session notes
- delete old migrations
- delete signup/reset flow
- rewrite platform page

ปัญหา:

- review ยาก
- rollback ยาก
- แยกไม่ได้ว่า bug มาจากจุดไหน
- เสี่ยงทับระบบ production ที่กำลังใช้งานได้

กติกาใหม่:

- งานใหญ่ต้องแยก commit ตามเรื่อง
- migration ต้องแยก commit จาก UI
- docs ต้องแยก commit จาก logic
- ห้ามรวม feature ใหม่กับการลบไฟล์เก่าใน commit เดียว

### 2. ลบ session notes สำคัญ

commit ใหม่ลบ:

- `SESSION_NOTES_V47.md` ถึง `SESSION_NOTES_V65.md`

และทำให้:

- `SESSION_NOTES_CURRENT.md` ถอยกลับไปชี้ `SESSION_NOTES_V46.md`

ผลเสีย:

- ประวัติงานหาย
- handoff ระหว่างเครื่องพัง
- agent รอบต่อไปเข้าใจสถานะผิด
- ความคืบหน้าหลัง V46 ถูกลบออกจากความทรงจำของ repo

กติกาใหม่:

- ห้ามลบ `SESSION_NOTES_V*.md` เว้นแต่ user สั่งชัดเจน
- ถ้าจะเพิ่ม session ใหม่ ให้สร้างเลขใหม่ต่อท้ายเท่านั้น
- `SESSION_NOTES_CURRENT.md` ต้องชี้ version ล่าสุดเสมอ
- ถ้าไม่แน่ใจว่าเลขล่าสุดคืออะไร ให้ list ไฟล์ก่อน

### 3. ลบ migrations ที่ live system ใช้ไปแล้ว

commit ใหม่ลบ migrations สำคัญ เช่น:

- `20260510000003_transfer_titazmth_to_platform.sql`
- `20260510000004_bootstrap_platform_users.sql`
- `20260510000005_shop_billing_controls.sql`
- `20260510000006_allow_authenticated_delete_shops.sql`
- `20260510000007_platform_activity_logs.sql`
- `20260510000008_shop_billing_events.sql`
- `20260510000009_signup_requests.sql`
- `20260510000010_signup_requests_hardening.sql`
- `20260511000000_daily_working_day_holidays.sql`

ผลเสีย:

- live DB อาจยังมี schema เหล่านี้ แต่ repo ใหม่ไม่มีประวัติ
- เครื่องใหม่หรือ DB ใหม่จะ bootstrap ไม่เหมือน live
- platform control / signup / billing / holiday-aware daily booking เสี่ยงหาย

กติกาใหม่:

- ห้ามลบ migration ที่เคย apply กับ live แล้ว
- ถ้า migration เก่าไม่สวย ให้เพิ่ม migration ใหม่เพื่อแก้ ไม่ลบทิ้ง
- ก่อนแก้ Supabase ต้องเช็ก live schema / backup note / advisor warning
- build ผ่านไม่ได้แปลว่า migration ถูก

### 4. Platform Control Center ถอยหลัง

commit ใหม่ลดความสามารถของ platform admin:

ของเดิมที่เคยมี/กำลังต้องรักษา:

- billing due date
- expires at
- billing plan
- billing events
- platform activity logs
- signup request queue
- suspend / reactivate
- delete shop
- quick billing actions

commit ใหม่เหลือ control แบบง่ายกว่า และ `platform/page.tsx` ไม่ fetch:

- `platform_activity_logs`
- `shop_billing_events`
- `signup_requests`

ผลเสีย:

- เจ้าของระบบควบคุมร้านได้น้อยลง
- feature ที่เพิ่งทำไว้ถูกตัดออก
- ไม่ตรง concept `control.craftbikelab.com`

กติกาใหม่:

- Platform admin คือระบบเจ้าของแพลตฟอร์ม ไม่ใช่ admin ร้านเดียว
- ห้าม simplify จน business control หาย
- ถ้าจะ redesign UI ต้องรักษา capability เดิมก่อน

### 5. Onboarding ยังไม่ตรง requirement

commit ใหม่เพิ่ม `onboard_shop()` และ modal เพิ่มร้าน แต่ให้กรอก:

- slug
- shop name
- phone
- Owner User UUID

ปัญหา:

- ร้านจริงไม่รู้จัก Supabase Auth UUID
- platform owner ต้องสร้าง/หา user เองก่อน
- ไม่ตรง requirement ที่คุยไว้

requirement ที่ถูกต้อง:

- email
- shop name
- slug พร้อมคำอธิบายตัวอย่าง
- password
- confirm password
- platform owner สามารถอนุมัติ/สร้างร้าน/ผูกเจ้าของร้าน
- เจ้าของร้านสามารถ reset password ได้โดยที่ platform owner ไม่ต้องรู้ password จริง

กติกาใหม่:

- ห้ามออกแบบ user-facing onboarding ด้วย internal UUID
- ถ้าต้องใช้ UUID ให้เป็น implementation detail หลังบ้าน
- password ต้องให้ผู้ใช้ตั้งเอง หรือใช้ reset flow ที่ปลอดภัย

### 6. SQL onboarding ใช้ service duration ไม่ครบ schema

ไฟล์ใหม่:

- `supabase/migrations/20260522000000_one_click_onboarding.sql`

มีจุดเสี่ยง:

- insert `service_items` ด้วย `duration_hours` อย่างเดียว
- ไม่ระบุ `duration_unit`
- ไม่ระบุ `duration_value`

แต่ schema ปัจจุบันรองรับ:

- `duration_unit = 'hour' | 'day'`
- `duration_value`
- `duration_hours`

ผลเสีย:

- บริการ default อาจมี `duration_value` เป็น default `1`
- บริการ 3 ชั่วโมงอาจถูก logic ใหม่มองเป็น 1 ชั่วโมง
- daily service default ยังไม่มี

กติกาใหม่:

- ก่อนเขียน SQL ต้อง grep schema และ TypeScript types
- service duration ต้องเขียนให้ครบทั้ง legacy และ current fields
- ถ้าเป็น onboarding seed ต้องสร้างข้อมูลที่ UI ใช้งานได้จริงทันที

### 7. Security definer function อยู่ใน exposed schema

`onboard_shop()` ถูกสร้างใน schema `bike_booking` และเป็น:

- `security definer`
- `grant execute ... to authenticated`

แม้ข้างในจะเช็ก `is_platform_admin()` แต่ Supabase security checklist เตือนว่า:

- ไม่ควรวาง `security definer` function ใน exposed schema ถ้าเลี่ยงได้
- function สิทธิ์สูงต้องควบคุม role และ search_path เข้มงวด

กติกาใหม่:

- function สิทธิ์สูงต้องผ่าน security review ก่อน deploy
- ต้องเช็ก Supabase advisor หลังแก้ SQL
- อย่าเปิด execute กว้างโดยไม่จำเป็น

### 8. Daily booking holiday-aware logic ถอยหลังบางส่วน

commit ก่อนหน้าเราทำไว้ว่า:

- daily booking ต้องคิด minimum end date จากวันทำการจริง
- ถ้ามีวันหยุดร้านหรือวันหยุดพิเศษคั่น ต้องบวกวันเพิ่ม

ใน commit ใหม่ frontend กลับมาใช้:

- `calculateMinimumDailyEndDate(startDate, requiredDays)`

ซึ่งบวกวันแบบ calendar ธรรมดา ไม่ส่ง `shop` / `holidays`

ผลเสีย:

- ลูกค้าอาจเลือกวันสิ้นสุดสั้นเกินจริงถ้ามีวันหยุดคั่น
- UX ไม่ตรงกับ business rule
- อาจชนกับ RPC/live validation

กติกาใหม่:

- logic วันหยุดต้องมีทั้ง frontend preview และ backend enforcement
- frontend ต้องคำนวณเหมือน backend ให้มากที่สุด
- ถ้า backend reject ได้ แต่ frontend ยังให้เลือกผิด ถือว่ายังไม่จบ

### 9. Today reload bug ยังมี

หน้า `TodayBoard` เปิดหน้าแรกได้รับ booking ทั้งหมดจาก server แล้ว filter ด้วย:

- `isBookingActiveOnDate(booking, today)`

ซึ่งรองรับ daily booking ที่คร่อมหลายวัน

แต่ฟังก์ชัน reload ใน component ใช้:

- `.eq("booking_date", today)`

ผลเสีย:

- daily booking ที่เริ่มเมื่อวานและยัง active วันนี้จะหายหลัง reload
- เกิดได้หลังอัปเดต status / refresh ภายในหน้า

กติกาใหม่:

- Query ของ "งานวันนี้" ต้องดึง booking ที่ active วันนี้ ไม่ใช่แค่เริ่มวันนี้
- ถ้าหน้าแรกและ reload ใช้ logic คนละแบบ ถือว่า bug

## วิธีทำงานที่ถูกต้องต่อจากนี้

### Phase 1: Freeze

- อย่า `git pull` ทับเครื่องหลักทันที
- อย่ารัน SQL ใหม่ทันที
- อย่า deploy จาก commit ที่ยัง review ไม่ครบ
- สร้าง branch แยกสำหรับ merge-cleanup

### Phase 2: แยกของดีออกจากของเสี่ยง

เก็บของดี:

- manuals
- walkthrough
- idea ของ onboarding
- idea ของ dynamic subdomain routing

ระวัง/ไม่รับตรงๆ:

- การลบ session notes
- การลบ migrations
- platform control ที่ตัด feature
- onboarding ที่ใช้ Owner UUID
- SQL security definer ที่ยังไม่ review

### Phase 3: Merge แบบรักษาระบบเดิม

ต้องรักษา:

- session notes ล่าสุด
- migration history
- signup/reset password flow
- billing control
- activity logs
- daily holiday-aware logic
- today/dashboard daily booking visibility

### Phase 4: Verify

ก่อนสรุปว่าจบ ต้องผ่าน:

- `npm run lint`
- `npm --workspace apps/booking-consumer run build`
- `npm --workspace apps/booking-admin run build`
- test customer hourly booking
- test customer daily 1 day
- test customer daily multiple days
- test daily booking with regular holiday
- test daily booking with extra shop holiday
- test admin dashboard
- test admin today board
- test admin booking edit/delete/status
- test platform billing/suspend/reactivate/delete/activity

## สรุปสอนน้องแบบสั้น

สิ่งที่ดี:

- direction ถูก
- build ผ่าน
- เอกสารมีประโยชน์
- ตั้งใจทำระบบใหญ่ให้ไปต่อได้

สิ่งที่ต้องแก้:

- อย่าทำ commit ใหญ่เกินไป
- อย่าลบประวัติงาน
- อย่าลบ migration live
- อย่าให้ build ผ่านเป็นหลักฐานเดียว
- อย่าออกแบบ UX ด้วย internal UUID
- อย่าลด feature เดิมโดยไม่รู้ตัว

ประโยคจำง่าย:

> Production work is not only "make it build". It must preserve history, preserve migrations, preserve existing behavior, and match the agreed business flow.

