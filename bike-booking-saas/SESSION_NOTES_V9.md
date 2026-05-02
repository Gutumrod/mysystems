# SESSION NOTES V9 - Phase 4 Runtime Alignment

วันที่บันทึก: 1 พฤษภาคม 2026  
โปรเจค: `bike-booking-saas`

## เป้าหมายรอบนี้

ขยับ Phase 4 ต่อจาก V8 โดยโฟกัสที่ของจริงบน Vercel และความสอดคล้องของ consumer routing:

1. ตรวจสถานะ Vercel project/deployments จริง
2. ยืนยัน root cause ของ deploy/runtime issue ล่าสุด
3. แก้ consumer hostname routing ให้ตรงกับโดเมนที่วางแผนไว้
4. ทำให้ docs/env guidance ตรงกับพฤติกรรมจริงของระบบ

## สิ่งที่ทำ

### 1. ใช้ worker review เพิ่ม

ใช้ worker แบบ balanced เพื่อสแกน deploy readiness อีกชั้น

สิ่งที่ worker flag ได้ถูกต้อง:

- consumer domain strategy กับ middleware ไม่ตรงกัน
- `.env.production.example` ของ consumer ขัดกับ `DEPLOY_PLAN.md`
- `DEPLOY_PLAN.md` ยังมีคำอธิบาย `outputFileTracingRoot` เก่า
- `SUPABASE_SERVICE_ROLE_KEY` ถูกอธิบายเหมือนเป็นของจำเป็น ทั้งที่โค้ดตอนนี้ยังไม่ได้ใช้จริง

### 2. ตรวจ Vercel ของจริง

ยืนยันแล้วว่าบน team:

- `team_rdPAt9hlvE3YmKS71wGy4jfx`

มี project:

- `craftbikelab-booking`

และพบข้อเท็จจริงสำคัญ:

- deployment เก่าบางตัวพังด้วย error:
  - `Cannot find module 'next/dist/compiled/next-server/server.runtime.prod.js'`
- แต่ deployment ที่ build จาก commit
  - `fix: correct outputFileTracingRoot for Vercel repo root`
  กลับขึ้น `READY` สำเร็จแล้ว

สรุป:

- blocker เรื่อง `server.runtime.prod.js` ฝั่ง consumer ไม่ใช่ dead-end แล้ว
- fix เรื่อง tracing path ช่วยจริง

### 3. พบ runtime bug ฝั่ง consumer บน Vercel

เมื่อ fetch deployment ที่ `READY` พบว่า page ตอบ:

- `ร้านค้าไม่พบ`

สาเหตุไม่ใช่ Supabase ล่ม แต่เป็น routing logic:

- middleware เดิมอ่าน first hostname label ทุกกรณี
- ทำให้ host แบบ:
  - `booking.craftbikelab.com`
  - `craftbikelab-booking.vercel.app`
  ถูกตีความเป็น tenant slug ผิด

ผล:

- app query หาร้านด้วย slug ที่ไม่มีอยู่จริง
- หน้าเลยตกไปที่ `ร้านค้าไม่พบ`

### 4. แก้ consumer middleware

แก้ `apps/booking-consumer/middleware.ts` ให้แยก 3 โหมดชัดเจน:

1. tenant subdomain จริง  
   - `bangkok-bike-care.booking.craftbikelab.com`
   - inject `x-shop-slug`

2. production base domain  
   - `booking.craftbikelab.com`
   - ไม่ inject slug
   - fallback ไป `NEXT_PUBLIC_SHOP_ID`

3. Vercel preview domain  
   - `*.vercel.app`
   - ไม่ inject slug
   - fallback ไป `NEXT_PUBLIC_SHOP_ID`

ผล:

- logic ตอนนี้สอดคล้องกับแผน deploy มากขึ้น

### 5. อัปเดต env guidance ฝั่ง consumer

แก้ `apps/booking-consumer/.env.production.example`

