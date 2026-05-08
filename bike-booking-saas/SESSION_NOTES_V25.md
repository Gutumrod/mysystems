# SESSION_NOTES_V25 - Multi-Tenant Onboarding, Capacity Limits & KMORackBarCustom Bootstrap

วันที่: 2026-05-03
โปรเจกต์: Bike Booking SaaS
ต่อจาก: V24 (Security Hardening, Capacity Limits & Platform Admin)

---

## ภาพรวมของ Session นี้

Session นี้ต่อยอดจาก V24 โดยโฟกัส 3 เรื่องหลัก:

1. เพิ่มความสามารถให้ร้านตั้ง `รับพร้อมกัน` และ `จำกัด/วัน`
2. ทำ onboarding ร้านใหม่ให้พร้อมใช้งานจริง
3. วางทางไปสู่ multi-tenant แบบศูนย์กลางเดียวสำหรับหลายร้าน

---

## สิ่งที่ทำเสร็จแล้ว

### 1) Capacity limits ฝั่งร้านและฝั่งลูกค้า

เพิ่มระบบ capacity ให้ร้านกำหนดเองได้ในหน้า schedule settings:

- `slot_capacity` = จำนวนคิวที่รับพร้อมกันในช่วงเวลาเดียวกัน
- `daily_limit` = จำนวนคิวสูงสุดต่อวัน

การเปลี่ยนแปลงหลัก:

- `apps/booking-admin/components/settings/ScheduleSettings.tsx`
  - เพิ่ม input `รับพร้อมกัน`
  - เพิ่ม input `จำกัด/วัน`
  - normalize ค่าเวลาทำการก่อนบันทึก
- `apps/booking-consumer/lib/utils.ts`
  - คำนวณเวลาแบบคำนึงถึง capacity จริง
  - ปิด slot ที่เกิน capacity ในระดับ UI
- `supabase/migrations/20260503050546_booking_capacity_limits.sql`
  - backfill `working_hours` ให้มี `slot_capacity` และ `daily_limit`
  - เพิ่ม advisory lock กัน race condition
  - อัปเดต trigger `assert_booking_rules()`
  - อัปเดต `create_public_booking()`
- `supabase/migrations/initial.sql`
  - อัปเดต default working hours ให้รองรับฟิลด์ใหม่ตั้งแต่สร้างฐานใหม่

ผลลัพธ์:

- ร้านกำหนดรับงานพร้อมกันหลายคันได้
- ระบบกันจองเกินจริงได้ทั้งฝั่ง UI และฝั่งฐานข้อมูล
- ลอง verify ด้วย query แล้วพบว่า `working_hours` ของร้านมีฟิลด์ใหม่ครบ

### 2) Onboarding ร้านใหม่

สร้างชุดเอกสารและ bootstrap สำหรับร้านใหม่ `KMORackBarCustom`

ไฟล์ที่เพิ่ม:

- `docs/ONBOARDING_KMORACKBARCUSTOM.md`
- `supabase/bootstrap_kmorackbarcustom.sql`
- `docs/MULTI_TENANT_SCALING_PATH.md`

สิ่งที่ทำ:

- บันทึกข้อมูลร้าน `KMORackBarCustom`
- กำหนด URL ฝั่งลูกค้าและฝั่งร้าน
- สรุปสิ่งที่ต้องขอจากร้าน
- สรุปสิ่งที่เราต้องทำก่อนเปิดใช้งาน
- วาง path สำหรับ multi-tenant scale

### 3) Bootstrap ร้านจริงบนฐาน Supabase

รัน bootstrap สำหรับร้าน `KMORackBarCustom` แล้ว:

- สร้าง shop row สำเร็จ
- สร้าง service items เริ่มต้นสำเร็จ
- ตั้งสถานะ `trial`
- ได้ `shop id` จริง:
  - `a20672f2-59a7-4b4f-99da-0065ae98b73d`

service ตั้งต้นที่ถูกสร้าง:

- ตรวจเช็ครถ
- เปลี่ยนน้ำมันเครื่อง
- ติดตั้งของแต่ง

### 4) ผูก owner ของร้าน

สร้าง owner account ใน Supabase Auth แล้วผูกกับร้านสำเร็จ

สิ่งที่ทำ:

- สร้าง/อ้างอิง user สำหรับ `kmowork2017@gmail.com`
- เอา `auth user id` ไปผูกกับ `bike_booking.shop_users`
- ร้านพร้อมสำหรับ login owner

### 5) ปรับ helper สำหรับสร้างร้าน

แก้ `scripts/create-shop.sh` ให้ใช้ schema ที่ถูกต้อง:

- จาก `public.shops`
- เป็น `bike_booking.shops`

### 6) สรุปทางไป multi-tenant แบบศูนย์กลางเดียว

