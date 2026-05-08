# KMORackBarCustom Onboarding

อัปเดตล่าสุด: 2026-05-03

## ข้อมูลร้าน

- ชื่อร้าน: `KMORackBarCustom`
- Customer URL: `kmorackbarcustom.craftbikelab.com`
- Admin URL: `kmorackbarcustom-admin.craftbikelab.com`
- โทร: `0625893189`
- Facebook: `https://www.facebook.com/Kmo4307`
- Owner email: `kmowork2017@gmail.com`
- Shop ID ที่สร้างแล้ว: `a20672f2-59a7-4b4f-99da-0065ae98b73d`
- สถานะร้าน: `trial`

## แนวทางรหัสผ่าน

- ไม่แนะนำให้ใช้รหัสผ่านเริ่มต้นที่เดาง่ายเช่น `123456789`
- ทางที่ดีกว่า:
  - สร้างรหัสผ่านชั่วคราวแบบสุ่ม
  - บังคับให้เปลี่ยนรหัสผ่านทันทีหลัง login ครั้งแรก
  - ส่งรหัสผ่านผ่านช่องทางส่วนตัวเท่านั้น

## สิ่งที่ต้องขอจากร้าน

1. ชื่อร้านที่ต้องการให้แสดงบนหน้าเว็บ
2. โดเมน/slug ที่ต้องการใช้จริง หากไม่ใช้ตัวนี้
3. LINE ID ของร้าน
4. เวลาทำการของแต่ละวัน
5. วันหยุดประจำ
6. วันหยุดพิเศษในช่วงทดลอง
7. รายการบริการเริ่มต้นอย่างน้อย 1-3 รายการ
8. ผู้รับผิดชอบร้าน 1 คนสำหรับทดลองใช้งาน
9. ข้อตกลงการทดลองใช้งาน 1 สัปดาห์
10. ช่องทางติดต่อหลักเมื่อเกิดปัญหา

## สิ่งที่เราต้องทำ

1. สร้าง `shop` ใหม่ใน schema `bike_booking`
2. สร้าง `service_items` เริ่มต้นของร้าน
3. ตั้ง `working_hours` และวันหยุดเริ่มต้น
4. สร้างบัญชีแอดมินของเจ้าของร้านจาก email ที่ให้มา
5. ผูก `shop_users` ให้ owner เข้าร้านนี้ได้
6. ตั้ง `subscription_status = trial`
7. เช็กว่า customer/admin URL เปิดได้
8. เทสจองจริง 1 รอบ
9. เทส login แอดมิน 1 รอบ
10. บันทึกผลการทดลองใช้งานเป็น session note

## ถ้ายังไม่มี Super Admin Platform

- ให้ทำแบบ manual ใน Supabase SQL Editor
- ให้ใช้ `shop_users` ผูก owner กับร้านทีละร้าน
- ให้เก็บ mapping ร้านกับ domain ไว้ในโน้ต/สเปรดชีตชั่วคราว
- เมื่อพร้อมค่อยย้ายไปทำ platform admin แบบรวมศูนย์

## ลำดับงานแนะนำ

1. รัน `[supabase/bootstrap_kmorackbarcustom.sql](/C:/Users/Win10/Documents/mysystems/bike-booking-saas/supabase/bootstrap_kmorackbarcustom.sql)` เพื่อสร้าง shop + services + schedule เริ่มต้น
2. ไปที่ Supabase Auth แล้วสร้าง/invite user สำหรับ `kmowork2017@gmail.com`
3. เอา `auth user id` ที่ได้ไปผูกกับร้านใน `bike_booking.shop_users`
4. ตรวจว่า subdomain ชี้มาที่โปรเจกต์นี้แล้ว
5. เปิด `kmorackbarcustom.craftbikelab.com` เทส customer
6. เปิด `kmorackbarcustom-admin.craftbikelab.com` เทส admin
7. ลองจองจริง 1 รายการ
8. ลองเปลี่ยนสถานะใน admin
9. สรุปสิ่งที่ต้องแก้ก่อนเริ่มใช้งานจริง

## SQL Template

> ไฟล์ `supabase/bootstrap_kmorackbarcustom.sql` จะสร้าง shop กับ service ตั้งต้นให้ครบ
> owner account ต้องสร้างใน Supabase Auth ก่อน แล้วค่อยเอา `user id` ไปผูก `shop_users`

```sql
select id, slug, name
from bike_booking.shops
where slug = 'kmorackbarcustom';

insert into bike_booking.shop_users (shop_id, user_id, role)
values (
  'a20672f2-59a7-4b4f-99da-0065ae98b73d',
  '05ab5bc6-2b7d-42fa-b5a9-3338e6a66e1b',
  'owner'
)
on conflict (shop_id, user_id) do update
set role = excluded.role;
```

### วิธีสร้าง owner account แบบสั้น

1. เข้า Supabase Dashboard
2. ไปที่ `Authentication` -> `Users`
3. กด `Add user` หรือ `Invite user`
4. ใส่อีเมล `kmowork2017@gmail.com`
5. ตั้งรหัสผ่านชั่วคราวหรือส่ง invite
6. เปิด user ที่สร้างแล้ว แล้ว copy `User ID`
7. นำ `User ID` ไปผูกกับ shop ใน SQL Editor

### ผลลัพธ์ที่คาดหวัง

- owner จะ login เข้า `kmorackbarcustom-admin.craftbikelab.com` ได้
- ร้านจะถูกผูกกับบัญชีนั้นเรียบร้อย

## ขั้นตอน Onboard แบบสั้นที่สุด

1. รัน bootstrap SQL
2. สร้าง owner ใน Supabase Auth
3. เอา user id มาผูก `shop_users`
4. เช็ก customer/admin URL
5. ทดลองจอง 1 ครั้ง
6. ทดลอง login แอดมิน 1 ครั้ง
7. เก็บผลไว้ใน session note

## สถานะล่าสุด

- [x] shop row ถูกสร้างแล้ว
- [x] service ตั้งต้นถูกสร้างแล้ว
- [x] owner auth account ถูกสร้างแล้ว
- [x] owner ถูกผูกกับ `shop_users` แล้ว
- [ ] customer/admin URL ยังต้องเทสกับ owner จริง

## เช็กลิสต์ทดลอง 1 สัปดาห์

- [ ] เปิด customer URL ได้
- [ ] เปิด admin URL ได้
- [ ] login เจ้าของร้านได้
- [ ] เพิ่ม booking ใหม่ได้
- [ ] รายการ booking โผล่ใน admin
- [ ] เปลี่ยนสถานะงานได้
- [ ] ตั้งเวลา/วันหยุดได้
- [ ] service items แก้ไขได้
- [ ] booking หลายคิวต่อช่วงเวลาไม่ชนกันเกิน capacity
- [ ] daily limit ทำงานตามที่ตั้ง
- [ ] สรุปปัญหาและสิ่งที่ต้องแก้หลังจบทดลอง
