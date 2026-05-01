# SESSION NOTES V2 - Bike Booking SaaS

วันที่บันทึก: 30 เมษายน 2026  
โปรเจค: `bike-booking-saas`  
Supabase project: `craftbikelab-saas-hub`  
Project ref: `gsbbkdppaegrttcqmjuq`  
Project URL: `https://gsbbkdppaegrttcqmjuq.supabase.co`

## สรุปงานวันนี้

วันนี้ขยับจาก local/demo mode ไปเป็น Supabase จริงเรียบร้อยแล้ว โดยยังคงแนวทางแยก schema เพื่อให้ Supabase project เดียวรองรับ SaaS อื่นในอนาคตได้

งานที่ทำสำเร็จ:

1. Backup โปรเจคก่อนแก้ schema
   - ไฟล์ backup:
     `C:\Users\Win10\Documents\New project\backups\bike-booking-saas\bike-booking-saas-before-schema-refactor-20260430-203305.zip`

2. ตัดสินใจ architecture
   - ใช้ Supabase project กลางชื่อ `craftbikelab-saas-hub`
   - แยก Bike Booking SaaS ไว้ใน schema:
     `bike_booking`
   - เหตุผล: อนาคตสามารถเพิ่ม SaaS อื่นใน project เดียวกันได้ เช่น `invoice_saas`, `crm_saas`, `inventory_saas`

3. อัปเดตเอกสารหลัก
   - อัปเดต `SESSION_NOTES.md`
   - อัปเดต `MASTER BLUEPRINT - Bike Booking SaaS.md`
   - เพิ่ม decision เรื่อง dedicated schema `bike_booking`

4. Refactor database
   - สร้าง schema `bike_booking`
   - ย้าย tables/types/functions/policies/indexes/grants ไปอยู่ใต้ `bike_booking`
   - เพิ่ม/ปรับ RLS สำคัญ:
     - success page อ่าน booking ล่าสุดได้
     - public insert booking scope ร้าน active/trial
     - service items ต้อง active และอยู่ร้านเดียวกัน
     - holidays public read scope เฉพาะร้าน active/trial
   - ปรับ business rules:
     - timezone ใช้ Asia/Bangkok
     - double booking block ด้วย trigger
     - no-show blacklist logic
     - cancel แล้ว decrement customer total booking

5. Apply migration เข้า Supabase จริง
   - Migration หลักสำเร็จ
   - Seed data สำเร็จ
   - ร้านตัวอย่าง:
     - `11111111-1111-1111-1111-111111111111` = Bangkok Bike Care
     - `22222222-2222-2222-2222-222222222222` = Chiangmai Customs

6. Expose schema ให้ Supabase API
   - เพิ่ม `bike_booking` เข้า PostgREST exposed schemas
   - สั่ง reload schema/config cache
   - REST API อ่าน `bike_booking.shops` ได้แล้ว

7. ต่อ local app กับ Supabase จริง
   - อัปเดต `.env.local` ของ:
     - `shop-frontend`
     - `shop-admin`
   - ใช้ Supabase URL จริง
   - ใช้ anon key จริง

8. Refactor app queries
   - Frontend/admin query ผ่าน:
     `supabase.schema("bike_booking")`
   - Realtime channel ใช้ schema:
     `bike_booking`
   - RPC no-show ใช้ schema:
     `bike_booking`

9. ทดสอบระบบจริง
   - `localhost:3000` ดึงร้านจาก Supabase จริงได้
   - สร้าง booking จริงสำเร็จ
   - success page อ่าน booking จริงได้
   - double booking ถูก block สำเร็จด้วยข้อความ:
     `เวลานี้มีคนจองแล้ว`

10. ตั้งค่า admin user
    - Supabase Auth user:
      `titazmth@gmail.com`
    - user id:
      `54e28e6e-684f-4318-9f32-11809972c5f2`
    - ผูกเป็น owner ของร้าน Bangkok Bike Care แล้วใน:
      `bike_booking.shop_users`

11. แก้ login admin
    - เดิม login สำเร็จแต่ server ไม่เห็น session
    - เปลี่ยน browser client ฝั่ง admin ไปใช้ `createBrowserClient` จาก `@supabase/ssr`
    - ทำ singleton client เพื่อลดปัญหา multiple GoTrue clients
    - หลัง login ให้รอ `getSession()` ก่อน redirect
    - ผลลัพธ์ล่าสุด: ผู้ใช้ยืนยันว่า login เข้า admin ได้แล้ว