จากเดิมที่บอกว่า:

- production ไม่ต้องใช้ `NEXT_PUBLIC_SHOP_ID`

เป็น:

- `NEXT_PUBLIC_SHOP_ID` ยังใช้เป็น fallback สำหรับ
  - local dev
  - Vercel preview
  - base domain `booking.craftbikelab.com`

### 6. อัปเดต `DEPLOY_PLAN.md`

แก้ 3 จุด:

1. `outputFileTracingRoot` ให้ตรงกับโค้ดจริง:
   - `join(process.cwd(), "../..")`

2. ปรับคำอธิบาย `NEXT_PUBLIC_SHOP_ID`
   - ให้ชัดว่าเป็น fallback/default shop id

3. ปรับคำอธิบาย `SUPABASE_SERVICE_ROLE_KEY`
   - จาก required เป็น optional สำหรับ deploy รอบแรก
   - เพราะโค้ดปัจจุบันยังไม่ได้ใช้มันจริง

### 7. verification

รันซ้ำ:

```bash
npm run build
```

ผล:

- `apps/booking-consumer` build ผ่าน
- `apps/booking-admin` build ผ่าน

### 8. เตรียม draft email update

สร้าง Gmail draft ไว้แล้ว เพื่อให้มีสรุป milestone พร้อมใช้เมื่อผู้ใช้กลับมา

draft id:

- `r-822680708050369255`

หมายเหตุ:

- ยังไม่ได้ส่งจริง
- การส่งจริงต้องยืนยันตอน action-time ตามกติกาความปลอดภัย

## สถานะ Phase 4 หลังรอบนี้

สิ่งที่ถือว่าปิดไปแล้ว:

- monorepo/workspace readiness ดีขึ้นมาก
- consumer Vercel runtime issue หลักถูกวิเคราะห์จนเจอราก
- tracing config ถูกต้อง
- consumer hostname routing ตรง deploy model มากขึ้น
- docs/env guidance สำคัญเริ่มตรงกับระบบจริง

สิ่งที่ยังค้างก่อนปิด Phase 4 เต็ม:

1. สร้างหรือยืนยัน project ฝั่ง `booking-admin` บน Vercel
2. ใส่ production env vars ใน Vercel projects
3. ตั้ง custom domains / DNS
4. ตั้ง Supabase Auth redirect URLs
5. ทดสอบ production URL จริงทั้ง consumer และ admin

## ข้อจำกัดรอบนี้

ยังไม่มี Vercel CLI ในเครื่อง และเครื่องมือ Vercel ที่มีใน session นี้เป็นแนว read/manage ได้บางส่วน แต่ยังไม่ครอบคลุมการสร้าง project + ตั้งค่า domain/env แบบครบลูปในตัวเดียว

ดังนั้น Phase 4 ตอนนี้:

- **ยังไม่ปิด 100%**
- แต่ถูกดันไปถึงจุดที่เหลือ mostly external configuration / deploy execution แล้ว

## ไฟล์ที่แก้ในรอบนี้

- `C:\Users\Win10\Documents\mysystems\bike-booking-saas\apps\booking-consumer\middleware.ts`
- `C:\Users\Win10\Documents\mysystems\bike-booking-saas\apps\booking-consumer\.env.production.example`
- `C:\Users\Win10\Documents\mysystems\bike-booking-saas\DEPLOY_PLAN.md`
- `C:\Users\Win10\Documents\mysystems\bike-booking-saas\SESSION_NOTES_V9.md`

## ข้อสรุปสั้น

Phase 4 ยังไม่จบแบบประกาศปิดได้เต็มเสียงในรอบนี้ แต่จุดตันสำคัญถูกเปิดแล้ว:

- Vercel runtime bug เดิมไม่ใช่กำแพงถาวร
- consumer deploy model เริ่ม align กับโดเมนจริง
- เหลือฝั่ง external config / project setup / domain wiring เป็นหลัก
