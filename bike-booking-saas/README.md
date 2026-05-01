# Bike Booking SaaS

ระบบจองคิวออนไลน์แบบ Multi-Tenant สำหรับร้านซ่อม/แต่งมอเตอร์ไซค์ ใช้ Next.js 15, Supabase และ Vercel

## โครงสร้าง

- `shop-frontend` หน้า booking สำหรับลูกค้า
- `shop-admin` หน้า admin สำหรับร้าน
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

สร้าง `.env.local` ใน `shop-frontend`:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_SHOP_ID=11111111-1111-1111-1111-111111111111
```

สร้าง `.env.local` ใน `shop-admin`:

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
2. สร้าง Vercel project แยก 2 ตัว โดยตั้ง Root Directory เป็น `shop-frontend` และ `shop-admin`
3. ใส่ environment variables ของแต่ละ project
4. Deploy เป็น `shop-name.vercel.app` และ `shop-name-admin.vercel.app`

## Notes

- ระบบใช้ RLS แยกข้อมูลตามร้านผ่าน `shop_users`
- Booking auto-confirm ทันที
- Trigger ใน Postgres กันจองซ้ำและกันวันหยุด
- Phase 1 ยังไม่มี LINE/Facebook API และ payment gateway
