# SESSION_NOTES_V54

## สรุป

- เดินต่อ Phase 2 / Phase 4 ของ CraftBike Control Center ให้แน่นขึ้น
- หน้า `/platform` ตอนนี้มี billing history แยกจาก activity log แล้ว
- การต่ออายุร้านบันทึกลง `shop_billing_events` ได้จริง
- control ยังเรียงร้านตาม billing urgency และมี quick extend ต่อ 7 / 30 / 365 วันอยู่
- `initial.sql` ถูกอัปเดตให้รู้จักตาราง billing events สำหรับ install ใหม่ด้วย
- มี blueprint สำหรับ self-service signup ไว้แล้วที่ `docs/SELF_SERVICE_SIGNUP_BLUEPRINT.md`

## สิ่งที่เพิ่ม

- query `shop_billing_events` จาก `/platform`
- props ใหม่ใน `PlatformAdminConsole` สำหรับ billing events
- helper `recordBillingEvent()` และ card "ประวัติบิลล่าสุด"
- `shop_billing_events` table + policy/grant ใน migration และ `initial.sql`

## ผลเทส

- `npm --workspace apps/booking-admin run lint` ผ่าน
- `npm --workspace apps/booking-admin run build` ผ่าน

## commit ล่าสุด

- ยังไม่ commit ตอนบันทึก note นี้

## ข้อควรระวัง

- `shop_billing_events` ต้องรัน migration ใน live Supabase ถ้ายังไม่เคย apply
- quick extend ใช้แนวทางง่ายคือขยาย due date และ expiry พร้อมกัน

## ส่งต่อให้ใคร

- Codex เครื่องถัดไป
- เจ้าของระบบ CraftBike
