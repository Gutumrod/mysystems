# SESSION NOTES V6 - Bike Booking SaaS

วันที่บันทึก: 1 พฤษภาคม 2026  
โปรเจค: `bike-booking-saas`

## เป้าหมายรอบนี้

ปิด `Phase 3` ให้จบคืนนี้ โดยทำ 3 เรื่องให้ครบ:

1. ตรวจ authenticated admin flow บน browser session ที่ login จริง
2. แก้ปัญหาหน้าตา admin ที่เพี้ยน
3. rerun customer/admin verification แล้วสรุปความพร้อมก่อนเข้า `Phase 4`

## สิ่งที่ทำ

### 1. ใช้ browser session ที่ login จริงเพื่อตรวจ admin

ตรวจผ่าน in-app browser บน session ที่ผู้ใช้ login ค้างไว้แล้ว:

- `http://localhost:3001/dashboard`
- `http://localhost:3001/bookings`
- `http://localhost:3001/calendar`

ผลที่ยืนยันได้:

- admin session ใช้งานได้จริง
- dashboard โหลดข้อมูลจริงได้
- bookings table เห็น booking จริงจาก Supabase
- calendar render ได้จริง

ข้อมูลที่เห็นจริงระหว่างตรวจ:

- สถิติ dashboard:
  - วันนี้ `0`
  - สัปดาห์นี้ `1`
  - เดือนนี้ `2`
- bookings page แสดง booking จริงอย่างน้อย 2 รายการ

### 2. root cause ของหน้า admin เพี้ยน

อาการ:

- หน้า admin กลายเป็นลิงก์ฟ้า/unstyled
- desktop sidebar กับ mobile header โผล่พร้อมกัน

สิ่งที่พบ:

- HTML และข้อมูล render ปกติ
- แต่ stylesheet หลักของ Next ที่หน้า admin อ้างถึง ยิง `404`
- สาเหตุมีแนวโน้มมาจาก pattern การ import CSS ของ `react-big-calendar` ผ่าน `@import` ใน `globals.css` ระดับ app

worker review ช่วยชี้ทางได้ถูกจุดว่า:

- ปัญหาไม่น่าใช่ Tailwind content scan
- ปัญหาอยู่ที่ CSS delivery/order ใน dev มากกว่า

### 3. fix ที่ทำ

ย้าย CSS import ของ `react-big-calendar` ออกจาก `@import` ใน global stylesheet ไปเป็น import ตรงใน root layout

ไฟล์ที่แก้:

- `shop-admin/app/layout.tsx`
- `shop-admin/app/globals.css`

รายละเอียด:

- เพิ่ม `import "react-big-calendar/lib/css/react-big-calendar.css";` ใน layout
- ลบ `@import "react-big-calendar/lib/css/react-big-calendar.css";` ออกจาก `globals.css`

ผล:

- admin styling กลับมาปกติ
- dashboard / bookings / calendar render ได้สวยและอ่านได้จริง

### 4. ยืนยัน data refresh หลังแก้ style

หลัง style กลับมา:

- bookings page แสดง booking `Phase 3 QA`
- booking ดังกล่าวแสดงสถานะ `เสร็จแล้ว` ใน UI

นี่เป็นหลักฐานว่า:

- auth ผ่าน
- server data ผ่าน
- UI render ผ่าน
- สถานะจากฐานข้อมูลไหลมาถึงหน้า admin จริง

### 5. เจอและแก้ dev-server issue ฝั่งลูกค้า

ระหว่าง rerun customer verification พบ error:

`Cannot find module './383.js'`

stack ชี้ไปที่:

- `shop-frontend/.next/server/webpack-runtime.js`
- `shop-frontend/.next/server/app/success/page.js`

ข้อสรุป:

- เป็นอาการ Next.js dev chunk/cache เพี้ยน
- ไม่ใช่ business logic bug

วิธีแก้:

- restart dev server ฝั่ง `shop-frontend`

ผลหลัง restart:

- `http://localhost:3000` กลับมาเปิดได้ปกติ
- `http://localhost:3000/success?id=21ea1e03-192a-4dd3-90bc-a5f483cac7da` เปิดได้ปกติ

## Verification รอบนี้

### Admin

ผ่าน:

- dashboard render ปกติ
- bookings render ปกติ
- calendar render ปกติ
- authenticated session ใช้งานจริง
- booking จริงมองเห็นได้จาก UI
- status `completed` สะท้อนใน UI จริง

หมายเหตุ:

- รอบนี้ยังไม่ได้พิสูจน์การกด modal action button (`เริ่มทำ` / `ทำเสร็จ` / `ไม่มาตามนัด`) ผ่าน browser automation จนสุดทาง
- แต่ data path และ admin read path ถือว่าผ่านแล้ว

### Customer

ผ่าน:

- booking page render ปกติ
- success page render ปกติ
- ไม่มี runtime error หลัง restart dev server

### Static checks

ผ่าน:

- `npm run lint`
- `npm run build`

## ข้อผิดพลาดที่พบใน session นี้

### Error 1: Admin CSS 404 / หน้าเพี้ยน

อาการ:

- หน้า admin ไม่มี style
- desktop/mobile nav แสดงพร้อมกัน

สาเหตุ:

- CSS delivery ใน Next dev มีปัญหาจากการ import `react-big-calendar` ผ่าน `@import` ใน global stylesheet

วิธีแก้:

- ย้าย package CSS import ไปไว้ใน `shop-admin/app/layout.tsx`

สถานะ:

- แก้แล้ว

### Error 2: Frontend runtime `Cannot find module './383.js'`

อาการ:

- หน้า customer เปิดแล้ว runtime error

สาเหตุ:

- Next dev chunk/cache เพี้ยน

วิธีแก้:

- restart `shop-frontend` dev server

สถานะ:

- แก้แล้ว

## สรุปสถานะ Phase

### สรุป Phase 3

ปิด `Phase 3` ได้แล้ว

เหตุผล:

1. customer app เปิดใช้งานได้
2. success page เปิดใช้งานได้
3. admin login จริงใช้งานได้
4. dashboard / bookings / calendar ใช้งานได้
5. styling bug สำคัญถูกแก้แล้ว
6. lint/build ผ่านทั้งสองแอป

## เข้าสู่ Phase 4

จากรอบนี้ถือว่าเริ่ม `Phase 4 - Staging / Deploy Readiness` ได้อย่างเป็นทางการ

## งานถัดไปใน Phase 4

ลำดับที่แนะนำ:

1. จัด environment ให้พร้อม production
   - ตรวจ env vars ของ `shop-frontend`
   - ตรวจ env vars ของ `shop-admin`
   - ยืนยัน shop id / auth user / shop_users mapping

2. ทำ staging verification checklist
   - booking flow บนโดเมนจริง
   - admin login บนโดเมนจริง
   - redirect/auth/cookie behavior
   - mobile QA รอบ staging

3. เตรียม Vercel deployment plan
   - แยก customer project
   - แยก admin project
   - กำหนด subdomain strategy
   - วาง naming convention สำหรับหลายร้าน

4. เตรียม production cleanup
   - แยก test data ออกจากข้อมูลใช้งานจริง
   - ตัดสินใจว่าจะคง test user/booking ไว้หรือเคลียร์ก่อนเปิดจริง

## Worker usage รอบนี้

ใช้งาน worker แบบ balanced ตามที่ตกลง:

- worker ใช้ช่วยสแกน root cause เรื่อง CSS/Tailwind/Next
- ใช้เป็น second opinion
- final decision ยึด browser verification + code จริง

ผลที่ useful:

- worker ช่วยชี้ว่าอาการไม่ได้มาจาก Tailwind purge
- ช่วยยืนยันว่า root issue น่าจะอยู่ที่ CSS delivery/order

## ไฟล์ที่แก้ในรอบนี้

- `C:\Users\Win10\Documents\New project\bike-booking-saas\shop-admin\app\layout.tsx`
- `C:\Users\Win10\Documents\New project\bike-booking-saas\shop-admin\app\globals.css`

## ไฟล์อ้างอิง

- `C:\Users\Win10\Documents\New project\bike-booking-saas\SESSION_NOTES_V6.md`
- `C:\Users\Win10\Documents\New project\bike-booking-saas\logs\dev-shop.log`
- `C:\Users\Win10\Documents\New project\bike-booking-saas\logs\dev-admin.log`
