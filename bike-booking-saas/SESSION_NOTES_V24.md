# SESSION_NOTES_V24 - Security Hardening, Capacity Limits & Platform Admin

วันที่: 2026-05-03
โปรเจกต์: Bike Booking SaaS
ต่อจาก: V23 (Today Board)

---

## สิ่งที่ทำเสร็จแล้วทั้งหมดใน Session นี้ (หลัง V23)

V23 หยุดที่ commit `86a7ccb feat: add shop today work board`
Session ล่าสุดมีงานเพิ่มเติมอีก 7 commits:

```
bf2efb4 feat: add slot capacity and daily booking limits
86a7ccb feat: add shop today work board            ← V23 บันทึกถึงตรงนี้
471bd5f fix: stabilize live booking views
9eee1c6 docs: record v21 booking verification
c177e8d fix: control admin calendar navigation
09b2095 fix: harden shop admin workflows
8fd4332 chore: sync bike booking phase updates
6b0d3cc fix: filter bookings by date in buildTimeSlots conflict check
e6c9910 Merge branch 'claude/modest-kare-af2710'
27da03f fix: replace insert+select with create_public_booking RPC (v15)
```

---

## Migration ใหม่ 4 อัน

### 1. `20260502040000_platform_admin_owner_guardrails.sql`

**วัตถุประสงค์:** สร้างระบบ platform-level admin และบังคับกฎ 1 shop = 1 owner

สิ่งที่ทำ:
- สร้าง enum `platform_user_role` (`super_admin`)
- สร้าง table `bike_booking.platform_users(user_id, role, created_at)`
- สร้าง unique index `idx_shop_users_one_owner_per_shop` บน `shop_users(shop_id)` เฉพาะ `role = 'owner'`
- สร้าง trigger `shop_users_assert_single_owner` → function `assert_single_shop_owner()` ป้องกัน owner ซ้ำในร้านเดียวกัน raise exception "แต่ละร้านมีเจ้าของได้เพียง 1 คน"
- สร้าง function `is_platform_admin()` ตรวจสอบว่า user ปัจจุบันอยู่ใน `platform_users`
- เปิด RLS บน `platform_users`
- เพิ่ม RLS policies สำหรับ platform admin: จัดการได้ทุก table (`shops`, `service_items`, `shop_holidays`, `bookings`, `customers`, `shop_users`)
- `grant select on platform_users to authenticated`

---

### 2. `20260502050000_customer_booking_integrity_hardening.sql`

**วัตถุประสงค์:** เพิ่ม trigger ตรวจความถูกต้องของ booking ทุกครั้งที่มีการ insert/update และอัปเดต `create_public_booking` RPC

**Trigger `assert_booking_rules()`** ตรวจ 7 เงื่อนไขตามลำดับ:
1. ห้ามจองวันที่ผ่านมาแล้ว
2. ห้ามจองล่วงหน้าเกิน 45 วัน
3. ห้ามจองเวลาที่ผ่านมาแล้วในวันเดียวกัน
4. `service_items` ต้องมี 1–10 รายการ และต้องเป็น active service ของร้านนั้น
5. ตรวจ `working_hours` ว่าร้านเปิดวันนั้น และเวลาที่จองอยู่ในช่วงเวลาทำการ
6. ตรวจ `shop_holidays` วันหยุดพิเศษ
7. ตรวจ blacklist ลูกค้าจาก `customers.is_blacklisted`
8. ตรวจ time conflict กับ booking อื่นที่ `status in ('confirmed', 'in_progress')`

**อัปเดต `create_public_booking` RPC:**
- คำนวณ `booking_time_end` อัตโนมัติจาก `sum(duration_hours)` ของ services ที่เลือก (ไม่รับ `p_booking_time_end` จาก client)
- ตรวจ `v_service_count = cardinality(p_service_items)` ป้องกัน invalid service IDs
- `grant execute to anon, authenticated`

---

### 3. `20260503001000_admin_security_success_window.sql`

**วัตถุประสงค์:** ปิดช่องโหว่ `is_platform_admin()` และเพิ่ม RPC สำหรับหน้า success

