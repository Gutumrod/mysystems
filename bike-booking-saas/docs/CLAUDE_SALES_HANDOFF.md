# Claude Sales Handoff

เอกสารนี้เตรียมไว้ให้ Claude ใช้สรุปโปรเจกต์ `bike-booking-saas` และทำแผนขายงานต่อ

## Snapshot

- วันที่จัดระบบ: 2026-06-07
- repo หลักบนเครื่องนี้: `C:\Users\Win10\Documents\mysystems\bike-booking-saas`
- branch ที่ควรอ่านเพื่อดูงานที่ตรวจแล้ว: `review-signup-form-v67`
- commit ล่าสุดของ branch นี้: `75667c2 fix: refine signup handoff and review notes`
- GitHub branch: `origin/review-signup-form-v67`
- PR URL: `https://github.com/Gutumrod/mysystems/pull/new/review-signup-form-v67`

## Important Source Status

### Safe reviewed branch

`review-signup-form-v67` คือ branch ที่ Codex ตรวจแล้วและ push แล้ว

สิ่งที่อยู่ใน branch นี้:

- ปรับ UX หน้า signup ให้ชัดขึ้น
- เพิ่ม session notes V66/V67
- เพิ่ม `docs/AGENT_REVIEW_LESSONS.md`
- เพิ่มกติกา review agent ใหม่
- ยืนยันว่า safe signup flow คือ `/signup` -> `signup_requests` -> platform approval

### Risky origin/main

`origin/main` ล่าสุดคือ:

- `ff4a4ab feat(bike-booking-saas): implement dynamic subdomain routing, onboarding UI/DB procedure, and Thai manuals`

commit นี้ยังไม่ควร merge ตรงๆ เพราะเคยตรวจแล้วว่ามี regression:

- ลบ session notes V47-V65
- ลบ migration history สำคัญ
- ลบ/ลด signup/reset/billing/activity/daily holiday features บางส่วน
- platform control ถูก simplify
- onboarding ใช้ internal owner UUID หรือ self-service idea ที่ต้องปรับ
- daily holiday-aware logic มีโอกาสถอยหลัง

## Product Summary

CraftBike Booking SaaS คือระบบ SaaS สำหรับร้านทำงานรถมอเตอร์ไซค์ เช่น:

- ร้านทำแคชบาร์
- ร้านทำแร็คท้าย/แร็คข้าง
- ร้านแต่งรถ
- ร้านซ่อม/ติดตั้งของแต่ง
- ร้านที่ต้องจัดคิวงานหลายวัน

แกนระบบ:

- customer booking page ของแต่ละร้าน
- shop admin ของร้านนั้น
- platform admin / CraftBike Control Center สำหรับเจ้าของระบบ

domain model ที่ตกลงกัน:

- customer: `https://[shop].craftbikelab.com`
- shop admin: `https://[shop]-admin.craftbikelab.com`
- platform admin: `https://control.craftbikelab.com`

## Current Capabilities

### Customer booking

ระบบรองรับ:

- เลือกบริการ
- จองรายชั่วโมง
- จองรายวัน
- งานหลายวัน
- ป้องกันเลือก service hourly/daily ปนกัน
- คำนวณ minimum end date สำหรับงานรายวัน
- มี logic วันหยุดร้าน/วันหยุดพิเศษใน branch ก่อนหน้า
- ส่ง booking เข้า Supabase ผ่าน RPC `create_public_booking`

### Shop admin

ระบบรองรับ:

- dashboard
- งานวันนี้
- รายการจอง
- ปฏิทิน
- จัดการบริการ
- ตั้งค่าเวลาทำการ
- วันหยุดร้าน/วันหยุดพิเศษ
- ดู/แก้ไข booking บางส่วน
- เปลี่ยนสถานะ booking เช่น เริ่มทำ / ทำเสร็จ / ยกเลิก / no-show

### Platform admin

Concept ที่ต้องรักษา:

- CraftBike Control Center
- คุมทุกร้าน
- ดูร้านทั้งหมด
- billing due date
- expiry
- billing plan
- suspend/reactivate
- delete shop
- activity logs
- signup request queue
- approve/reject ร้านใหม่

### Signup/onboarding

flow ที่ถูกต้องตอนนี้:

- ร้านสมัครผ่าน `/signup` บน control domain
- กรอก email, shop name, slug, password, confirm password, phone, note
- ระบบสร้าง/เก็บคำขอใน `signup_requests`
- platform owner ตรวจและอนุมัติ
- เมื่ออนุมัติจึงสร้างร้านและผูก owner

ข้อห้าม:

- ห้ามสร้างร้านทันทีจาก user สมัครเองโดยไม่ผ่าน platform approval
- ห้ามใช้ owner UUID เป็น UX สำหรับร้านจริง

## What Is Ready Enough To Sell As A Demo

เหมาะขาย/เดโมแบบ controlled pilot:

- ระบบจองสำหรับร้านเดียวหรือไม่กี่ร้าน
- demo customer booking flow
- demo shop admin flow
- demo platform owner เห็นร้าน/จัดการร้าน
- demo signup request concept

ยังไม่ควรสัญญาว่า fully automated SaaS production จนกว่าจะ cleanup:

- merge `origin/main` อย่างปลอดภัย
- ตรวจ live Supabase schema เทียบ repo
- ทำ platform billing/expiry flow ให้แน่น
- ทำ onboarding approval flow ให้จบจริง
- ทำ deployment/domain ของ `control.craftbikelab.com` ให้ชัด

## Suggested Sales Angles

### Pain points

- ร้านรับงานหลายวันแล้วคิวชนง่าย
- ลูกค้าทักหลายช่องทาง ทำให้หลุดคิว
- เจ้าของร้านต้องจำเองว่างานไหนเริ่ม/จบวันไหน
- ร้านแต่งรถมีงานรายชั่วโมงและรายวันปนกัน
- วันหยุดร้านทำให้คำนวณวันส่งงานยาก

### Value proposition

- ลูกค้าจองคิวเองได้
- ร้านเห็นคิววันนี้และคิวหลายวัน
- ลดงานตอบแชทซ้ำ
- ลดคิวชน
- แยกร้านแต่ละร้านด้วย subdomain
- เจ้าของแพลตฟอร์มคุมร้านทั้งหมดได้

### Target customers

- ร้านแต่งรถมอเตอร์ไซค์
- ร้านทำแคชบาร์/แร็ค/ของแต่ง
- ร้านติดตั้งอุปกรณ์
- ร้านซ่อมที่มีงานหลายวัน
- community ร้านเล็กที่อยากมีระบบจองแต่ไม่อยากจ้างทำ custom เต็มระบบ

## Suggested Packages For Planning

ตัวเลขให้ Claude ใช้เป็น draft เท่านั้น ต้องให้ผู้ใช้ตัดสินอีกที

### Starter

- สำหรับร้านเดียว
- booking page
- shop admin
- basic services/time settings
- เหมาะกับ pilot

### Pro

- booking hourly/daily
- holidays
- dashboard/today/calendar
- edit booking/status
- support setup domain

### Platform / Franchise

- หลายร้าน
- control center
- billing/expiry/suspend
- signup approval
- activity logs

## Recommended Claude Output

ให้ Claude ทำเอกสาร/คำตอบแยกเป็น:

1. Product summary
2. Current technical status
3. What can be demoed now
4. What must be fixed before selling
5. Sales positioning
6. Target customer groups
7. Package/pricing draft
8. Demo script
9. 7-day action plan
10. Open questions for owner

## Files Claude Should Inspect

- `START_HERE.md`
- `CLAUDE.md`
- `SESSION_NOTES_CURRENT.md`
- `SESSION_NOTES_V67.md`
- `docs/AGENT_REVIEW_LESSONS.md`
- `README.md`
- `MASTER BLUEPRINT - Bike Booking SaaS.md`
- `docs/DOMAIN_STANDARD.md`
- `docs/SELF_SERVICE_SIGNUP_BLUEPRINT.md`
- `apps/booking-consumer/components/booking/BookingForm.tsx`
- `apps/booking-admin/components/auth/PortalSignupForm.tsx`
- `apps/booking-admin/app/platform/page.tsx`
- `apps/booking-admin/components/platform/PlatformAdminConsole.tsx`

## Final Warning

ถ้า Claude จะทำแค่สรุปและแผนขาย:

- ไม่ต้องแก้โค้ด
- ไม่ต้อง pull main
- ไม่ต้องรัน SQL
- ไม่ต้อง deploy

ให้สรุปจาก branch/status ที่มี และบอกความเสี่ยงชัดเจน