สร้างเอกสารแนวทางว่า:

- customer app ควรมี deployment เดียว
- admin app ควรมี deployment เดียว
- ร้านใหม่ควรเป็น row ใหม่ในฐาน ไม่ใช่โปรเจกต์ใหม่
- slug / host / shop_id ควรเป็นตัวแยกร้าน

---

## ไฟล์ที่เปลี่ยนใน Session นี้

### เพิ่มใหม่

| ไฟล์ | หมายเหตุ |
|------|----------|
| `supabase/migrations/20260503050546_booking_capacity_limits.sql` | capacity limits + advisory lock + backfill |
| `supabase/bootstrap_kmorackbarcustom.sql` | bootstrap ร้าน `KMORackBarCustom` |
| `docs/ONBOARDING_KMORACKBARCUSTOM.md` | คู่มือ onboarding ร้านใหม่ |
| `docs/MULTI_TENANT_SCALING_PATH.md` | path การขยายระบบเป็น multi-tenant |

### แก้ไข

| ไฟล์ | หมายเหตุ |
|------|----------|
| `supabase/migrations/initial.sql` | default working_hours รองรับ capacity fields |
| `apps/booking-admin/components/settings/ScheduleSettings.tsx` | เพิ่มรับพร้อมกัน / จำกัดต่อวัน |
| `apps/booking-admin/lib/types.ts` | WorkingDay รองรับ capacity fields |
| `apps/booking-admin/lib/mock-data.ts` | mock data รองรับ capacity fields |
| `apps/booking-consumer/lib/types.ts` | WorkingDay รองรับ capacity fields |
| `apps/booking-consumer/lib/mock-data.ts` | mock data รองรับ capacity fields |
| `apps/booking-consumer/lib/utils.ts` | logic เวลาและ slot availability ตาม capacity |
| `scripts/create-shop.sh` | แก้ schema ให้ตรงกับ `bike_booking` |

---

## ตรวจสอบและผลลัพธ์

### ผ่าน

- `npm run lint`
- `npm run build`
- `supabase db query --linked` เพื่อตรวจค่า shop และ service
- customer/admin dev server กลับมาทำงานปกติหลัง restart

### ยืนยันจากฐานข้อมูล

- shop `kmorackbarcustom` ถูกสร้างแล้ว
- service items ถูกสร้างครบ
- `subscription_status = trial`
- owner ถูกผูกกับร้านแล้ว

---

## สิ่งที่ยังค้างอยู่

### 1) Deploy ฝั่ง admin ยังไม่จบ

ตอนลองเปิด `kmorackbarcustom-admin.craftbikelab.com` ยังเจอ

- `404: DEPLOYMENT_NOT_FOUND`

แปลว่าโดเมนยังไม่ผูกกับ deployment ที่ใช้งานได้ หรือ admin deployment ยังไม่ได้ขึ้นจริง

### 2) Multi-tenant routing ยังต้องต่อให้ครบ

ตอนนี้แนวทางถูกวางไว้แล้ว แต่ยังต้องทำให้:

- customer app อ่านร้านจาก host/slug แบบกลาง
- admin app ใช้ deployment เดียวแล้วเลือก shop ตามสิทธิ์
- ร้านใหม่ไม่ต้องสร้าง deployment ใหม่

### 3) Owner onboarding ยังต้องทำต่อ

สิ่งที่ควรทำต่อในขั้นถัดไป:

- สร้าง auth user แบบเป็นระบบ
- ผูก owner อัตโนมัติหรือกึ่งอัตโนมัติ
- เชื่อม flow onboarding เข้ากับหน้า platform

---

## ข้อควรระวัง

- อย่าใช้รหัสผ่านเริ่มต้นที่เดาง่ายใน account ถาวร
- อย่าผูก domain ต่อร้านแบบ manual ทุกครั้ง ถ้าตั้งใจจะ scale หลายร้าน
- ตอนนี้ฐานข้อมูลพร้อม multi-tenant มากขึ้นแล้ว แต่ deployment flow ยังต้องจัดให้เป็นศูนย์กลาง
- ถ้าจะเปิดร้านใหม่ในอนาคต ควรเริ่มจาก onboarding flow เดียว ไม่ใช่ทำด้วยมือหลายจุด

---

## สรุปสถานะ ณ ตอนนี้

- ระบบ booking หลักพร้อมใช้มากขึ้น
- capacity limits ใช้งานได้แล้ว
- ร้าน `KMORackBarCustom` ถูก bootstrap แล้ว
- owner ถูกผูกแล้ว
- เอกสาร onboarding และ multi-tenant path ถูกเตรียมไว้
- ขั้นใหญ่ต่อไปคือทำให้ onboarding และ routing เป็นศูนย์กลางจริง

