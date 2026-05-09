# Multi-Tenant Scaling Path

อัปเดตล่าสุด: 2026-05-03

เอกสารนี้อธิบายเส้นทางที่ควรพัฒนา Bike Booking SaaS ให้รองรับหลายร้านได้แบบศูนย์กลางเดียว

เป้าหมายคือ:

- มี customer app 1 ตัว
- มี admin app 1 ตัว
- มี database กลาง 1 ชุด
- ร้านใหม่สมัครเข้าใช้ได้โดยไม่ต้องสร้างโปรเจกต์ใหม่
- ร้านใหม่ได้ URL ของตัวเองจาก slug หรือ subdomain

---

## 1. ภาพรวมสถาปัตยกรรมที่ควรเป็น

### สิ่งที่ควรมีเพียงชุดเดียว

- `customer app` deployment เดียว
- `admin app` deployment เดียว
- Supabase project เดียว
- migration ชุดเดียว
- RLS ชุดเดียว

### สิ่งที่แยกร้าน

- `shop_id`
- `slug`
- `shop_users`
- `shop_domains`
- `service_items`
- `shop_holidays`
- `working_hours`

### หลักคิด

ร้านใหม่ไม่ควรเท่ากับ:

- โปรเจกต์ Vercel ใหม่
- ฐานข้อมูลใหม่
- โค้ดเบสใหม่

ร้านใหม่ควรเท่ากับ:

- row ใหม่ใน `shops`
- owner ใหม่ใน `shop_users`
- domain mapping ใหม่
- default service/schedule ใหม่

---

## 2. Path การพัฒนาที่แนะนำ

### Phase A: ปูฐานกลาง

ทำให้ database รองรับ multi-tenant แบบสมบูรณ์ก่อน

- เพิ่มตาราง/คอลัมน์สำหรับ mapping domain
- เพิ่ม flow สำหรับ onboarding ร้าน
- เพิ่ม function สำหรับ provision ร้านใหม่
- เพิ่ม RLS ให้ครบ
- เพิ่ม default data สำหรับร้านใหม่

### Phase B: ทำ onboarding ร้าน

ทำให้การเพิ่มร้านทำได้จาก flow เดียว

- กรอกชื่อร้าน
- กรอก slug
- กรอกข้อมูลติดต่อ
- สร้าง shop row
- สร้าง owner invite
- ผูก owner กับร้าน
- ตั้งค่าเริ่มต้น
- เปิด trial

### Phase C: ทำ routing กลาง

ให้แอปอ่านร้านจาก host หรือ slug

- `kmorackbarcustom.craftbikelab.com`
- `kmorackbarcustom-admin.craftbikelab.com`

### Phase D: ทำ self-service เพิ่มร้าน

ในอนาคตให้ CraftBike Command Center หรือหน้า onboarding สร้างร้านได้เอง

---

## 3. SQL ที่ควรทำครั้งเดียวจบ

SQL ชุดเดียวควรใช้สร้าง foundation ของ multi-tenant เท่านั้น

### ควรอยู่ใน SQL ชุดเดียว

1. สร้างตาราง `shop_domains`
2. สร้างตาราง `shop_invitations`
3. สร้าง function `provision_shop()`
4. สร้าง function ช่วยสร้าง default schedule/service
5. สร้าง trigger ป้องกัน slug ซ้ำ
6. สร้าง RLS policies ที่จำเป็น
7. สร้าง CraftBike Command Center bootstrap
8. สร้าง index ที่ใช้ค้นหา shop จาก domain/slug
9. ตั้งค่า default `trial` flow

### ไม่ควรยัดลง SQL อย่างเดียว

1. สร้าง Supabase Auth user แบบสมบูรณ์
2. ส่งอีเมล invite จริง
3. ผูกโดเมนกับ Vercel อัตโนมัติ
4. Deploy app อัตโนมัติ

งานพวกนี้ควรอยู่ในแอปหรือ automation layer แยกต่างหาก

---

## 4. โครงสร้างฐานข้อมูลที่ควรมี

### `shops`

เก็บข้อมูลหลักของร้าน