สิ่งที่ทำ:
- `revoke execute on is_platform_admin() from public, anon` — เดิม function นี้ถูก grant กว้างเกินไป
- `grant execute on is_platform_admin() to authenticated` เท่านั้น
- สร้าง function `get_public_booking_confirmation(target_booking_id uuid, target_shop_id uuid)`:
  - คืนข้อมูล booking เฉพาะที่ `status in ('confirmed', 'in_progress', 'completed')`
  - และ `created_at > now() - interval '24 hours'` (success window 24 ชั่วโมง)
  - ไม่เปิดเผย field ที่ sensitive เช่น `customer_fb`, `customer_line_id`
  - `grant execute to anon, authenticated`

---

### 4. `20260503050546_booking_capacity_limits.sql`

**วัตถุประสงค์:** รองรับการรับคิวพร้อมกันหลายคันและจำกัดจำนวน/วัน

**Backfill data:**
- UPDATE ทุก shop — inject `slot_capacity: 1` และ `daily_limit: 0` เข้าไปใน `working_hours` JSONB ทุก day key ที่ยังไม่มี field เหล่านี้

**อัปเดต `assert_booking_rules()`** เพิ่มการตรวจ 2 ระดับ:
- **Daily limit:** ถ้า `daily_limit > 0` และ booking วันนั้น (status ไม่ใช่ `cancelled`/`no_show`) ≥ `daily_limit` → raise "วันนี้คิวเต็มแล้ว"
- **Slot capacity (sliding window):** แบ่ง booking window เป็น segments ทีละ 1 ชั่วโมง ตรวจว่า booking ที่ overlap ใน segment นั้นไม่เกิน `slot_capacity` → raise "เวลานี้เต็มแล้ว"
- **Race condition protection:** `pg_advisory_xact_lock(hashtextextended(shop_id || ':' || booking_date, 0))` lock ก่อนตรวจ ป้องกัน concurrent booking ที่อาจผ่านการตรวจพร้อมกัน

**อัปเดต `create_public_booking` RPC:**
- เพิ่ม `pg_advisory_xact_lock(...)` ตั้งแต่ต้น function ก่อน insert ทุกอย่าง

---

## Bug Fixes สำคัญ

### fix: filter bookings by date in `buildTimeSlots` conflict check
**ปัญหา:** `hasCapacityAcrossWindow()` ใน `apps/booking-consumer/lib/utils.ts` ตรวจ overlap กับ bookings ทุกวัน ไม่ได้ filter เฉพาะ `booking_date === date` ที่กำลังดูอยู่ ทำให้ slot ที่ควร available กลับแสดงว่าเต็มจาก booking วันอื่น

**แก้ไข:** เพิ่มเงื่อนไข `booking.booking_date !== date → return false` ก่อน check overlap ใน `hasCapacityAcrossWindow()`

### fix: control admin calendar navigation
**ปัญหา:** `react-big-calendar` ใน `BookingCalendar.tsx` ไม่ได้ผูก `date` และ `view` state กับ calendar component ทำให้ปุ่ม previous/next ไม่ทำงาน (calendar ไม่ขยับ)

**แก้ไข:** เพิ่ม `onNavigate={setDate}` และ `onView={setView}` เข้าไปใน `<Calendar>` component เพื่อให้ controlled navigation ทำงานได้

### fix: stabilize live booking views
**ปัญหา:** `BookingCalendar` และ `TodayBoard` มีปัญหา stale closure และ channel leak ใน useEffect

**แก้ไข:** ใช้ `useCallback` wrap `reload` function, cleanup channel และ interval อย่างถูกต้องใน return function ของ useEffect

### fix: harden shop admin workflows
- Middleware admin app (`apps/booking-admin/middleware.ts`) เพิ่ม guard สำหรับ `/platform` route — ตรวจ `platform_users` table ก่อน allow, redirect `/unauthorized` ถ้าไม่มีสิทธิ์
- `BookingsTable` รองรับ `no_show` via RPC `mark_booking_no_show` แทนการ update โดยตรง

### fix: replace insert+select with `create_public_booking` RPC (v15)
**ปัญหา:** consumer app เดิม insert ลง `bookings` table โดยตรง ซึ่งถูก RLS block เพราะ anon user ไม่มีสิทธิ์ INSERT

