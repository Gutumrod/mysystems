# SESSION_NOTES_V34

## สรุปงานรอบนี้
- เริ่มแก้ข้อ 4: daily booking ต้องไม่ให้เลือกวันสิ้นสุดสั้นกว่าระยะเวลาบริการรวม
- เพิ่ม helper ฝั่งลูกค้าเพื่อคำนวณวันสิ้นสุดขั้นต่ำแบบ inclusive
- เพิ่ม validation ฝั่งฟอร์มและ UI ของลูกค้าให้กัน end date ต่ำกว่าขั้นต่ำ
- เพิ่ม migration ใหม่ฝั่ง Supabase เพื่อบังคับกติกาเดียวกันที่ฐานข้อมูล

## ไฟล์ที่เปลี่ยน
- `apps/booking-consumer/lib/utils.ts`
- `apps/booking-consumer/lib/validations.ts`
- `apps/booking-consumer/components/booking/BookingForm.tsx`
- `apps/booking-consumer/components/booking/DateTimePicker.tsx`
- `supabase/migrations/20260509000000_daily_booking_duration_floor.sql`

## สิ่งที่ต้องทำต่อ
1. รัน migration ใหม่เข้า Supabase live
2. เทส daily booking แบบ:
   - service เดี่ยว 1 วัน
   - service เดี่ยวหลายวัน
   - หลาย service รวมกัน เช่น 5 วัน + 2 วัน
3. เช็กว่าหน้า customer กัน end date สั้นกว่า required days ได้จริง
4. เช็กว่าฝั่ง admin ยังอ่าน booking daily ได้ปกติ

## ข้อควรระวัง
- ถ้า migration ยังไม่ถูก apply เข้า production logic จะยังไม่ถูกบังคับที่ฐาน
- daily bookings ใช้แบบ inclusive end date: start + duration - 1
- ถ้าเลือกบริการรายวันหลายตัว ระบบต้องรวมวันแบบ sum ไม่ใช่ max

## ลงชื่อ
- Codex

