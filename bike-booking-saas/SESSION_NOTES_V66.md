# SESSION NOTES V66

## Path

- repo: `C:\Users\Win10\Documents\mysystems\bike-booking-saas`
- git root: `C:\Users\Win10\Documents\mysystems`

## วันที่

- 2026-05-23

## เหตุการณ์หลัก

ผู้ใช้แจ้งว่าอีกเครื่อง/Mac น่าจะ push งานใหญ่ขึ้น GitHub แล้ว และขอให้ตรวจละเอียดก่อนทำต่อ เพราะงานเริ่มเข้าใกล้ production และมีคนรอใช้งานจริง

ตรวจพบว่า `origin/main` มี commit ใหม่:

- `ff4a4ab feat(bike-booking-saas): implement dynamic subdomain routing, onboarding UI/DB procedure, and Thai manuals`

เครื่อง Windows ก่อน pull ยังอยู่ที่:

- `5e393db docs: add session v65 and test plan`

สถานะ:

- local `main` behind `origin/main` 1 commit
- ยังไม่ pull
- ยังไม่รัน SQL ใหม่
- ยังไม่ deploy

## ไฟล์ untracked ที่มีอยู่ก่อนบันทึกรอบนี้

ยังมีไฟล์ untracked อยู่ใน working tree:

- `bike-booking-saas/supabase/config.toml`
- `bike-booking-saas/supabase/functions/`
- `bike-booking-saas/supabase/migrations/20260521000000_telegram_notifications.sql`

ไฟล์เหล่านี้ไม่ได้แตะใน session นี้ เพราะไม่เกี่ยวกับการบันทึก review

## สิ่งที่ตรวจจาก GitHub commit ใหม่

ตรวจ diff จาก:

- `HEAD..origin/main`

พบว่า commit ใหม่ใหญ่มาก:

- เปลี่ยนมากกว่า 100 ไฟล์
- เพิ่มเอกสาร/ระบบ onboarding/subdomain
- ลบ session notes จำนวนมาก
- ลบ migration สำคัญจำนวนมาก
- ลบ signup/reset flow
- rewrite platform admin บางส่วน

## Build verification

เพื่อไม่แตะ working copy หลัก ได้สร้าง temporary worktree จาก `origin/main` แล้วทดสอบ

ผลทดสอบ:

- `npm ci` ผ่าน
- `npm run lint` ผ่าน
- `npm --workspace apps/booking-consumer run build` ผ่าน
- `npm --workspace apps/booking-admin run build` ผ่าน

สรุป:

- โค้ดชุด `ff4a4ab` ผ่าน syntax/type/build
- แต่ยังไม่ production-safe เพราะมี regression เชิงระบบและ migration/history

## ปัญหาที่พบ

### 1. Session notes regression

commit ใหม่ลบ:

- `SESSION_NOTES_V47.md` ถึง `SESSION_NOTES_V65.md`

และทำให้:

- `SESSION_NOTES_CURRENT.md` กลับไปชี้ `SESSION_NOTES_V46.md`

ผลกระทบ:

- ประวัติงานและ handoff ล่าสุดหายจาก repo
- agent รอบต่อไปจะอ่านสถานะผิด
- workflow ข้ามเครื่องพัง

### 2. Migration history regression

commit ใหม่ลบ migrations สำคัญ เช่น:

- platform users bootstrap
- billing controls
- delete shop permission
- platform activity logs
- billing events
- signup requests
- signup requests hardening
- daily working-day holidays

ผลกระทบ:

- repo ไม่สะท้อน live DB history
- setup เครื่องใหม่หรือ DB ใหม่จะไม่ตรงกับ production
- feature ที่ live เคยมีอาจหายจาก migration chain

### 3. Platform Control Center regression

commit ใหม่ทำให้หน้า platform admin ง่ายลง และตัด data fetch ของ:

- `platform_activity_logs`
- `shop_billing_events`
- `signup_requests`

สิ่งที่เสี่ยงหาย:

- billing due date
- expiry
- billing plan
- activity log
- signup queue
- suspend/reactivate/delete workflows

### 4. Onboarding flow ยังไม่ตรง requirement

commit ใหม่สร้าง onboarding ด้วย `Owner User UUID`

requirement จริงที่ต้องไปต่อ:

- email
- shop name
- slug
- password
- confirm password
- platform owner อนุมัติ/สร้างร้าน
- reset password ได้โดย platform owner ไม่ต้องรู้ password จริง

### 5. SQL onboarding ใช้ duration fields ไม่ครบ

`20260522000000_one_click_onboarding.sql` insert default service ด้วย:

- `duration_hours`

แต่ไม่ได้ใส่:

- `duration_unit`
- `duration_value`