12. Verification
    - `npm run lint` ผ่าน
    - `npm run build` ผ่านทั้งสอง app
    - `shop-admin` lint/build ผ่านหลังแก้ login

## Test Data ที่ทิ้งไว้

ยังไม่ลบตามที่ตกลงกัน เพราะจะใช้เทสต่อ

Booking test:

```text
booking_id: ed3c4478-6a84-40a9-b471-dd2e86d3c1c6
customer_name: Test Customer
customer_phone: 0990000001
booking_date: 2026-05-04
time: 13:00 - 14:00
shop: Bangkok Bike Care
```

หมายเหตุ: ข้อความ notes ภาษาไทยที่ insert ผ่าน PowerShell กลายเป็น `????` เพราะ encoding ของ PowerShell ไม่ใช่ปัญหา schema หลัก ควรทดสอบผ่าน browser form อีกครั้งเพื่อยืนยันภาษาไทยจาก UI

## ข้อผิดพลาดที่เจอและวิธีแก้

1. `Missing Supabase environment variables`
   - สาเหตุ: `.env.local` ยังว่าง
   - วิธีแก้: ช่วงแรกใช้ demo/mock mode, ต่อมาดึง Supabase URL/anon key จริงมาใส่

2. หน้า admin `localhost:3001/dashboard` เป็น 500 ตอน env ว่าง
   - สาเหตุ: middleware เรียก Supabase ก่อนเข้า demo guard
   - วิธีแก้: เพิ่ม guard ใน middleware ถ้าไม่มี Supabase env ให้ bypass เพื่อ local/demo

3. Next dev server ทำ CSS เพี้ยน/รูปเต็มจอ
   - สาเหตุ: dev server/cache ค้าง ทำให้ HTML อ้าง CSS path แต่ CSS ตอบ 404
   - วิธีแก้: restart dev server เฉพาะ port ที่มีปัญหา

4. Supabase API หา table ไม่เจอ
   - Error:
     `PGRST205 Could not find the table 'bike_booking.shops' in the schema cache`
   - สาเหตุ: schema `bike_booking` ยังไม่ได้ expose ให้ PostgREST
   - วิธีแก้:
     - ตั้ง `pgrst.db_schemas`
     - `notify pgrst, 'reload schema'`
     - `notify pgrst, 'reload config'`

5. Admin login วนกลับ `/login`
   - สาเหตุ: client เดิมใช้ `@supabase/supabase-js` ตรง ๆ ทำให้ session อยู่ localStorage แต่ middleware/server อ่าน cookie จาก `@supabase/ssr`
   - วิธีแก้:
     - เปลี่ยน admin browser client เป็น `createBrowserClient` จาก `@supabase/ssr`
     - ทำ singleton client
     - หลัง login รอ `getSession()` ก่อน redirect

6. Warning multiple GoTrue clients
   - สาเหตุ: มี Supabase client หลาย instance ใน browser context
   - วิธีแก้: ทำ singleton ใน `shop-admin/lib/supabase/client.ts`

7. Admin CSS/หน้าตาเพี้ยนหลังแก้ login
   - สาเหตุ: dev server process เก่าค้าง
   - วิธีแก้: kill process ที่ listen port `3001` แล้ว start ใหม่

8. Next workspace root warning
   - สาเหตุ: มี `package-lock.json` อีกไฟล์ที่ `C:\Users\Win10\package-lock.json`
   - วิธีแก้: เพิ่ม `outputFileTracingRoot` ใน `next.config.ts` ของทั้ง frontend/admin

## สถานะปัจจุบัน

Frontend:

```text
URL: http://localhost:3000
Status: ต่อ Supabase จริงแล้ว
Shop: Bangkok Bike Care
Booking flow: สร้าง booking จริงได้
Success page: อ่าน booking จริงได้
Double booking: block ได้
```

Admin:

```text
URL: http://localhost:3001/login
Status: login เข้าได้แล้ว
User: titazmth@gmail.com
Role: owner
Shop: Bangkok Bike Care
```

Database:

```text
Supabase project: craftbikelab-saas-hub
Schema: bike_booking
RLS: enabled
Seed: done
PostgREST exposed schema: done
```

## สิ่งที่ยังควรตรวจต่อ

1. ทดสอบ booking ผ่าน UI จริง
   - กรอกฟอร์มจาก browser
   - เช็คว่าภาษาไทยไม่กลายเป็น `????`
   - เช็ค success page copy text

2. ทดสอบ admin หลัง login
   - dashboard เห็น booking จริง
   - bookings table เห็นรายการ
   - calendar เห็น event
   - เปลี่ยนสถานะ confirmed/in_progress/completed/cancelled
   - no-show เพิ่ม count และ blacklist เมื่อครบ 3