**แก้ไข:** เปลี่ยนมาใช้ `create_public_booking` RPC ที่เป็น `security definer` — function รัน as owner ได้รับอนุญาต insert แทน client

---

## ไฟล์ที่เปลี่ยนแปลงหลัง V23

### ใหม่ / เพิ่มเติม

| ไฟล์ | เปลี่ยนแปลง |
|------|------------|
| `supabase/migrations/20260502040000_platform_admin_owner_guardrails.sql` | platform_users table, is_platform_admin(), 1-owner enforcement |
| `supabase/migrations/20260502050000_customer_booking_integrity_hardening.sql` | assert_booking_rules trigger, create_public_booking v2 |
| `supabase/migrations/20260503001000_admin_security_success_window.sql` | revoke is_platform_admin from anon, get_public_booking_confirmation RPC |
| `supabase/migrations/20260503050546_booking_capacity_limits.sql` | slot_capacity + daily_limit, advisory lock, backfill |
| `apps/booking-admin/app/platform/page.tsx` | Platform Admin dashboard หน้าใหม่ |
| `apps/booking-admin/app/unauthorized/page.tsx` | หน้า unauthorized |

### แก้ไข

| ไฟล์ | เปลี่ยนแปลง |
|------|------------|
| `apps/booking-consumer/lib/utils.ts` | `buildTimeSlots` รองรับ `slot_capacity`, `daily_limit`; fix date filter ใน `hasCapacityAcrossWindow` |
| `apps/booking-consumer/lib/types.ts` | เพิ่ม `slot_capacity`, `daily_limit` ใน `WorkingDay` type |
| `apps/booking-consumer/app/success/page.tsx` | ใช้ `get_public_booking_confirmation` RPC |
| `apps/booking-admin/middleware.ts` | guard `/platform` route, redirect unauthorized |
| `apps/booking-admin/components/calendar/BookingCalendar.tsx` | `onNavigate={setDate}`, `onView={setView}`, fix realtime subscription |
| `apps/booking-admin/components/today/TodayBoard.tsx` | fix stale closure, cleanup channel + interval |
| `apps/booking-admin/components/bookings/BookingsTable.tsx` | no_show via RPC |
| `apps/booking-admin/components/settings/ScheduleSettings.tsx` | เพิ่ม fields `slot_capacity` (รับพร้อมกัน), `daily_limit` (จำกัด/วัน) ใน UI |

---

## สิ่งที่ทำเสร็จแล้วทั้งหมด (ภาพรวมทุก session)

### Consumer App (`booking.craftbikelab.com`)
- [x] หน้าจองคิว: เลือกบริการ → วันที่ → เวลา → กรอกข้อมูล → ยืนยัน
- [x] Time slot generation พร้อม slot_capacity และ daily_limit
- [x] หน้า success แสดงรายละเอียดการจอง + copy button
- [x] Subdomain routing ผ่าน middleware (production)
- [x] `create_public_booking` RPC (security definer, ผ่าน RLS)
- [x] `get_public_booking_confirmation` RPC (24-hour window)
- [x] `public_booking_slots` view สำหรับ frontend ดู slot availability
- [x] Demo mode ทำงานได้โดยไม่ต้องมี Supabase

### Admin App (`localhost:3001`)
- [x] Login / Auth ด้วย Supabase Auth
- [x] Dashboard: สถิติคิวรายเดือน, realtime
- [x] Bookings: ตารางคิวทั้งหมด, filter, เปลี่ยนสถานะ, no_show
- [x] Calendar: Month/Week/Day view, controlled navigation, realtime
- [x] Today Board: คิววันนี้, quick status buttons, realtime + polling
- [x] Services: CRUD รายการบริการ
- [x] Schedule Settings: เวลาทำการรายวัน, slot_capacity, daily_limit, วันหยุดพิเศษ
- [x] Shop Settings: ข้อมูลร้าน
- [x] Platform Admin (`/platform`): ภาพรวมร้านทั้งหมด, จำนวน booking

