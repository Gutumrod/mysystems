# 🏍️ Bike Booking SaaS — Session Notes
**วันที่:** 30 เมษายน 2569  
**สถานะโปรเจค:** Code complete (mock data) | ยังไม่ได้ connect Supabase

---

## ✅ สิ่งที่ทำในวันนี้

### 1. Code Audit (Static Analysis)
ตรวจ code ทั้งหมด 10 หมวด พบ:
- ✅ Pass: 34 รายการ
- ❌ Fail: 12 รายการ  
- ⚠️ Warning: 22 รายการ

### 2. แก้ไข Code (9 ไฟล์)

#### Group A — Validation (`shop-frontend/lib/validations.ts`)
- [x] Phone regex → `/^0[0-9]{9}$/` (Thai format: 10 หลัก ขึ้นต้น 0)
- [x] Services เพิ่ม `.max(10)` (สูงสุด 10 บริการ)
- [x] Year min เปลี่ยนจาก 1950 → 1990
- [x] Note max 500 (ถูกต้องแล้ว ไม่ต้องแก้)

#### Group B — Error Handling & UX
- [x] `CopyBookingButton.tsx` — try/catch + error message ภาษาไทย
- [x] `ServicesManager.tsx` — try/catch ใน onDragEnd + toast error
- [x] `BookingsTable.tsx` — loading state บน action buttons
- [x] `ShopSettingsForm.tsx` — loading state บน save button
- [x] `ScheduleSettings.tsx` — loading state แยกต่างหากทุก async op
- [x] `DashboardClient.tsx` — per-booking savingId state

#### Group C — Architecture
- [x] `shop-admin/middleware.ts` — สร้างใหม่, Supabase session refresh + auth guard
- [x] `BookingForm.tsx` — time conflict error message + scroll to picker

### 3. ไฟล์ที่จัดการแล้ว
- [x] ลบ `shop-frontend/app/success/page - Copy.rar` ออกจาก repo (ย้ายไป `C:\Users\Win10\Documents\`)

---

## 🔴 สิ่งที่ยังต้องแก้ (รอ Supabase setup)

| # | Issue | ไฟล์ | Priority |
|---|---|---|---|
| 1 | Success page อ่าน booking ไม่ได้ — ขาด public SELECT policy | `supabase/migrations/initial.sql` | Critical |
| 2 | INSERT booking ไม่ scope shop_id ใน RLS | `supabase/migrations/initial.sql` | High |
| 3 | `shop_holidays` public read ไม่ scope shop_id | `supabase/migrations/initial.sql` | Low |
| 4 | `sync_customer_stats` ไม่ decrement เมื่อ cancel | `supabase/migrations/initial.sql` | Low |
| 5 | Timezone ไม่ได้ set เป็น Asia/Bangkok | Vercel env + DB trigger | Low |

---

## 🧭 Architecture Decision

- [x] ใช้ PostgreSQL schema แยกชื่อ `bike_booking` แทนการวางตารางไว้ใน `public`
- เหตุผล: ทำให้โปรเจคนี้แยกจาก SaaS/ระบบอื่นที่อาจมาอยู่ใน Supabase project เดียวกันในอนาคต
- ตาราง, functions, RLS policies, seed data และ Supabase queries ต้องอ้าง `bike_booking`
- ฝั่ง app ต้อง query ผ่าน `supabase.schema("bike_booking")`

### Before Supabase Setup Checklist

- [ ] Refactor `supabase/migrations/initial.sql` จาก `public.*` เป็น `bike_booking.*`
- [ ] Refactor `supabase/seed.sql` ให้ insert เข้า `bike_booking.*`
- [ ] Refactor queries ใน `shop-frontend` ให้ใช้ `.schema("bike_booking")`
- [ ] Refactor queries ใน `shop-admin` ให้ใช้ `.schema("bike_booking")`
- [ ] Re-run `npm run lint` และ `npm run build`

---

## 🗺️ แผนขั้นถัดไป

### Path A — เร็ว (ทดสอบ UI ก่อน)
> เหมาะถ้าอยากเห็น app ทำงานจริงก่อน connect backend

```
รัน app ด้วย mock data
    ↓
ทดสอบ UI / Form validation บน desktop
    ↓
ทดสอบบน mobile จริง (iPhone/Android)
    ↓
Cross-browser test (Chrome, Safari, Firefox)
    ↓
→ setup Supabase (Path B)
```

### Path B — สมบูรณ์ (แนะนำ)
> ทำครั้งเดียวได้ความมั่นใจครบ

```
Step 1: Setup Supabase
├── สร้าง Supabase project (Singapore region)
├── รัน initial.sql migration
├── แก้ RLS policies (Critical items ข้างบน)
├── รัน seed.sql
└── ใส่ env vars ทั้ง shop-frontend และ shop-admin

Step 2: Integration Testing (local + Supabase จริง)
├── Booking flow ครบ (กรอก → submit → success page)
├── Admin flow (login → dashboard → เปลี่ยน status)
├── Multi-tenant isolation (2 shops แยกกัน)
├── Edge cases (blacklist, holiday, past date, double booking)
└── RLS verification (Admin A ไม่เห็น data Shop B)

Step 3: Mobile & Cross-browser Testing
├── iPhone Safari
├── Android Chrome  
├── iPad
└── Desktop browsers

Step 4: Security Testing
├── SQL injection
├── XSS
└── Auth route protection

Step 5: Staging Deploy
├── Vercel staging
├── Supabase staging project
└── Full smoke test บน staging

Step 6: Production Deploy
├── Domain setup
├── DNS + SSL
├── Monitoring (UptimeRobot)
└── Beta launch (5 shops)
```

---

## 📋 สิ่งที่ต้องตัดสินใจ / เตรียมก่อนครั้งถัดไป

- [ ] เลือก Path A หรือ B
- [ ] สร้าง Supabase account (ถ้ายังไม่มี) → https://supabase.com
- [ ] ตัดสินใจเรื่อง domain name
- [ ] เตรียม beta users (5 ร้านทดสอบ)

---

## 🔧 Commands ที่ใช้บ่อย

```bash
# รัน frontend (local)
cd shop-frontend && npm run dev

# รัน admin (local)
cd shop-admin && npm run dev

# รัน Supabase migration
supabase db push --project-ref [ref]

# รัน seed
psql $DATABASE_URL < supabase/seed.sql
```

---

*สร้างโดย Claude Cowork — อัปเดตทุก session*
