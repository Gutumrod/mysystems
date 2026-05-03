# SESSION_NOTES_V23 - Today Work Board

วันที่: 2026-05-03
โปรเจกต์: Bike Booking SaaS

## เป้าหมายรอบนี้

ต่อจาก V22 หลังเช็คหน้าตาและความนิ่งแล้ว เริ่มงานฝั่งร้านที่ทำต่อได้ทันทีโดยไม่ต้องรอการตัดสินใจใหม่:

- เพิ่มหน้า “งานวันนี้” สำหรับใช้งานหน้าร้านจริง
- ให้ร้านดูคิววันนี้แบบเร็วและเปลี่ยนสถานะงานได้จากหน้าเดียว

## สิ่งที่เพิ่ม

### Admin Route ใหม่

- `http://localhost:3001/today`
- เมนูใหม่ใน sidebar/mobile nav:
  - `งานวันนี้`

### Today Board

ไฟล์ใหม่:

- `apps/booking-admin/app/(dashboard)/today/page.tsx`
- `apps/booking-admin/components/today/TodayBoard.tsx`

ความสามารถ:

- แสดงวันที่ปัจจุบันตามระบบ
- แสดง stats:
  - คิวทั้งหมด
  - รอเริ่ม
  - กำลังทำ
  - เสร็จแล้ว
- แสดงลำดับงานวันนี้
- แสดงข้อมูลลูกค้า:
  - เวลา
  - ชื่อ
  - เบอร์โทร
  - รถ
  - บริการ
  - หมายเหตุ
  - สถานะ
- ปุ่มสถานะเร็ว:
  - เริ่มทำ
  - เสร็จ
  - ยกเลิก
- โหลดข้อมูลใหม่ทุก 30 วินาที
- subscribe realtime จาก Supabase table `bookings`

## Verification

- `npm run lint` ผ่าน
- `npm run build` ผ่าน
- Restart dev servers แล้ว
- `http://localhost:3001/today` โหลดได้
- เห็นเมนู `งานวันนี้`
- ไม่มี console error ของ app

ผลหน้าจอ ณ เวลาทดสอบ:

- วันนี้คือ `2026-05-03`
- ไม่มีคิววันนี้ ถูกต้อง เพราะ booking test อยู่ `2026-05-07`

## ไฟล์ที่แก้

- `apps/booking-admin/app/(dashboard)/layout.tsx`
- `apps/booking-admin/app/(dashboard)/today/page.tsx`
- `apps/booking-admin/components/today/TodayBoard.tsx`

## งานถัดไปที่แนะนำ

1. เพิ่มตัวกรองในหน้า `งานวันนี้`:
   - วันนี้
   - พรุ่งนี้
   - เลือกวันที่เอง
2. เพิ่มปุ่ม copy ข้อความสำหรับร้าน:
   - copy รายละเอียดคิว
   - copy ข้อความแจ้งลูกค้า
3. เพิ่ม no-show action ในหน้า `งานวันนี้`
4. ทำ Platform Control:
   - เพิ่มร้าน
   - ผูก owner email
   - ดูสถานะร้าน
   - suspend/cancel ร้าน

## ข้อควรระวัง

- ปุ่มเปลี่ยนสถานะในหน้า `งานวันนี้` เขียนลง Supabase จริง
- ก่อนทดสอบปุ่มกับ booking จริง ควรใช้ booking test หรือร้าน test เท่านั้น
