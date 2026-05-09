# Bike Booking SaaS

ระบบจองคิวออนไลน์แบบ Multi-Tenant สำหรับร้านซ่อม/แต่งมอเตอร์ไซค์ ใช้ Next.js 15, Supabase และ Vercel

## เริ่มตรงไหน

ถ้าจะทำงานต่อจากเครื่องไหนก็ตาม ให้เปิดไฟล์นี้ตามลำดับ:

1. [docs/WORKSPACE_RULES.md](docs/WORKSPACE_RULES.md)
2. [docs/WORKFLOW.md](docs/WORKFLOW.md)
3. [SESSION_NOTES_V36.md](SESSION_NOTES_V36.md)
4. [docs/POST_DEPLOY_CHECKLIST.md](docs/POST_DEPLOY_CHECKLIST.md)

## ขอบเขตของงาน

- โปรเจกต์ active คือ `bike-booking-saas`
- `Chatbot/` ที่อยู่ระดับ repo เดียวกันเป็นงานแยก
- ถ้าไม่ได้สั่งชัดเจน ให้ทำงานเฉพาะ `bike-booking-saas`

## โครงสร้างหลัก

- `apps/booking-consumer` หน้า booking สำหรับลูกค้า
- `apps/booking-admin` หน้า admin สำหรับร้าน
- `supabase/migrations/initial.sql` schema, indexes, RLS, trigger กัน double booking
- `supabase/seed.sql` ข้อมูลทดสอบ 2 ร้าน
- `scripts/create-shop.sh` helper สำหรับเพิ่มร้าน

## Setup

```bash
cd bike-booking-saas
npm install
```

สร้าง Supabase project แล้วรัน SQL:

```bash
supabase db push
supabase db reset
```

หรือ copy `supabase/migrations/initial.sql` และ `supabase/seed.sql` ไปรันใน SQL editor

## Environment

สร้าง `.env.local` ใน `apps/booking-consumer`:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_SHOP_ID=11111111-1111-1111-1111-111111111111
```

สร้าง `.env.local` ใน `apps/booking-admin`:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_SHOP_ID=11111111-1111-1111-1111-111111111111
```

## Run Locally

```bash
npm run dev:shop
npm run dev:admin
```

เปิด `http://localhost:3000` สำหรับลูกค้า และ `http://localhost:3001` สำหรับ admin

## Deploy

1. Push repo ไป GitHub
2. สร้าง Vercel project แยก 2 ตัว โดยตั้ง Root Directory เป็น `apps/booking-consumer` และ `apps/booking-admin`
3. ใส่ environment variables ของแต่ละ project
4. Deploy เป็น `booking.craftbikelab.com` และ `booking-admin.craftbikelab.com` หรือโดเมน staging ที่ต้องการ

## Notes

- ระบบใช้ RLS แยกข้อมูลตามร้านผ่าน `shop_users`
- โมเดลปัจจุบันล็อกให้ 1 ร้านมี owner ได้เพียง 1 บัญชี
- Booking auto-confirm ทันที
- Trigger ใน Postgres กันจองซ้ำและกันวันหยุด
- Phase 1 ยังไม่มี LINE/Facebook API และ payment gateway
- Phase ปัจจุบันใช้ `NEXT_PUBLIC_SHOP_ID` แบบต่อหนึ่ง deployment ต่อหนึ่งร้านอยู่ก่อน จนกว่าจะเปิดใช้ subdomain routing จริง
- `booking-admin` มี route platform admin เริ่มต้นที่ `/platform` สำหรับคุมหลายร้าน
