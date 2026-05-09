# Bike Booking SaaS Index

สารบัญกลางของโปรเจค `bike-booking-saas` สำหรับเปิดอ่านเร็ว ๆ ว่าตอนนี้มีอะไรอยู่ตรงไหน และควรเริ่มจากไฟล์ไหน

## ภาพรวมโปรเจค

- โปรเจค: Bike Booking SaaS
- ประเภท: ระบบจองคิวออนไลน์แบบ Multi-Tenant สำหรับร้านซ่อมและแต่งมอเตอร์ไซค์
- ที่อยู่โปรเจคบนเครื่อง: `C:\Users\Win10\Documents\mysystems\bike-booking-saas`
- ที่เก็บโค้ดหลัก: `https://github.com/Gutumrod/mysystems.git`
- Production customer: `https://booking.craftbikelab.com`
- Production admin: `https://booking-admin.craftbikelab.com/login`
- Frontend แยกเป็น 2 แอป
  - `apps/booking-consumer` สำหรับลูกค้าจอง
  - `apps/booking-admin` สำหรับร้านจัดการคิว
- Backend ใช้ Supabase
  - PostgreSQL
  - Auth
  - Realtime
  - RLS
- Deploy เป้าหมายบน Vercel

## เริ่มอ่านจากไหน

1. อ่าน [START_HERE.md](START_HERE.md) ก่อน ถ้าจะสลับเครื่องหรือจะเริ่มงานใหม่
2. อ่าน [docs/WORKSPACE_RULES.md](docs/WORKSPACE_RULES.md) ถ้าจะสลับเครื่องหรือจะเริ่มงานใหม่
3. อ่าน [README.md](README.md) ถ้าต้องการ setup / run / deploy แบบเร็ว
4. อ่าน [docs/USER_GUIDE.md](docs/USER_GUIDE.md) ถ้าต้องการภาพรวมการใช้งานฝั่งลูกค้าและร้าน
5. อ่าน [docs/API.md](docs/API.md) ถ้าต้องการดูสัญญา API หรือ flow สำคัญ
6. อ่าน [docs/POST_DEPLOY_CHECKLIST.md](docs/POST_DEPLOY_CHECKLIST.md) ถ้าจะเช็คหลัง deploy
7. อ่าน [docs/AGENT_START_END.md](docs/AGENT_START_END.md) ถ้าจะสั่ง Codex/Claude/Gemini ให้เริ่มงานและปิดงานแบบเดียวกัน
8. อ่าน [HANDOFF_TEMPLATE.md](HANDOFF_TEMPLATE.md) ถ้าจะส่งงานข้ามเครื่องหรือข้าม agent
9. อ่าน [SESSION_NOTES_CURRENT.md](SESSION_NOTES_CURRENT.md) ถ้าจะต่อจาก note ล่าสุด
10. อ่าน [DEPLOY_PLAN.md](DEPLOY_PLAN.md) ถ้าจะตาม roadmap และขั้นตอนโครงสร้างระบบ
11. อ่าน [MASTER BLUEPRINT - Bike Booking SaaS.md](MASTER%20BLUEPRINT%20-%20Bike%20Booking%20SaaS.md) ถ้าต้องการดูสเปกต้นฉบับทั้งหมด

## โครงสร้างหลัก

### แอป

- [apps/booking-consumer](apps/booking-consumer) หน้า booking ของลูกค้า
- [apps/booking-admin](apps/booking-admin) หน้า admin ของร้าน

### ขอบเขตงาน

- [docs/WORKSPACE_RULES.md](docs/WORKSPACE_RULES.md) อธิบายว่าต้องทำงานเฉพาะ `bike-booking-saas`
- โฟลเดอร์ `Chatbot/` ที่อยู่ระดับ repo เดียวกันเป็นงานแยก อย่าเอามาปนกับงานนี้

### Supabase

- [supabase/migrations](supabase/migrations) schema, RLS, trigger, function, และ migration history
- [supabase/seed.sql](supabase/seed.sql) ข้อมูลทดสอบ
- [supabase/backups](supabase/backups) สำรองก่อนแก้ของสำคัญ

### Scripts

- [scripts/create-shop.sh](scripts/create-shop.sh) helper สำหรับสร้างร้านใหม่

### เอกสารงาน

- [SESSION_NOTES.md](SESSION_NOTES.md) บันทึกงานหลัก
- [SESSION_NOTES_EN.md](SESSION_NOTES_EN.md) บันทึกงานเวอร์ชันภาษาอังกฤษ
- [SESSION_NOTES_V10.md](SESSION_NOTES_V10.md) ถึง [SESSION_NOTES_V16.md](SESSION_NOTES_V16.md) ประวัติ session ก่อนหน้า
- [IMPLEMENTATION_GAPS.md](IMPLEMENTATION_GAPS.md) ช่องว่างที่ยังต้องปิด
- [docs/POST_DEPLOY_CHECKLIST.md](docs/POST_DEPLOY_CHECKLIST.md) เช็คลิสต์หลังปล่อยระบบ

## คำสั่งใช้งานเร็ว

```bash
npm install
npm run dev:shop
npm run dev:admin
```

- ลูกค้า: `http://localhost:3000`
- แอดมิน: `http://localhost:3001`

## ตัวแปรสภาพแวดล้อม

### shop-frontend

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_SHOP_ID=
```

### shop-admin

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_SHOP_ID=
```

## กฎสำคัญของระบบ

- ลูกค้าจองแล้วต้อง `confirmed` ทันที
- ห้ามใช้ `.insert().select()` กับ `bookings` ฝั่ง customer
- ฝั่งจองต้องใช้ RPC `create_public_booking(...)`
- ต้องกัน double booking และกันวันหยุด
- Multi-tenant ต้องแยกข้อมูลตามร้านผ่าน `shop_users` และ RLS
- ก่อนแก้ production หรือ schema สำคัญ ต้อง backup ก่อนเสมอ

## สถานะงานที่ควรจำ

- ระบบ customer และ admin ใช้งานได้แล้วใน production
- booking flow ใช้ RPC-first แล้ว
- time slot ต้อง filter ตาม `booking_date`
- ถ้าจะเพิ่มร้านใหม่ ต้องเตรียม shop row, service items, user mapping และ domain/env ให้ครบ
- รอบล่าสุดเพิ่ม edit/delete booking flow แล้ว
- ถ้าย้ายเครื่อง ให้ pull `main` ล่าสุดก่อนเริ่ม แล้วเปิด `SESSION_NOTES_V37.md`

## เส้นทางถัดไปที่แนะนำ

1. ปิดงานเก็บรายละเอียดของร้านจริงให้ครบ
2. ทดสอบ booking หลายรอบและตรวจ dashboard admin
3. ทำ onboarding สำหรับร้านใหม่ให้เป็นขั้นตอนเดียว
4. ถ้าจะขยายหลาย SaaS ในโปรเจคเดียว ให้เพิ่ม CraftBike Command Center / super admin layer แยกจาก booking admin
