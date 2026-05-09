# SESSION_NOTES_V50

## สรุป

- ผู้ใช้เจอ error `permission denied for table shops` ตอนกดลบร้านจาก control center
- สาเหตุที่แท้จริงคือ policy มีแล้ว แต่ยังไม่ได้ `GRANT DELETE` บน `bike_booking.shops` ให้ role `authenticated`
- แก้ด้วย migration ใหม่ `20260510000006_allow_authenticated_delete_shops.sql`

## สิ่งที่แก้

- เพิ่ม `grant delete on bike_booking.shops to authenticated;` ใน `supabase/migrations/initial.sql`
- เพิ่ม migration live:
  - `supabase/migrations/20260510000006_allow_authenticated_delete_shops.sql`

## สิ่งที่ต้องทำต่อ

- รัน migration ใหม่ใน Supabase live project
- กลับไปลองลบร้านจาก `control.craftbikelab.com/platform` อีกครั้ง

## ข้อควรระวัง

- อย่าไปแก้ RLS policy ซ้ำโดยไม่จำเป็น เพราะรอบนี้ปัญหาอยู่ที่ table privilege ไม่ใช่ policy
- ลบร้านยังเป็น action เสี่ยง ควร confirm ก่อนกดทุกครั้ง

## ลงชื่อ

- Codex

## ส่งต่อให้ใคร

- Codex เครื่องถัดไป
- ผู้ใช้ที่ดูแล `bike-booking-saas`
