# SESSION NOTES V14 - Authenticated Public Read Fix

วันที่บันทึก: 2 พฤษภาคม 2026  
โปรเจค: `bike-booking-saas`

## เป้าหมายรอบนี้

แก้ผลข้างเคียงของ V11/V13 ที่ทำให้ customer session แบบ `authenticated` ยังจองไม่ได้

## Root Cause

- `bookings` insert policy ของ role `authenticated` มีอยู่แล้ว
- แต่เงื่อนไขใน policy ต้องอ้าง `shops` และ `service_items`
- ตารางเหล่านี้เปิด public read ให้แค่ `anon`
- เมื่อ request มาใน role `authenticated` subquery ภายใน policy จึงมองไม่เห็น row ที่ใช้ตรวจเงื่อนไข

## แผนแก้

1. backup note ก่อนแก้
2. เพิ่ม public-equivalent select policies ให้ role `authenticated`
3. ใช้กับ `shops`, `service_items`, `shop_holidays`
4. ทดสอบ flow จองอีกครั้ง

## สิ่งที่ทำจริง

### 1. ทำ backup note

- `supabase/backups/v14-pre-public-read-fix/README.md`

### 2. เพิ่ม policy ของจริงใน production

เพิ่ม select policies สำหรับ role `authenticated`:

- `Authenticated users can read active shops`
- `Authenticated users can read active services`
- `Authenticated users can read active shop holidays`

### 3. ตรวจผลหลังแก้

- query `pg_policies` แล้วยืนยันว่า policy ใหม่ขึ้นครบ
- ยืนยันว่า `Authenticated users can create bookings for active shops` ยังอยู่
- consumer lint ผ่าน

## สรุปผลรอบนี้

- read path ที่หน้า customer และ booking insert policy ต้องพึ่ง ถูกเปิดให้ `authenticated` แล้ว
- จุดถัดไปคือให้ทดสอบกดจองใหม่จริงอีก 1 รอบ
