# SESSION NOTES V18 - Customer Flow Hardening

วันที่บันทึก: 2 พฤษภาคม 2026  
โปรเจค: `bike-booking-saas`

## เป้าหมายรอบนี้

ปิด bug ฝั่งลูกค้าที่ได้จาก report ของ Claude/Gemini ก่อนกลับไปเดินงานฝั่งร้านและ platform admin ต่อ

## งานที่แก้แล้ว

- หน้า success อ่าน tenant slug จาก `x-shop-slug` เหมือนหน้า booking แล้ว
- หน้า success validate booking id เป็น UUID ก่อนเรียก RPC
- หน้า booking ใช้วันที่แบบ `Asia/Bangkok` สำหรับ `today` และ `limit`
- bottom nav ฝั่ง booking ไม่พาไป `/success` โดยไม่มี booking id แล้ว
- เพิ่ม safe-area handling สำหรับ bottom nav บน iPhone
- หน้า success แสดงเวลาเป็น `HH:mm` แทน `HH:mm:ss`
- เก็บ change ของ Gemini ใน `validations.ts` ที่ normalize เบอร์โทรก่อน validate เพราะเป็น UX improvement ที่มีประโยชน์

## งานฐานข้อมูลที่เพิ่มเป็น migration

- เพิ่ม migration:
  - `supabase/migrations/20260502050000_customer_booking_integrity_hardening.sql`

Migration นี้ทำ 2 เรื่องสำคัญ:

- `assert_booking_rules()` ตรวจเวลาเริ่ม/จบให้อยู่ในเวลาทำการของร้านจริง
- `create_public_booking(...)` ไม่เชื่อ `p_booking_time_end` จาก client แล้ว แต่คำนวณ end time จากผลรวม `duration_hours` ของ service_items ฝั่ง database เอง

เพิ่มด้วย:

- จำกัดจองล่วงหน้าไม่เกิน 45 วัน ให้ตรงกับ customer UI

## Verification

- `npm --prefix apps/booking-consumer run lint` ผ่าน
- `npm --prefix apps/booking-consumer run build` ผ่าน

## ยังไม่ได้ทำ

- ยังไม่ได้ apply migration `20260502050000_customer_booking_integrity_hardening.sql` เข้า Supabase production
- ยังไม่ได้ run integration test กับ Supabase จริงหลัง migration
- ยังไม่ได้เพิ่ม rule รองรับเบอร์ `+66...`

## งานถัดไป

1. backup Supabase ก่อน apply migration
2. apply migration customer booking hardening
3. ทดสอบ RPC:
   - จองในเวลาทำการต้องผ่าน
   - จองนอกเวลาทำการต้องโดนบล็อก
   - ส่ง end time ปลอมต้องถูก ignore และ DB คำนวณใหม่
   - จองเกิน 45 วันต้องโดนบล็อก
4. ทดสอบ customer flow บน production/staging อีกครั้ง

