# SESSION NOTES V16 - Production Stabilization Summary

วันที่บันทึก: 2 พฤษภาคม 2026  
โปรเจค: `bike-booking-saas`

## สถานะล่าสุด

- Customer production: `https://booking.craftbikelab.com` เปิดได้
- Admin login production: `https://booking-admin.craftbikelab.com/login` เปิดได้
- Production ล่าสุดอยู่ที่ commit `6b0d3cc`
- Flow จองใช้งานได้จริง และ dashboard admin เห็น booking update
- DB มี booking production จริงเพิ่มแล้ว

## ปัญหาสำคัญที่เจอและแนวทางแก้

### 1. ไม่มีบริการให้เลือก

สาเหตุ:

- production shop placeholder ไม่มี `service_items`

แก้แล้ว:

- เพิ่ม starter services ให้ shop production
- เพิ่ม guard ฝั่ง form ใน local code ให้แสดงข้อความชัดถ้าไม่มีบริการ

### 2. RLS error ตอนจอง

สาเหตุหลัก:

- flow เดิมใช้ `insert().select("id")`
- หลัง hardening ปิด public select ของ `bookings`
- insert อาจผ่าน แต่การอ่าน row ที่เพิ่ง insert กลับมาโดน RLS block

แก้แล้ว:

- เปลี่ยน flow เป็น RPC-first:
  - `create_public_booking(...)`
  - RPC insert booking และ return booking id
- production bundle มี `create_public_booking` แล้ว

### 3. ไม่มีช่วงเวลาให้เลือก

สาเหตุ:

- `buildTimeSlots` เช็ก booking ทุกวันรวมกัน
- booking ของวันที่อื่นไปบล็อก slot ของวันที่กำลังเลือก

แก้แล้ว:

- commit `6b0d3cc` เพิ่มเงื่อนไข `booking.booking_date !== date`
- production deployment ล่าสุดมี fix นี้แล้ว

### 4. Admin 403 ชั่วคราว

สถานะ:

- ตรวจจากเครื่องมือแล้ว `booking-admin.craftbikelab.com/login` ตอบ `200`
- น่าจะเกี่ยวกับช่วง deployment/cache/browser session มากกว่าระบบล่มถาวร

## Verification ล่าสุด

### Production URL

- Customer URL: `200`
- Admin login URL: `200`

### Safe DB tests with rollback

- จองหลายรายการคนละเวลาในวันเดียวกัน: ผ่าน
- จองเวลาทับกัน: ถูกบล็อกด้วย `เวลานี้มีคนจองแล้ว`
- ใช้ service id ที่ไม่ใช่ของร้าน: ถูกบล็อกด้วย `invalid service items for shop`
- RPC ใช้ได้ทั้ง role `anon` และ `authenticated`

## ข้อควรระวัง

1. ห้ามกลับไปใช้ `insert().select()` ตรงกับ `bookings` จากหน้า customer
2. ถ้าแก้ RLS ต้องทดสอบทั้ง `anon` และ `authenticated`
3. ถ้าแก้ slot logic ต้องทดสอบ booking คนละวันเสมอ
4. production shop ยังเป็น placeholder ต้องเปลี่ยนข้อมูลร้านจริงก่อน go-live
5. local repo ยังมีไฟล์ notes/migrations/backups ที่ยังไม่ได้จัดระเบียบ commit
6. migration history ใน Supabase อาจไม่ตรงกับไฟล์ local เพราะบางรอบใช้ direct SQL/MCP

## Path ถัดไป

### Path A - Stabilize Current Production

1. เปลี่ยน shop placeholder เป็นข้อมูลร้านจริง
2. ตั้งบริการจริงของร้าน
3. ทดสอบ customer booking 3-5 รายการจริง
4. ทดสอบ admin dashboard/bookings/calendar
5. cleanup booking test ที่ไม่ต้องการ

### Path B - Multi-Shop Onboarding

1. สร้าง shop row ใหม่
2. เพิ่ม service_items ของร้านนั้น
3. เพิ่ม shop_users สำหรับ owner/staff
4. deploy/env/domain แยก หรือเปิด tenant routing ด้วย slug
5. ทดสอบว่าแต่ละร้านเห็นข้อมูลแยกกัน

### Path C - Cleanup & Governance

1. จัด migration files ให้ตรงกับ production state
2. commit session notes/backups ที่ควรเก็บ
3. เพิ่ม architecture guardrails เรื่อง RLS/RPC
4. ทำ runbook สำหรับ incident ที่เจอซ้ำ

## คำแนะนำ

เดิน `Path A` ให้จบก่อน แล้วค่อยต่อ `Path B` สำหรับเพิ่มร้านลูกค้าจริง