### Database (Supabase)
- [x] Schema `bike_booking` แยกจาก `public`
- [x] Tables: `shops`, `shop_users`, `service_items`, `bookings`, `customers`, `shop_holidays`, `platform_users`
- [x] RLS policies ครอบคลุมทุก table
- [x] `create_public_booking` RPC (security definer)
- [x] `get_public_booking_confirmation` RPC
- [x] `assert_booking_rules` trigger (7 validations)
- [x] `assert_single_shop_owner` trigger (1 owner per shop)
- [x] `is_platform_admin()` function
- [x] `mark_booking_no_show` RPC
- [x] `pg_advisory_xact_lock` ป้องกัน race condition
- [x] `slot_capacity` + `daily_limit` backfill ทุกร้าน

---

## สถานะ Production

**`booking.craftbikelab.com`** — ✅ ทำงานได้แล้ว
- Consumer app deploy อยู่บน Vercel
- Subdomain routing ทำงานผ่าน middleware (`x-shop-slug` header)
- Supabase RPC ทำงานได้ (ผ่าน anon key)
- หน้าจองและหน้า success verified แล้ว (V21)

**Admin App** — ทำงานได้ใน local dev (`localhost:3001`), ยังไม่ deploy production

---

## งานที่ค้างอยู่ / Recommended Next Steps

### ลำดับสูง (ทำได้ทันที)

1. **Today Board — filter วันอื่น**
   - เพิ่ม toggle: วันนี้ / พรุ่งนี้ / เลือกวันเอง
   - ตอนนี้ดูได้แค่วันปัจจุบัน

2. **Today Board — no-show action**
   - เพิ่มปุ่ม no-show ใน TodayBoard (ตอนนี้มีแค่ใน BookingsTable)
   - เรียก RPC `mark_booking_no_show` เหมือนกัน

3. **Today Board — copy ข้อความ**
   - copy รายละเอียดคิวสำหรับส่งให้ลูกค้า
   - ใช้ `bookingCopy()` ที่มีอยู่แล้วใน consumer utils (ต้อง port มาฝั่ง admin)

4. **ทดสอบ capacity limits ใน production**
   - ทดสอบจองพร้อมกัน 2 คันในช่วงเวลาเดียวกัน
   - ทดสอบ `daily_limit` เต็มแล้วแสดงว่าเต็ม

### ลำดับกลาง

5. **Platform Control เต็มรูปแบบ**
   - เพิ่มร้านใหม่จาก `/platform` page
   - ผูก owner email กับร้าน
   - suspend / reactivate ร้าน
   - ตอนนี้ `/platform` ดูได้อย่างเดียว (read-only)

6. **Admin app deployment**
   - เพิ่ม `.env.production` และ deploy ขึ้น Vercel
   - ตั้ง domain สำหรับ admin (เช่น `admin.craftbikelab.com`)

### ลำดับต่ำ (future)

7. **Notification system**
   - แจ้ง LINE OA หรือ SMS เมื่อมีคิวใหม่ (admin)
   - แจ้งลูกค้าเมื่อสถานะเปลี่ยน

8. **Multi-shop admin**
   - Admin สามารถดูแลได้หลายร้าน (ตอนนี้ผูก 1 shop ต่อ env var)

---

## ข้อควรระวัง

- **`pg_advisory_xact_lock`** ทำงานเฉพาะใน transaction เดียวกัน — ถ้าเรียก `create_public_booking` นอก transaction อาจไม่ lock ได้ถูกต้อง (RPC ใช้ `begin/commit` อยู่แล้ว ปลอดภัย)
- **`slot_capacity = 1` คือค่า default** — ถ้าร้านต้องการรับพร้อมกันหลายคัน ต้องตั้งค่าใน ScheduleSettings ก่อน
- **`daily_limit = 0` หมายถึงไม่จำกัด** — ต้องตั้งค่า > 0 ถ้าต้องการจำกัด
- **Platform Admin** — ต้องเพิ่ม record ลงใน `platform_users` ด้วย SQL โดยตรงก่อน เพราะยังไม่มี UI สำหรับจัดการ
- **Admin app ยังไม่ได้ filter bookings by shop** — ใช้ `NEXT_PUBLIC_SHOP_ID` env var ดังนั้น 1 instance = 1 shop เท่านั้น