3. UI polish
   - หน้า mobile customer มี text overflow บางจุด:
     - ชื่อร้านใน hero
     - Facebook URL/contact card
   - ควรแก้แบบจำกัด scope ไม่รื้อ design ทั้งหน้า

4. Security review
   - ตรวจ policies อีกครั้งหลังมี admin flow จริง
   - เช็คว่า anon อ่านได้เฉพาะข้อมูลที่ควรอ่าน
   - เช็คว่า authenticated staff ร้าน A ไม่เห็นร้าน B

5. Cleanup ก่อนเปิดจริง
   - ลบ test booking/customer
   - เปลี่ยนชื่อร้าน/ข้อมูลร้านจริง
   - ตั้ง service items จริง
   - ตั้งวันหยุด/เวลาทำการจริง

## Path สำหรับครั้งถัดไป

### Path A - Stabilize MVP Local Integration

เหมาะถ้าต้องการให้ระบบ local + Supabase จริงนิ่งก่อน deploy

งาน:

1. เทส booking จาก UI จริง end-to-end
2. เทส admin dashboard/calendar/bookings/services/settings
3. แก้ bug ที่เจอจากการใช้งานจริง
4. แก้ mobile overflow แบบจำกัด scope
5. เพิ่ม debug/QA checklist
6. ทำ cleanup script สำหรับ test data

ผลลัพธ์ที่ควรได้:

```text
local app ใช้งานจริงได้ครบ flow
ไม่มี error console
ไม่มี UI overflow สำคัญบน mobile
พร้อม deploy staging
```

### Path B - Prepare Production/Staging Deployment

เหมาะถ้า local flow ผ่านแล้วและต้องการขึ้น Vercel

งาน:

1. เตรียม GitHub repo/branch
2. สร้าง Vercel projects:
   - customer frontend
   - admin frontend
3. ใส่ env vars ใน Vercel
4. ตั้ง domain/subdomain
5. ทดสอบ staging URL
6. ทดสอบ auth redirect/cookie บน Vercel domain
7. ทำ production checklist

ผลลัพธ์ที่ควรได้:

```text
มี staging/production URL ใช้งานจริง
admin login ได้บน domain จริง
customer booking เข้า DB จริง
```

### Path C - Multi-Tenant SaaS Hardening

เหมาะถ้าจะเริ่มเตรียมใช้กับหลายร้านจริง

งาน:

1. ทำ create-shop flow/script ให้สมบูรณ์
2. เพิ่มระบบ invite staff/owner
3. เพิ่มหน้า manage users ต่อร้าน
4. ออกแบบ tenant routing/domain strategy
5. วาง naming convention:
   - shop slug
   - subdomain
   - Vercel env per shop หรือ dynamic tenant
6. เพิ่ม audit/security checks

ผลลัพธ์ที่ควรได้:

```text
เพิ่มร้านใหม่ง่าย
เพิ่ม owner/staff ได้ไม่ต้อง insert DB เอง
tenant isolation ชัดเจน
```

## Recommendation สำหรับครั้งถัดไป

แนะนำเริ่มด้วย **Path A** ก่อน

เหตุผล:

ตอนนี้ระบบต่อ Supabase จริงได้แล้ว แต่ยังควรพิสูจน์ว่า user flow จาก UI จริงครบถ้วนก่อน deploy โดยเฉพาะ:

- ภาษาไทยจาก browser form
- admin dashboard หลัง login
- status update
- calendar
- mobile layout

หลัง Path A ผ่าน ค่อยไป Path B deploy Vercel จะปลอดภัยกว่า

## Quick Start ครั้งถัดไป

เปิดโปรเจค:

```powershell
cd "C:\Users\Win10\Documents\New project\bike-booking-saas"
```

รัน local:

```powershell
npm run dev:shop
npm run dev:admin
```

เปิด:

```text
Customer: http://localhost:3000
Admin:    http://localhost:3001/login
```

เช็คคุณภาพ:

```powershell
npm run lint
npm run build
```

## Files สำคัญที่แก้วันนี้

```text
supabase/migrations/initial.sql
supabase/seed.sql
shop-frontend/.env.local
shop-admin/.env.local
shop-frontend/next.config.ts
shop-admin/next.config.ts
shop-admin/middleware.ts
shop-admin/lib/supabase/client.ts
shop-admin/app/login/page.tsx
SESSION_NOTES.md
MASTER BLUEPRINT - Bike Booking SaaS.md
SESSION_NOTES_V2.md
```

