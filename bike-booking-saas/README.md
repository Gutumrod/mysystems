# Bike Booking SaaS

ระบบจองคิวออนไลน์แบบ Multi-Tenant สำหรับร้านซ่อม/แต่งมอเตอร์ไซค์ ใช้ Next.js 15, Supabase และ Vercel

## เริ่มตรงไหน

ถ้าจะทำงานต่อจากเครื่องไหนก็ตาม ให้เปิดไฟล์นี้ตามลำดับ:

1. [START_HERE.md](START_HERE.md)
2. [docs/WORKSPACE_RULES.md](docs/WORKSPACE_RULES.md)
3. [docs/WORKFLOW.md](docs/WORKFLOW.md)
4. [docs/AGENT_START_END.md](docs/AGENT_START_END.md)
5. [HANDOFF_TEMPLATE.md](HANDOFF_TEMPLATE.md)
6. [SESSION_NOTES_CURRENT.md](SESSION_NOTES_CURRENT.md)
7. [docs/DOMAIN_STANDARD.md](docs/DOMAIN_STANDARD.md)
8. [docs/POST_DEPLOY_CHECKLIST.md](docs/POST_DEPLOY_CHECKLIST.md)

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
NEXT_PUBLIC_SHOP_ID=
```

`NEXT_PUBLIC_SHOP_ID` ใช้เป็น fallback สำหรับ local/base domain/preview เท่านั้น ใน production ของร้านจริงระบบอ่าน shop จาก subdomain slug ก่อน เช่น `kmorackbarcustom.craftbikelab.com`

สร้าง `.env.local` ใน `apps/booking-admin`:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_SHOP_ID=
```

ฝั่ง admin ก็ใช้ fallback เฉพาะ local/base domain/preview เช่นกัน ส่วน `kmorackbarcustom-admin.craftbikelab.com` จะ resolve ร้านจาก slug `kmorackbarcustom`

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
4. Deploy ตามมาตรฐานโดเมนใน [docs/DOMAIN_STANDARD.md](docs/DOMAIN_STANDARD.md)
5. ถ้าต้องการ staging หรือ tenant ตัวอย่าง ให้ map เพิ่มตามโครงเดียวกัน

## Notes

- ระบบใช้ RLS แยกข้อมูลตามร้านผ่าน `shop_users`
- โมเดลปัจจุบันล็อกให้ 1 ร้านมี owner ได้เพียง 1 บัญชี
- Booking auto-confirm ทันที
- Trigger ใน Postgres กันจองซ้ำและกันวันหยุด
- Phase 1 ยังไม่มี LINE/Facebook API และ payment gateway
- ระบบ production รองรับ multi-tenant subdomain routing แล้ว เช่น `[shop-slug].craftbikelab.com` และ `[shop-slug]-admin.craftbikelab.com`; `NEXT_PUBLIC_SHOP_ID` ยังเหลือไว้เป็น fallback สำหรับ base domain, preview และ local dev
- `booking-admin` มี route **CraftBike Control Center** เริ่มต้นที่ `/platform` สำหรับคุมหลายร้าน และผูกโดเมนกลางที่ `control.craftbikelab.com`
- มาตรฐานชื่อโดเมนและ flow สมัครร้านใหม่อธิบายไว้ใน [docs/DOMAIN_STANDARD.md](docs/DOMAIN_STANDARD.md)