ผลกระทบ:

- service default อาจ duration ผิดใน logic ใหม่
- งาน 3 ชั่วโมงอาจถูกมองเป็น 1 ชั่วโมงถ้า frontend/backend อ่าน `duration_value`

### 6. Supabase security concern

`onboard_shop()` เป็น:

- `security definer`
- อยู่ใน schema `bike_booking`
- grant execute ให้ `authenticated`

แม้ function จะเช็ก `is_platform_admin()` แต่ยังต้อง security review ตาม Supabase checklist เพราะเป็น high-privilege RPC

### 7. Daily booking holiday-aware logic อาจถอยหลัง

frontend กลับมาใช้:

- `calculateMinimumDailyEndDate(startDate, requiredDays)`

ซึ่งคำนวณจาก calendar day ธรรมดา และไม่รับ `shop` / `holidays`

ผลกระทบ:

- ไม่สอดคล้องกับ requirement ล่าสุดที่ต้องบวกวันเมื่อโดนวันหยุดร้าน/วันหยุดพิเศษ

### 8. Today reload bug

หน้า `TodayBoard` server load ดึง booking ทั้งหมดแล้ว filter active today ได้

แต่ client reload ใช้:

- `.eq("booking_date", today)`

ผลกระทบ:

- daily booking ที่เริ่มเมื่อวานและยัง active วันนี้จะหายหลัง reload/update status

## สิ่งที่ดีจาก commit ใหม่

ควรพิจารณาเก็บ:

- `OWNERS_MANUAL.md`
- `SHOP_MANUAL.md`
- `walkthrough.md`
- `project_development_plan.md`
- `task.md`
- `work_log.md`
- idea dynamic subdomain routing
- idea one-click onboarding

## การตัดสินใจ

ยังไม่ควร pull `origin/main` เข้าเครื่องหลักแบบตรงๆ

ต้องทำ merge-cleanup branch ก่อน เพื่อ:

- เก็บของดีจาก commit ใหม่
- กู้ session notes/migrations ที่ถูกลบ
- รักษา platform control เดิม
- แก้ onboarding ให้ตรง requirement
- แก้ daily holiday-aware logic
- แก้ Today reload bug

## แผนงานต่อ

### Phase 1: Create merge cleanup branch

- สร้าง branch แยกจาก local stable state
- ดึง commit ใหม่มาแบบเลือกไฟล์/เลือก logic
- ไม่ pull ทับ main ตรงๆ

### Phase 2: Restore critical history

- รักษา `SESSION_NOTES_V47.md` ถึง `SESSION_NOTES_V65.md`
- ให้ `SESSION_NOTES_CURRENT.md` ชี้ version ล่าสุด
- รักษา migration history ที่เคย apply/live relevant
- รักษา `START_HERE.md` และ docs สำคัญ

### Phase 3: Rebuild platform admin correctly

- ใช้ชื่อ/แนวทาง `CraftBike Control Center`
- รักษา billing/expiry/due date
- รักษา activity logs
- รักษา signup queue
- รักษา suspend/reactivate/delete
- เพิ่ม onboarding ที่ใช้งานจริง ไม่ใช่ Owner UUID UX

### Phase 4: Fix customer/admin booking regressions

- customer daily minimum end date ต้อง holiday-aware
- admin today reload ต้อง query active today
- dashboard/today booking visibility ต้องไม่หายสำหรับ daily multi-day booking

### Phase 5: Verify before push

- `npm run lint`
- `npm --workspace apps/booking-consumer run build`
- `npm --workspace apps/booking-admin run build`
- live/manual test ตาม `docs/TODAY_TEST_PLAN_20260516.md`

## เอกสารสอนน้องใหม่ที่เพิ่มในรอบนี้

เพิ่มไฟล์:

- `docs/AGENT_REVIEW_LESSONS.md`

วัตถุประสงค์:

- บันทึกสิ่งที่ agent ใหม่ทำดี
- บันทึกสิ่งที่ผิดพลาด
- สอนกติกาการทำงานกับ production repo
- ป้องกันไม่ให้ agent รอบต่อไปลบ history/migrations หรือทับ feature เดิมอีก

## ข้อควรจำสำหรับ agent รอบต่อไป

- ห้าม `git pull` ตรงๆ จนกว่า merge-cleanup จะพร้อม
- ห้ามรัน migration `20260522000000_one_click_onboarding.sql` บน live โดยยังไม่ review
- ห้ามลบ session notes/migrations
- build ผ่านไม่พอ ต้องตรวจ feature regression
- ทำเฉพาะ `bike-booking-saas`
- อย่าแตะ untracked Telegram/Supabase files เว้นแต่ผู้ใช้สั่ง

## ลงชื่อ

- codex

