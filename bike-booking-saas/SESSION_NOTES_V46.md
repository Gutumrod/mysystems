# SESSION NOTES V46 - Transfer old test owner to platform admin

วันที่บันทึก: 2026-05-10
โปรเจกต์: `bike-booking-saas`

## งานที่ทำ

- ตรวจแล้วว่า `titazmth@gmail.com` เคยถูกใช้เป็น owner ของร้าน test เก่า
- ตัดความผูกกับ `bike_booking.shop_users` ออก
- เตรียมผูก user เดิมเข้า `bike_booking.platform_users` เพื่อใช้เป็น owner/control admin

## SQL ที่เตรียมไว้

- `supabase/migrations/20260510000003_transfer_titazmth_to_platform.sql`

## หมายเหตุ

- ไม่ลบ `auth.users`
- ถ้าจะใช้เมลนี้กับ `control.craftbikelab.com/login` ให้รัน migration นี้ใน Supabase live
- ถ้าต้องการให้เมลนี้กลับไปเป็น owner ร้าน ต้องเพิ่ม `shop_users` ใหม่ภายหลัง
