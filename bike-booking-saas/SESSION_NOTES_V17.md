# SESSION NOTES V17 - Platform Admin Seed + Owner Guardrails

วันที่บันทึก: 2 พฤษภาคม 2026  
โปรเจค: `bike-booking-saas`

## งานที่ทำรอบนี้

- เพิ่ม `index.md` เป็นสารบัญกลางของโปรเจค
- อัปเดต `README.md` ให้ระบุที่อยู่โปรเจค, GitHub, production URLs, และ route ` /platform`
- เริ่มวางชั้น `platform admin` ภายใน `booking-admin`
- ล็อกโมเดลสิทธิ์ให้ 1 ร้านมี owner ได้เพียง 1 บัญชี
- เพิ่ม route `/platform` สำหรับดูภาพรวมหลายร้าน
- ปรับ entry flow ของ admin ให้เด้งตาม role:
  - platform admin -> `/platform`
  - shop owner -> `/dashboard`
- ปรับหน้า login ให้กลับไปที่ `/` หลังล็อกอิน เพื่อให้ root route เป็นคนตัดสินใจปลายทาง
- ปรับข้อความหน้า unauthorized ให้เป็นกลาง ใช้ได้ทั้งร้านและ platform

## สิ่งที่เพิ่มในฐานข้อมูล

- สร้าง migration ใหม่:
  - `supabase/migrations/20260502040000_platform_admin_owner_guardrails.sql`
- ใน migration นี้มี:
  - table `bike_booking.platform_users`
  - function `bike_booking.is_platform_admin()`
  - trigger/unique guard ให้ `shop_users` มี owner ได้เพียง 1 คนต่อร้าน
  - RLS policies สำหรับ platform admin

## สถานะการตรวจสอบ

- `npm --prefix apps/booking-admin run lint` ผ่าน
- `npm --prefix apps/booking-admin run build` ผ่าน

## ความเสี่ยง / หมายเหตุ

- migration ใหม่ต้องถูก apply ใน Supabase ก่อน production จะรู้จัก `platform_users`
- ถ้ายังไม่สร้าง user ใน `platform_users` ผู้ใช้จะไม่เข้าหน้า `/platform`
- หน้า `/platform` ยังเป็น shell แรกเริ่มสำหรับคุมหลายร้าน ยังไม่ได้แยกเป็น app ใหม่
- ไฟล์ที่เป็น work-in-progress ของ consumer ฝั่งเดิมยังมีอยู่นอก scope รอบนี้

## งานถัดไป

1. apply migration ใน Supabase
2. สร้าง platform admin account แรก
3. ทดสอบ login -> `/platform`
4. ทดสอบ owner uniqueness ของร้านจริง
5. ค่อยแตกหน้าจัดการร้านใน platform admin เพิ่มเป็นลำดับต่อไป

