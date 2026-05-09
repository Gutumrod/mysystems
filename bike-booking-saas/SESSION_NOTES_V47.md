# SESSION NOTES V47 - Bootstrap missing platform_users on live Supabase

วันที่บันทึก: 2026-05-10
โปรเจกต์: `bike-booking-saas`

## ปัญหาที่เจอ

- live Supabase ตอบว่า `relation "bike_booking.platform_users" does not exist`
- แปลว่า schema ฝั่ง control/admin ยังไม่ได้สร้างตาราง `platform_users` ในฐาน live

## สิ่งที่เตรียมไว้

- `supabase/migrations/20260510000004_bootstrap_platform_users.sql`

## สิ่งที่ migration นี้ทำ

- สร้าง enum `bike_booking.platform_user_role` ถ้ายังไม่มี
- สร้างตาราง `bike_booking.platform_users`
- สร้าง/อัปเดตฟังก์ชัน `bike_booking.is_platform_admin()`
- เปิด RLS และสร้าง policy ที่จำเป็นสำหรับ control admin
- ย้าย `titazmth@gmail.com` (user id เดิม `54e28e6e-684f-4318-9f32-11809972c5f2`) ออกจาก `shop_users`
- ใส่ user เดิมเข้า `platform_users` เป็น `super_admin`

## หมายเหตุ

- ไม่ลบ `auth.users`
- ถ้ารัน migration นี้ใน Supabase live แล้ว control login ควรเริ่มทำงานได้ตามโครงปัจจุบัน
