# SESSION NOTES V19 - Customer Hardening Production Apply

วันที่บันทึก: 2 พฤษภาคม 2026
โปรเจค: `bike-booking-saas`

## เป้าหมายรอบนี้

Apply migration ฝั่ง customer hardening เข้า Supabase production โดยต้อง backup ก่อนเสมอ

## สิ่งที่เช็กแล้ว

- Supabase project ถูกต้อง:
  - `craftbikelab-saas-hub`
  - project ref: `gsbbkdppaegrttcqmjuq`
  - status: `ACTIVE_HEALTHY`
- ไฟล์ migration ที่จะ apply มีอยู่:
  - `supabase/migrations/20260502050000_customer_booking_integrity_hardening.sql`
- `npx supabase` ใช้งานได้ เวอร์ชัน `2.98.0`

## Backup

สร้าง backup ก่อน apply สำเร็จที่:

- `supabase/backups/v19-pre-customer-hardening-production-20260502-2356/`

ไฟล์สำคัญใน backup:

- `functions_before.json`
- `policies_before.json`
- `metadata.json`
- `migration_history_before_repair.json`
- `verify_customer_hardening_rollback.json`
- `verify_no_test_rows_persisted.json`
- `migration_list_after_repair.txt`

Backup ครอบคลุม:

- `bike_booking.assert_booking_rules()`
- `bike_booking.create_public_booking(...)`
- RLS policies ของตารางหลัก
- migration history ก่อน repair

## งานที่ทำแล้ว

- Apply migration:
  - `20260502050000_customer_booking_integrity_hardening.sql`
- Mark migration history:
  - `20260502050000` ถูก mark เป็น applied แล้ว

Migration นี้ทำให้ production DB:

- `assert_booking_rules()` บล็อกเวลานอกเวลาทำการจริงของร้าน
- `assert_booking_rules()` บล็อกการจองเกิน 45 วัน
- `create_public_booking(...)` ไม่เชื่อ `booking_time_end` จาก client แล้ว แต่คำนวณจาก service duration ฝั่ง database

## Verification

ผ่านทั้งหมด:

- function marker:
  - มีข้อความ guard นอกเวลาทำการ
  - มีข้อความ guard 45 วัน
  - มี logic `make_interval(hours => v_duration_hours)`
- rollback integration test:
  - หา free slot ได้: `2026-05-04 09:00`
  - valid booking ผ่านใน transaction
  - DB คำนวณ end time เอง: `09:00` -> `10:00`
  - double booking ถูกบล็อก
  - outside working hours ถูกบล็อก
  - booking เกิน 45 วันถูกบล็อก
- ตรวจหลัง rollback:
  - test booking คงค้างใน production = `0`

## หมายเหตุความปลอดภัย

- ไม่มีการเปิดเผย token/secret ลง repo
- ใช้ Supabase Access Token ผ่าน local CLI login เท่านั้น
- ไม่ใช้ `service_role` ในการ login CLI
- มี backup ก่อน replace function production

## ข้อควรระวังต่อ

- `migration list` ยังมี local/remote mismatch จาก migration รุ่นก่อนหน้าอยู่หลายตัว ไม่ควร `db push` แบบกว้าง ๆ โดยไม่ตรวจ diff ก่อน
- รอบนี้ mark เฉพาะ `20260502050000` เพราะเป็น migration ที่ apply ในรอบนี้จริง
- ยังไม่ได้เพิ่ม rule รองรับเบอร์ `+66...`
- ยังไม่ได้ทดสอบ browser production หลัง DB hardening รอบนี้
