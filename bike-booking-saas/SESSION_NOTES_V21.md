# SESSION_NOTES_V21 - Admin Calendar + Booking Test

วันที่: 2026-05-03
โปรเจกต์: Bike Booking SaaS

## สรุปงานรอบนี้

- แก้และยืนยันปัญหา Calendar ฝั่ง Admin ที่ปุ่มก่อนหน้า/ถัดไป/เดือน/สัปดาห์/วันไม่ขยับ
- พบว่าโค้ด Calendar ที่แก้ไว้ทำงานแล้ว แต่ dev server มี cache `.next` เพี้ยน ทำให้ CSS หายและหน้า admin ดูพัง
- หยุด admin dev server แล้ว rename `.next` เป็น `.next.backup-devcache` เพื่อเก็บสำรอง จากนั้น start dev server ใหม่
- เพิ่ม `.next.backup-devcache*` ใน `.gitignore` เพื่อกัน backup cache หลุดเข้า Git
- ทดสอบ booking integration สำเร็จผ่าน Supabase public RPC
- ยืนยัน success page, bookings page, dashboard, และ calendar เห็น booking ทดสอบแล้ว

## Booking ทดสอบที่สร้างไว้

- ร้าน: Bangkok Bike Care
- ลูกค้า: Codex Test
- เบอร์: 0999999994
- รถ: Honda ADV350 (2026)
- บริการ: เช็คสายไฟ
- วันที่: 2026-05-07
- เวลา: 09:00 - 11:00
- Booking ID: `f39521e8-6b5e-403a-960f-70aa03a73150`
- หมายเหตุ: `ทดสอบระบบโดย Codex - ไม่ใช่ลูกค้าจริง`

ยังไม่ได้ลบ booking นี้ เพราะเป็นข้อมูลทดสอบจริงใน Supabase ควรลบ/ยกเลิกเมื่อเจ้าของโปรเจกต์อนุมัติ

## ผลทดสอบ

### Customer / Booking

- หน้า success เปิดได้:
  - `http://localhost:3000/success?id=f39521e8-6b5e-403a-960f-70aa03a73150`
- Success page แสดง:
  - ticket `#BK-F39521E8`
  - เวลา 09:00
  - รถ Honda ADV350 (2026)
  - บริการ เช็คสายไฟ
  - วันที่ 7 May 2026

ข้อสังเกต:
- Browser automation ใน Codex ใส่ค่า `input type=date` ได้ใน DOM แต่ React Hook Form ไม่รับ state จึงไม่เหมาะใช้ยืนยัน flow date picker 100%
- ทดสอบ integration จึงใช้ Supabase public RPC โดยตรงแทน และยืนยันผลผ่านหน้า admin

### Admin / Bookings

- `http://localhost:3001/bookings` เห็นรายการจอง:
  - 2026-05-07
  - 09:00 - 11:00
  - Codex Test
  - Honda ADV350
  - เช็คสายไฟ
  - สถานะ ยืนยันแล้ว

### Admin / Dashboard

- `http://localhost:3001/dashboard` อัปเดตแล้ว:
  - วันนี้: 0
  - สัปดาห์นี้: 1
  - เดือนนี้: 1
- วันนี้ยังเป็น 0 ถูกต้อง เพราะ booking ทดสอบอยู่วันที่ 2026-05-07 ไม่ใช่วันที่ 2026-05-03

### Admin / Calendar

- `http://localhost:3001/calendar` เห็น event:
  - `Codex Test · Honda ADV350`
- ปุ่ม Calendar ใช้งานได้หลัง rebuild cache:
  - ถัดไป: พฤษภาคม 2026 -> มิถุนายน 2026
  - สัปดาห์: เปลี่ยนเป็น week view ได้

## Bug / Incident ที่เจอ

### 1. Admin CSS หายจาก dev server

อาการ:
- หน้า admin ใน browser ดูเหมือน HTML เปล่า พื้นดำ ลิงก์น้ำเงิน ปุ่ม default
- DOM ยังมีข้อมูลครบ แต่ Tailwind/layout ไม่ทำงาน

สาเหตุที่พบ:
- HTML เรียก CSS:
  - `/_next/static/css/app/layout.css?...`
- แต่ dev server ตอบ 404
- ใน `.next/static/css` มีไฟล์ hash คนละชื่อ แปลว่า `.next` cache เพี้ยนหลัง build/HMR

วิธีแก้ที่ใช้:
- หยุด process port 3001
- rename:
  - `.next` -> `.next.backup-devcache`
- start `npm run dev:admin` ใหม่
- ตรวจ CSS ใหม่แล้วพบ:
  - `layout.css` โหลดได้
  - มี Tailwind utilities
  - มี `rbc-calendar`

ข้อควรระวัง:
- ถ้าหน้า dev เพี้ยนหลังแก้หลายรอบ ให้สงสัย `.next` cache ก่อน
- ห้าม commit `.next` หรือ `.next.backup-devcache`

### 2. วันพุธถูกปิดใน settings

ระหว่างทดสอบเลือกวันที่ 2026-05-06 แล้วสร้าง booking ไม่ได้ เพราะร้านปิดวันพุธ

ค่าปัจจุบันของ Bangkok Bike Care:
- ปิดวันจันทร์และวันพุธ
- เปิดอังคาร/พฤหัส/ศุกร์/เสาร์/อาทิตย์ 09:00-19:00

จึงเลือกวันพฤหัส 2026-05-07 แทน

## สถานะ Dev Server

- Customer: `http://localhost:3000` ทำงานอยู่
- Admin: `http://localhost:3001` ทำงานอยู่

## ไฟล์ที่แก้ในรอบนี้

- `.gitignore`
  - เพิ่ม ignore สำหรับ `.next.backup-devcache*`

## Git Status ล่าสุด

- มีการแก้ `.gitignore`
- ยังไม่ได้ commit/push รอบ V21
- `.next.backup-devcache` ถูก ignore แล้ว ไม่ควรขึ้นใน git status

## งานถัดไปที่แนะนำ

1. ให้เจ้าของโปรเจกต์ลองหน้า customer ด้วยมืออีกครั้ง โดยเลือกวันที่ร้านเปิดจริง เช่น 2026-05-07
2. ถ้าจะ cleanup ให้ยกเลิกหรือลบ booking test `f39521e8-6b5e-403a-960f-70aa03a73150` หลังอนุมัติ
3. Commit/push `.gitignore` และ `SESSION_NOTES_V21.md`
4. ต่อด้วยงาน Platform/Admin Control:
   - ระบบเพิ่มร้านใหม่
   - ผูก owner email กับร้าน
   - หน้า control กลางสำหรับเจ้าของ SaaS
   - onboarding checklist สำหรับร้านใหม่
