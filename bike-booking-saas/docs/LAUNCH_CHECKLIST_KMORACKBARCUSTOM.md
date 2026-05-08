# Launch Checklist - KMORackBarCustom

ใช้ไฟล์นี้เช็กก่อนปล่อยร้าน `KMORackBarCustom` ให้ใช้งานจริง

อัปเดตล่าสุด: 2026-05-04

---

## 1) Domain / Deploy

- [ ] `kmorackbarcustom.craftbikelab.com` เปิดได้จริง
- [ ] `kmorackbarcustom-admin.craftbikelab.com` เปิดได้จริง
- [ ] DNS ของ customer ชี้ไป Vercel ถูกต้อง
- [ ] DNS ของ admin ชี้ไป Vercel ถูกต้อง
- [ ] ไม่มี `DEPLOYMENT_NOT_FOUND`
- [ ] Vercel deployment ล่าสุดผ่าน build แล้ว
- [ ] Environment variables ฝั่ง customer ถูกตั้งครบ
- [ ] Environment variables ฝั่ง admin ถูกตั้งครบ
- [ ] ไม่มี error เรื่อง missing Supabase env

## 2) Supabase / Database

- [ ] `shop` ของ KMO มีอยู่ใน schema `bike_booking`
- [ ] `subscription_status` เป็นค่าที่ต้องใช้จริง เช่น `trial` หรือ `active`
- [ ] owner account ของ `kmowork2017@gmail.com` สร้างแล้ว
- [ ] owner ถูกผูกกับ `bike_booking.shop_users` แล้ว
- [ ] `service_items` มีอย่างน้อย 1-3 รายการ
- [ ] `working_hours` ตั้งครบ 7 วัน
- [ ] `slot_capacity` ตั้งตามที่ร้านรับได้จริง
- [ ] `daily_limit` ตั้งตามที่ร้านรับได้จริง
- [ ] วันหยุดประจำตั้งครบ
- [ ] วันหยุดพิเศษตั้งครบ
- [ ] RLS เปิดครบทุกตารางสำคัญ
- [ ] public read policies สำหรับ customer ใช้งานได้
- [ ] public insert booking ใช้งานได้
- [ ] admin read/write จำกัดเฉพาะร้านตัวเอง

## 3) Customer Flow

- [ ] หน้า customer โหลดข้อมูลร้านถูกต้อง
- [ ] ชื่อร้าน เบอร์ LINE และ Facebook แสดงถูก
- [ ] เลือกบริการได้
- [ ] ช่องหมายเหตุเพิ่มเติมใช้งานได้
- [ ] เลือกวันที่ไม่ได้ย้อนหลัง
- [ ] วันหยุดถูกบล็อก
- [ ] เลือกเวลาได้เฉพาะ slot ว่าง
- [ ] booking หลายรายการในช่วงเวลาเดียวกันไม่เกิน capacity
- [ ] จองสำเร็จแล้วไปหน้า success ได้
- [ ] ข้อความ copy booking ถูกต้อง
- [ ] booking ที่จองใหม่โผล่ใน admin

## 4) Admin Flow

- [ ] login แอดมินด้วย owner ได้
- [ ] เห็นเฉพาะร้านของตัวเอง
- [ ] dashboard แสดงคิววันนี้
- [ ] ปฏิทิน Month / Week / Day ใช้งานได้
- [ ] หน้า bookings ค้นหาและกรองได้
- [ ] หน้า services เพิ่ม / แก้ / ลบ ได้
- [ ] หน้า settings shop แก้ข้อมูลร้านได้
- [ ] หน้า settings schedule แก้เวลาทำการได้
- [ ] หน้า settings schedule แก้ capacity ได้
- [ ] หน้า today ใช้งานหน้างานจริงได้
- [ ] สถานะ booking เปลี่ยนได้
- [ ] real-time / auto refresh ทำงาน

## 5) Business Rules

- [ ] จองซ้ำเวลาชนกันถูกกันไว้
- [ ] จองวันหยุดถูกกันไว้
- [ ] จองวันย้อนหลังถูกกันไว้
- [ ] no-show ถูกนับถูกต้อง
- [ ] ลูกค้าที่ blacklist แล้วถูกบล็อกถูกต้อง
- [ ] ลบบริการที่มี booking ใช้งานอยู่ไม่ได้
- [ ] ซ่อนบริการแล้วไม่โผล่ฝั่งลูกค้า

## 6) Data / Safety

- [ ] สำรอง SQL / migration ล่าสุดไว้แล้ว
- [ ] มี session note ล่าสุดบันทึกงานรอบนี้แล้ว
- [ ] ไม่มี secret หรือ service role หลุดในไฟล์ที่ commit
- [ ] ไม่มี env file ถูก commit
- [ ] มีไฟล์ rollback หรือ backup สำหรับจุดเสี่ยง

## 7) Device / UX

- [ ] เปิดบนมือถือแล้วไม่พัง
- [ ] ปุ่มกดง่ายบนจอเล็ก
- [ ] ฟอร์มจองกรอกครบได้ในมือถือ
- [ ] หน้า admin ใช้งานได้บนจอ laptop
- [ ] ไม่มีข้อความล้นหรือชนกัน
- [ ] ไม่มี console error ใหญ่

## 8) Smoke Test ที่ควรทำก่อนเปิดจริง

1. เปิด customer URL
2. เลือกบริการ 1-2 รายการ
3. จองจริง 1 รายการ
4. เปิด admin URL
5. login owner
6. ตรวจว่า booking โผล่
7. เปลี่ยนสถานะ booking 1 ครั้ง
8. ทดสอบจองซ้ำอีก 1 รายการใน slot เดิม
9. ทดสอบวันหยุด / วันย้อนหลัง
10. สรุปผลว่าเปิดใช้งานได้จริงหรือยัง

## 9) สิ่งที่ต้องเตรียมจากร้านก่อน go-live

- [ ] ชื่อร้านสุดท้าย
- [ ] เบอร์โทรสุดท้าย
- [ ] LINE ID
- [ ] Facebook URL
- [ ] เวลาทำการจริง
- [ ] วันหยุดประจำ
- [ ] วันหยุดพิเศษ
- [ ] รายการบริการเริ่มต้น
- [ ] คนรับผิดชอบร้านจริง
- [ ] ช่องทางติดต่อฉุกเฉิน

## 10) เกณฑ์ผ่าน

ร้าน `KMORackBarCustom` ถือว่าใช้งานจริงได้เมื่อ:

- [ ] customer URL เปิดและจองได้
- [ ] admin URL เปิดและจัดการ booking ได้
- [ ] owner login ได้
- [ ] booking sync เข้าฐานและโผล่ใน admin
- [ ] capacity / business rules ทำงานถูก
- [ ] ไม่มี error สำคัญระหว่างทดสอบ

