# SESSION_NOTES_V51

## สรุปเหตุการณ์รอบนี้

- ทำหน้า `CraftBike Control Center` ให้คุมร้านได้ชัดขึ้น
- เพิ่มข้อมูลร้านระดับบิล:
  - `billing_plan`
  - `billing_due_date`
  - `expires_at`
  - `billing_note`
- เพิ่ม action เร็ว:
  - `trial`
  - `active`
  - `suspended`
  - `cancelled`
- เพิ่ม action ลบร้านจากหน้า control

## ปัญหาที่เจอ

- ตอนกดลบร้านขึ้น error `permission denied for table shops`
- ตรวจพบว่าสาเหตุไม่ใช่ RLS อย่างเดียว แต่เป็น table privilege ที่ live Supabase ยังขาด `DELETE` บน `bike_booking.shops`

## วิธีแก้

- เพิ่ม migration:
  - `supabase/migrations/20260510000006_allow_authenticated_delete_shops.sql`
- เพิ่ม grant ตรงใน schema:
  - `grant delete on bike_booking.shops to authenticated;`
- ผู้ใช้รัน migration/live SQL แล้ว จึงลบร้านได้ตาม flow control ปกติ

## สถานะล่าสุด

- `CraftBike Control Center` เชื่อมกับ Supabase ตรง
- ปุ่มลบร้านใน control ยิงไปที่ `bike_booking.shops` จริง
- โครง cascade ของร้านยังคงใช้ `on delete cascade` ตาม schema เดิม

## commit ล่าสุด

- `69e0494 fix: allow platform admins to delete shops`

## ข้อควรระวัง

- งานลบร้านเป็น action เสี่ยง ต้อง confirm ทุกครั้ง
- ก่อนแตะ production / RLS / privilege ควร backup และเช็ก `git status` ก่อนเสมอ

## ส่งต่อให้ใคร

- Codex เครื่องถัดไป
- เจ้าของระบบ CraftBike

