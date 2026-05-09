# SESSION NOTES V49 - Control center billing, expiry, quick actions, and delete shop

วันที่บันทึก: 2026-05-10
โปรเจกต์: `bike-booking-saas`

## งานที่ทำ

- เพิ่มฟิลด์ร้านสำหรับ billing/expiry
  - `billing_plan`
  - `billing_due_date`
  - `expires_at`
  - `billing_note`
- ยกระดับหน้า `CraftBike Control Center`
  - ดูสถานะร้านได้ชัดขึ้น
  - ดูแพ็กเกจ / ครบจ่าย / หมดอายุได้
  - ตั้งสถานะร้านเร็วได้
  - ลบร้านได้จากหน้า control

## สิ่งที่ control center ทำได้ตอนนี้

- ดูร้านทั้งหมด
- ค้นหาร้านตามชื่อ / slug / UUID / แพ็กเกจ
- ดู booking รวมทุก tenant
- ปรับสถานะร้านเป็น `trial / active / suspended / cancelled`
- กำหนดแพ็กเกจ / วันครบจ่าย / วันหมดอายุ / โน้ตบิล
- ลบร้านพร้อมข้อมูลที่เกี่ยวข้องได้

## SQL / Migration ที่เกี่ยว

- `supabase/migrations/20260510000005_shop_billing_controls.sql`
- `supabase/migrations/20260510000004_bootstrap_platform_users.sql`

## หมายเหตุ

- `control.craftbikelab.com` ยังเป็นศูนย์กลางของ platform admin
- `kmorackbarcustom-admin.craftbikelab.com` เป็นของร้าน KMO ตามเดิม
