# SESSION NOTES V48 - Platform control can update shop status

วันที่บันทึก: 2026-05-10
โปรเจกต์: `bike-booking-saas`

## งานที่ทำ

- ตรวจให้แน่ใจว่า live Supabase มี `bike_booking.platform_users` แล้ว
- ย้าย `titazmth@gmail.com` ออกจาก test shop membership
- ผูก user เดิมเข้า `bike_booking.platform_users` เป็น `super_admin`
- เพิ่ม control บนหน้า `CraftBike Control Center` ให้เปลี่ยนสถานะร้านได้

## สิ่งที่ control center ทำได้แล้ว

- ดูร้านทั้งหมด
- ค้นหาทุกร้านตามชื่อ / slug / UUID
- ดู booking รวมทุก tenant
- เลือกสถานะร้าน `trial / active / suspended / cancelled`
- บันทึกสถานะร้านจากหน้า platform ได้

## SQL / Migration ที่เกี่ยว

- `supabase/migrations/20260510000003_transfer_titazmth_to_platform.sql`
- `supabase/migrations/20260510000004_bootstrap_platform_users.sql`

## หมายเหตุ

- ไม่ลบ `auth.users`
- platform admin ใช้โดเมนกลาง `control.craftbikelab.com`
- shop admin แยกตามแต่ละร้านเหมือนเดิม
