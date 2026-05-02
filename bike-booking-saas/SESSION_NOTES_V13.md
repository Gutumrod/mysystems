# SESSION NOTES V13 - Booking Insert RLS Fix

วันที่บันทึก: 2 พฤษภาคม 2026  
โปรเจค: `bike-booking-saas`

## เป้าหมายรอบนี้

แก้ปัญหา production customer flow ที่กดยืนยันจองแล้วโดน RLS block

## อาการที่พบ

- ผู้ใช้เลือกบริการและกรอกฟอร์มครบแล้ว
- ตอนกดยืนยันจองขึ้นข้อความ:
  `new row violates row-level security policy for table "bookings"`

## Root Cause

- policy `Public can create bookings for active shops` เปิดสิทธิ์ `INSERT` ให้เฉพาะ role `anon`
- ถ้า browser/session กลายเป็น `authenticated` จะไม่มี insert policy รองรับ
- payload ยังต้องผ่านเงื่อนไขตรวจร้าน, status, และ service items เหมือนเดิม

## แผนแก้

1. backup note ก่อนแตะ policy
2. เพิ่ม policy ใหม่สำหรับ `authenticated`
3. ใช้เงื่อนไขเดียวกับ public booking insert policy
4. ตรวจผลหลังแก้

## สิ่งที่ทำจริง

### 1. ทำ backup note

- `supabase/backups/v13-pre-booking-insert-fix/README.md`

### 2. เพิ่ม policy ของจริงใน production

เพิ่ม policy:

- `Authenticated users can create bookings for active shops`

โดยใช้เงื่อนไขเดียวกับ public insert policy เดิมทั้งหมด:

- `status = confirmed`
- shop ต้องอยู่ในสถานะ `trial` หรือ `active`
- ต้องมี `service_items`
- จำนวน service อยู่ในช่วงที่กำหนด
- service ทุกตัวต้องเป็นของร้านเดียวกันและ active

### 3. ตรวจผลหลังแก้

- query `pg_policies` แล้วยืนยันว่า policy ใหม่นี้ถูกสร้างใน production แล้ว
- consumer app build ผ่าน

## สรุปผลรอบนี้

- production booking flow ไม่ควรโดน block ด้วย RLS ตอน role เป็น `authenticated` แล้ว
- จุดถัดไปคือให้ทดสอบกดจองใหม่จริง 1 รอบ
