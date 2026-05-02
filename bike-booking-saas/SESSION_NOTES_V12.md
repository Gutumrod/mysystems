# SESSION NOTES V12 - Production Service Recovery

วันที่บันทึก: 2 พฤษภาคม 2026  
โปรเจค: `bike-booking-saas`

## เป้าหมายรอบนี้

แก้ blocker หลัง deploy ที่หน้า customer ไม่มีรายการบริการให้เลือก ทำให้กดยืนยันการจองไม่ได้

## สิ่งที่พบ

- หน้า production แสดงร้าน `ชื่อร้านจริงของคุณ`
- โค้ดหน้า booking render รายการบริการจาก `services` ตรงๆ
- ปุ่ม submit ถูก disable เมื่อ `durationHours === 0`
- สาเหตุหลักคือร้าน production ที่หน้าเว็บใช้อยู่จริง ไม่มี `service_items` เลย

## การจัดการความเสี่ยง

- สร้าง backup note ก่อนแก้ไว้ที่ `supabase/backups/v12-pre-service-fix/`
- เลือกแก้ที่ data layer ก่อน เพราะกระทบแคบรอบเล็กและ rollback ง่ายกว่าแก้ routing/env

## สิ่งที่ต้องทำต่อ

1. เพิ่ม starter services ให้ shop production ปัจจุบัน
2. ตรวจว่าหน้า booking เริ่มเห็นบริการ
3. สรุปผลและเก็บข้อเสนอถัดไปเรื่องเปลี่ยนข้อมูลร้านจริง

## สิ่งที่ทำจริง

### 1. ยืนยัน root cause

- ตรวจโค้ดแล้วพบว่า `BookingForm` render `services` ตรงๆ
- ปุ่ม submit ถูก disable เมื่อ `durationHours === 0`
- ตรวจฐานข้อมูล production แล้วพบว่า shop id `f9080dd8-9070-473c-9ff9-8e8a636bbdec` ไม่มี `service_items`

### 2. ทำ backup ก่อนแก้

สร้าง backup note ไว้ที่:

- `supabase/backups/v12-pre-service-fix/README.md`

### 3. แก้ข้อมูล production

เพิ่ม starter services ให้ร้าน production ปัจจุบัน:

- `เปลี่ยนน้ำมันเครื่อง` — 1 ชั่วโมง
- `เช็กระยะทั่วไป` — 2 ชั่วโมง
- `ติดตั้งของแต่ง` — 3 ชั่วโมง

### 4. เพิ่ม guard ในโค้ด

แก้ `apps/booking-consumer/components/booking/BookingForm.tsx` ให้:

- ถ้า `services.length === 0` แสดงข้อความเตือนชัดเจน
- ไม่ปล่อยให้หน้าจอว่างจนผู้ใช้ไม่รู้ว่าเกิดอะไรขึ้น

### 5. ตรวจผลหลังแก้

- query DB แล้วยืนยันว่ามี active services 3 รายการสำหรับ shop production ตัวนี้
- fetch `https://booking.craftbikelab.com/` แล้วพบว่าหน้าเว็บ render รายการบริการครบแล้ว
- build และ lint ฝั่ง `apps/booking-consumer` ผ่าน

## สรุปผลรอบนี้

- blocker เรื่อง “ไม่มีบริการให้เลือก” ถูกแก้ที่ production data แล้ว
- หน้า booking จริงมีตัวเลือกบริการกลับมาแล้ว
- ยังเหลือเรื่อง placeholder shop data (`ชื่อร้านจริงของคุณ`) ซึ่งไม่ใช่ blocker ของการจอง แต่ควรแก้ก่อน go-live