- ชื่อร้าน
- slug
- เบอร์
- LINE
- Facebook
- working hours
- subscription status

### `shop_domains`

เก็บ mapping ระหว่างร้านกับโดเมน

ตัวอย่าง:

- `kmorackbarcustom.craftbikelab.com`
- `kmorackbarcustom-admin.craftbikelab.com`

### `shop_users`

เก็บว่าผู้ใช้คนไหนเป็น owner/staff ของร้านไหน

### `shop_invitations`

เก็บสถานะ invite ก่อนผูก owner

### `service_items`

เก็บรายการบริการของร้าน

### `shop_holidays`

เก็บวันหยุดพิเศษ

### `bookings`

เก็บคิวลูกค้า

### `customers`

เก็บสถิติ no-show และ blacklist

---

## 5. Flow สมัครร้านใหม่แบบที่ควรเป็น

### ขั้นตอนฝั่งระบบ

1. รับข้อมูลร้าน
2. ตรวจว่า slug ไม่ซ้ำ
3. สร้าง `shop`
4. สร้าง `shop_domains`
5. สร้าง service เริ่มต้น
6. ตั้ง working hours เริ่มต้น
7. สร้าง invitation สำหรับ owner
8. รอ owner รับ invite / login
9. ผูก `shop_users`
10. เปิด trial

### ขั้นตอนฝั่งผู้ดูแล

1. ใส่ข้อมูลร้าน
2. ส่งลิงก์ให้เจ้าของร้าน
3. ให้เจ้าของร้าน login ครั้งแรก
4. ตรวจว่า URL ใช้งานได้
5. ตรวจว่า admin เห็นข้อมูลร้านของตัวเอง

---

## 6. สิ่งที่ควรทำในแอป ไม่ใช่ใน SQL

### Customer app

- อ่านร้านจาก host / slug
- แสดงข้อมูลร้านที่ตรงกับ subdomain
- ดึงบริการและเวลาว่างของร้านนั้น
- สร้าง booking ผ่าน RPC

### Admin app

- login
- เลือก/ดูร้านที่มีสิทธิ์
- จัดการ booking
- ตั้ง schedule
- จัดการ service
- เปลี่ยนสถานะงาน

### Platform layer

- สร้างร้านใหม่
- ผูก owner
- เปลี่ยนสถานะ trial/active/suspended
- ดูภาพรวมทุก shop

---

## 7. ขั้นตอนที่ควรทำจริงในโปรเจกต์นี้

### Step 1

สร้าง SQL foundation สำหรับ multi-tenant

### Step 2

ทำ onboarding script หรือ function สำหรับสร้างร้านใหม่

### Step 3

ทำหน้าจอ onboarding ร้าน

### Step 4

ให้ customer/admin อ่านร้านจากโดเมน

### Step 5

ทดสอบร้านทดลองหลายร้านพร้อมกัน

### Step 6

ทำ automation เพิ่มร้านแบบ self-service

---

## 8. สิ่งที่ยังควรทำด้วยมือก่อน

1. สร้าง Supabase Auth user ของ owner
2. ตรวจ user id
3. ผูก `shop_users`
4. ผูกโดเมนกับ deployment
5. เทส URL จริง

---

## 9. นิยามความสำเร็จ

ระบบถือว่าพร้อม multi-tenant จริงเมื่อ:

- ร้านใหม่เพิ่มได้โดยไม่ต้องสร้างโปรเจกต์ใหม่
- ร้านใหม่มี URL ของตัวเอง
- owner login ได้
- customer เห็นข้อมูลร้านตัวเองเท่านั้น
- admin เห็นเฉพาะร้านที่ตัวเองมีสิทธิ์
- RLS ป้องกันข้อมูลไขว้ร้านได้
- booking หลายร้านอยู่ร่วมกันในฐานเดียวได้

---

## 10. Roadmap สั้นที่สุด

1. ปูฐาน SQL multi-tenant
2. ทำ onboarding ร้าน
3. ทำ routing กลาง
4. ทำ owner invite
5. ทำ self-service สมัครร้าน
6. ทำ automation หลังบ้าน
