# SESSION NOTES V11 - Supabase Hardening Prep

วันที่บันทึก: 2 พฤษภาคม 2026  
โปรเจค: `bike-booking-saas`

## เป้าหมายรอบนี้

เริ่มงานหลัง Phase 4 deployment โดยโฟกัสที่:

1. hardening ฝั่ง Supabase แบบลดความเสี่ยง
2. backup ก่อนแตะจุดเสี่ยง
3. เตรียม migration ใหม่แบบ reversible ก่อน apply ของจริง

## สิ่งที่ทำ

### 1. ทำ backup ก่อนแก้

สร้างโฟลเดอร์ backup:

- `supabase/backups/v11-pre-hardening/`

เก็บไฟล์สำคัญไว้ก่อน:

- `initial.sql.bak`
- `20260501000000_path_a_hardening.sql.bak`
- `README.md` สำหรับอธิบาย snapshot และ intent ของรอบนี้

### 2. ตรวจ advisor ของ Supabase

พบรายการสำคัญ:

#### Security

- `bike_booking.public_booking_slots` ถูกเตือนเรื่อง `SECURITY DEFINER` view
- function พวกนี้ถูกมองว่า callable ผ่าน exposed API schema:
  - `assert_booking_rules()`
  - `is_shop_admin(uuid)`
  - `mark_booking_no_show(uuid)`
  - `sync_customer_stats()`
  - `sync_customer_stats_on_status_change()`
- leaked password protection ยัง disabled

#### Performance

- `bike_booking.shop_users.user_id` ยังไม่มี covering index
- `shop_users` policy ยังใช้ `auth.uid()` แบบที่ linter แนะนำให้ wrap ด้วย `select`
- มีหลาย table ที่ public/admin permissive policies ซ้อนกันจนโดน perf warning

### 3. ตรวจ flow ในแอปก่อนออก migration

ยืนยันจากโค้ดว่า:

- customer app ใช้ `anon` access สำหรับ:
  - `shops`
  - `service_items`
  - `shop_holidays`
  - `public_booking_slots`
  - `bookings.insert`
- admin app ใช้ `authenticated` access สำหรับ:
  - `bookings`
  - `service_items`
  - `shop_holidays`
  - `shops`
  - `shop_users`
  - RPC `mark_booking_no_show`

ดังนั้น V11 migration ถูกออกแบบให้:

- public path ใช้ `anon` ชัดเจน
- admin path ใช้ `authenticated` ชัดเจน
- ลดการที่ anonymous traffic ไปแตะ helper function ฝั่ง admin โดยไม่จำเป็น

### 4. สร้าง migration ใหม่แบบ reversible

ไฟล์ใหม่:

- `supabase/migrations/20260502000000_v11_security_performance_hardening.sql`

สิ่งที่ migration นี้ตั้งใจแก้:

1. ตั้ง `public_booking_slots` ให้เป็น `security_invoker`
2. เพิ่ม index:
   - `idx_shop_users_user_id`
3. revoke execute จาก public/anon/authenticated สำหรับ trigger-only functions:
   - `assert_booking_rules()`
   - `sync_customer_stats()`
   - `sync_customer_stats_on_status_change()`
4. จำกัด `is_shop_admin(uuid)` และ `mark_booking_no_show(uuid)` ให้แคบลง
5. เพิ่ม `is_shop_owner(uuid)` เพื่อแยกสิทธิ์ owner ออกจาก staff
6. เพิ่ม `get_public_booking_confirmation(uuid, uuid)` สำหรับ success page โดยคืนเฉพาะ fields ที่จำเป็น
7. split public/admin policies ให้ชัดขึ้นสำหรับ:
   - `shops`
   - `service_items`
   - `shop_holidays`
   - `bookings`
   - `customers`
   - `shop_users`
8. เปลี่ยน `auth.uid()` ใน `shop_users` policy เป็น:
   - `user_id = (select auth.uid())`

### 5. ตีวงความเสี่ยงใหม่ตาม worker review

worker flag 2 จุดที่เสี่ยงจริงมากที่สุด:

1. anonymous read policy บน full `bookings` rows
2. membership policy ที่ใช้ชื่อ owner แต่ behavior จริงกว้างถึง staff

ดังนั้นรอบนี้จึงปรับแผน V11 ให้ชัดขึ้น:

- หน้า success ไม่ควรอ่าน `bike_booking.bookings` ตรงๆ ผ่าน public select policy อีก
- membership management ต้องแยก owner helper ออกมาต่างหาก

### 6. backup ฝั่งแอปก่อนแก้

สร้าง backup เพิ่ม:

- `supabase/backups/v11-pre-hardening/app-files/success.page.tsx.bak`
- `supabase/backups/v11-pre-hardening/app-files/BookingForm.tsx.bak`
- `supabase/backups/v11-pre-hardening/app-files/types.ts.bak`
- `supabase/backups/v11-pre-hardening/app-files/utils.ts.bak`

### 7. ปรับแอปฝั่ง consumer ให้เตรียมใช้ path ที่แคบลง

แก้ไฟล์:

- `apps/booking-consumer/app/success/page.tsx`
- `apps/booking-consumer/lib/types.ts`
- `apps/booking-consumer/lib/utils.ts`

สิ่งที่เปลี่ยน:

- เพิ่ม type `BookingConfirmation`
- เปลี่ยน success page ให้เตรียมเรียก RPC:
  - `bike_booking.get_public_booking_confirmation`
แทนการ `select * from bookings`

ผล verification:

- `npm --workspace apps/booking-consumer run build` ผ่าน
- `npm --workspace apps/booking-consumer run lint` ผ่าน

## สิ่งที่ยังไม่ได้ทำ

รอบนี้ **ยังไม่ได้ apply migration เข้า Supabase จริง**

เหตุผล:

- เป็นจุดเสี่ยง
- ต้องการ review อีกชั้นก่อน
- รอบนี้ตั้งใจทำ backup + prepare migration ให้แน่นก่อน

## สถานะหลังรอบนี้

สิ่งที่เสร็จแล้ว:

- มี backup ก่อน hardening
- มี advisor snapshot
- มี migration ใหม่สำหรับ V11 hardening
- มี app-side preparation สำหรับตัด full booking exposure ของ success page
- มี reasoning ว่า policy ใหม่ยังควรสอดคล้องกับ customer/admin flows

สิ่งที่ค้าง:

1. review migration V11 อีกชั้น
2. apply เข้า Supabase จริง
3. rerun advisors
4. smoke-test:
   - booking page
   - success page
   - admin no-show / status flows

## ไฟล์ที่เพิ่มในรอบนี้

- `C:\Users\Win10\Documents\mysystems\bike-booking-saas\supabase\backups\v11-pre-hardening\README.md`
- `C:\Users\Win10\Documents\mysystems\bike-booking-saas\supabase\migrations\20260502000000_v11_security_performance_hardening.sql`
- `C:\Users\Win10\Documents\mysystems\bike-booking-saas\SESSION_NOTES_V11.md`

## สรุปสั้น

V11 รอบนี้ยังเป็นการเตรียม hardening แบบปลอดภัย:

- backup ก่อน
- วิเคราะห์ก่อน
- ออก migration ก่อน
- ยังไม่ยิง DB จริง

พร้อมสำหรับรอบถัดไปที่จะ review แล้วค่อย apply แบบมีสติครับ
