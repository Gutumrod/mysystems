# DEPLOY_PLAN.md — Bike Booking SaaS
# แผนการ Deploy สู่ Production

วันที่: 1–2 พฤษภาคม 2026  
Phase: 4 — Deploy Readiness / Live Verification  
Supabase Project: `craftbikelab-saas-hub` (ref: `gsbbkdppaegrttcqmjuq`)

> สถานะล่าสุด: ทั้ง `booking.craftbikelab.com` และ `booking-admin.craftbikelab.com` เปิดได้แล้วบน Vercel  
> แต่ยังเหลืองานก่อน go-live อีกบางส่วน เช่น ข้อมูลร้านจริง, Supabase Auth redirect config, และ final E2E

---

## 1. Architecture Overview

### ภาพรวมโครงสร้าง

โปรเจคนี้เป็น **npm workspaces monorepo** ที่มี 2 Next.js apps อยู่ใน root repo เดียวกัน

```
bike-booking-saas/          ← GitHub repo เดียว
├── apps/booking-consumer/          ← ระบบจองคิวลูกค้า (Next.js 15, port 3000)
├── apps/booking-admin/             ← แดชบอร์ดร้าน (Next.js 15, port 3001)
├── supabase/               ← migrations + seed
└── package.json            ← npm workspaces root
```

### การ Map สู่ Vercel

| App | Vercel Project | Domain | ใครใช้ |
|-----|---------------|--------|--------|
| `apps/booking-consumer` | `craftbikelab-booking` | `booking.craftbikelab.com` | ลูกค้าจองคิว |
| `apps/booking-admin` | `craftbikelab-booking-admin` | `booking-admin.craftbikelab.com` | เจ้าของร้าน |

> **หลักการ:** สร้าง Vercel project แยกกัน 2 project จาก GitHub repo เดียวกัน แต่กำหนด Root Directory ต่างกัน

### Data Flow

```
ลูกค้า → booking.craftbikelab.com (apps/booking-consumer)
               ↓
         Supabase (gsbbkdppaegrttcqmjuq)
         schema: bike_booking
         table: public_booking_slots (view)
               ↑
เจ้าของร้าน → booking-admin.craftbikelab.com (apps/booking-admin)
               ↓ auth
         Supabase Auth → shop_users table
```

---

## 2. DNS & Subdomain Strategy

### โดเมนที่ต้องตั้งค่า

| Subdomain | รูปแบบ DNS | ชี้ไปที่ | หมายเหตุ |
|-----------|-----------|---------|---------|
| `craftbikelab.com` | A / ALIAS | Vercel | ถ้าต้องการ landing page |
| `www.craftbikelab.com` | CNAME → `cname.vercel-dns.com` | Vercel | optional |
| `booking.craftbikelab.com` | CNAME → `cname.vercel-dns.com` | craftbikelab-booking | ระบบจองลูกค้า |
| `booking-admin.craftbikelab.com` | CNAME → `cname.vercel-dns.com` | craftbikelab-booking-admin | admin dashboard |

### Namespace Strategy (SaaS หลายผลิตภัณฑ์)

ชื่อ subdomain ออกแบบให้รองรับการขยายเป็น SaaS หลายตัวบนโดเมนเดียวกัน โดยแต่ละผลิตภัณฑ์มี namespace ของตัวเอง ไม่ชนกัน:

| ผลิตภัณฑ์ | Frontend | Admin |
|----------|---------|-------|
| Bike Booking (ตัวนี้) | `booking.craftbikelab.com` | `booking-admin.craftbikelab.com` |
| CRM (อนาคต) | `crm.craftbikelab.com` | `crm-admin.craftbikelab.com` |
| อื่นๆ | `[product].craftbikelab.com` | `[product]-admin.craftbikelab.com` |

subdomain ทั้งหมดเป็น ASCII ล้วน — ไม่มีปัญหา IDN/Punycode

### Wildcard Subdomain (สำหรับอนาคต Multi-tenant)

เมื่อต้องการให้แต่ละร้านมี URL ของตัวเอง เช่น:
- `craftbikelab.booking.craftbikelab.com`
- `topbike.booking.craftbikelab.com`

ต้องเพิ่ม DNS record:
```
*.booking.craftbikelab.com  CNAME  cname.vercel-dns.com
```

และ Vercel project ต้องใช้ Plan ที่รองรับ wildcard domains (Pro ขึ้นไป)

> **สถานะปัจจุบัน:** ระบบยังใช้ `NEXT_PUBLIC_SHOP_ID` แบบ hardcode ต่อ deployment — wildcard subdomain routing ยังไม่ได้ implement ใน middleware ฝั่ง apps/booking-consumer ต้องทำใน Phase ถัดไป

---

## 3. Vercel Project Setup

### สถานะปัจจุบันของ Vercel Projects

สร้างแล้วทั้ง 2 project:

| App | Project | สถานะ |
|-----|---------|-------|
| `apps/booking-consumer` | `craftbikelab-booking` | live |
| `apps/booking-admin` | `craftbikelab-booking-admin` | live |

### เพิ่ม Custom Domain

เพิ่มแล้วทั้งคู่ และตอบสนองได้จริง:

- `booking.craftbikelab.com`
- `booking-admin.craftbikelab.com`

### หมายเหตุ: monorepo กับ next.config.ts

ทั้ง 2 apps มี config นี้ใน `next.config.ts`:

```ts
outputFileTracingRoot: join(process.cwd(), "../../..")
```

ค่านี้บอก Next.js ให้ trace file dependencies ขึ้นไประดับ git repo root (`mysystems/`) ซึ่ง **จำเป็น** สำหรับ Vercel monorepo builds เพราะ Vercel clone repo ทั้งก้อน ไม่ได้ clone แค่ `bike-booking-saas/`

---

## 4. Environment Variables

### apps/booking-consumer — Production Environment Variables

ตั้งค่าใน Vercel Project `craftbikelab-booking` → Settings → Environment Variables

| Variable | ค่า Production | สถานะ |
|----------|---------------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://gsbbkdppaegrttcqmjuq.supabase.co` | ✅ ใช้ค่า dev ได้เลย |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGci...` (ค่าจาก .env.local) | ✅ ใช้ค่า dev ได้เลย |
| `NEXT_PUBLIC_SHOP_ID` | UUID ของร้าน fallback/default | ⚠️ **ต้องเปลี่ยนจาก 11111111-...-1111** |

> **หมายเหตุ `NEXT_PUBLIC_SHOP_ID`:** ค่านี้ยังจำเป็นสำหรับ `booking.craftbikelab.com` และ preview deployments บน `*.vercel.app` เพราะ hostname พวกนี้ไม่มี tenant slug ให้ middleware ใช้ resolve ร้านโดยตรง ส่วน tenant subdomain จริง เช่น `bangkok-bike-care.booking.craftbikelab.com` จะใช้ slug จาก hostname ก่อน แล้วค่อย fallback มาที่ตัวแปรนี้ถ้าไม่มี slug

> **NEXT_PUBLIC_** variables จะถูก embed ใน JavaScript bundle — อย่าใส่ข้อมูลที่ต้องการซ่อน ค่าทั้งสามรายการนี้ถือว่า public ได้

### apps/booking-admin — Production Environment Variables

ตั้งค่าใน Vercel Project `craftbikelab-booking-admin` → Settings → Environment Variables

| Variable | ค่า Production | สถานะ |
|----------|---------------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://gsbbkdppaegrttcqmjuq.supabase.co` | ✅ ใช้ค่า dev ได้เลย |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGci...` (ค่าจาก .env.local) | ✅ ใช้ค่า dev ได้เลย |
| `NEXT_PUBLIC_SHOP_ID` | UUID ของร้านจริง | ⚠️ **ต้องเปลี่ยนจาก 11111111-...-1111** |
| `SUPABASE_SERVICE_ROLE_KEY` | ดูจาก Supabase Project Settings → API | optional (ยังไม่ถูกใช้ในโค้ดปัจจุบัน) |

> **หมายเหตุ `SUPABASE_SERVICE_ROLE_KEY`:** ปัจจุบัน code เวอร์ชันนี้ยังไม่ได้ใช้ key นี้โดยตรง (auth ผ่าน anon key + RLS เป็นหลัก) จึงไม่ใช่ blocker สำหรับ deploy รอบแรก แต่สามารถเตรียมไว้ล่วงหน้าได้หากรอบถัดไปจะมี admin operations ที่ต้อง bypass RLS

> **`SUPABASE_SERVICE_ROLE_KEY` ไม่มี prefix `NEXT_PUBLIC_`** → ไม่ถูก expose ไปยัง client browser ปลอดภัย

### วิธีดึงค่าจาก Supabase Dashboard

1. ไปที่ [supabase.com/dashboard](https://supabase.com/dashboard)
2. เลือก project `craftbikelab-saas-hub`
3. ไปที่ **Project Settings → API**
4. คัดลอก:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** (secret) → `SUPABASE_SERVICE_ROLE_KEY`

### วิธีดึง Shop ID จริง

```sql
-- รันใน Supabase SQL Editor
SELECT id, name, slug FROM bike_booking.shops;
```

เอา `id` ของร้านจริงไปใส่ใน `NEXT_PUBLIC_SHOP_ID` ของทั้ง 2 projects

---

## 5. Middleware Configuration

### apps/booking-consumer: มี middleware สำหรับ hostname routing

`apps/booking-consumer` มี `middleware.ts` แล้ว ใช้เพื่อ:

- อ่าน tenant slug จาก host แบบ `tenant.booking.craftbikelab.com`
- block reserved slugs เช่น `booking`, `booking-admin`, `www`
- fallback ไป `NEXT_PUBLIC_SHOP_ID` สำหรับ:
  - `booking.craftbikelab.com`
  - `*.vercel.app`
  - local dev

ดังนั้น production ปัจจุบันยังเป็นแนว **one shop per deployment fallback เป็นหลัก** จนกว่าจะเปิด multi-tenant shop routing เต็มรูปแบบ

### apps/booking-admin: middleware.ts วิเคราะห์

ไฟล์: `apps/booking-admin/middleware.ts`

**Logic ปัจจุบัน:**

```
request เข้ามา
  ↓
ถ้า env vars ไม่ครบ → ผ่านไปเลย (fallback mode)
  ↓
ตรวจ Supabase Auth session ผ่าน cookie
  ↓
ถ้า ไม่มี user + เป็น /dashboard หรือ / → redirect /login
ถ้า มี user + เป็น /login → redirect /dashboard
  ↓
ผ่าน (พร้อม refresh cookie)
```

**Routes ที่ middleware ดูแล:**
- Protected: `/dashboard`, `/` (root), และทุก path ที่ขึ้นต้นด้วย `/dashboard`
- Auth route: `/login`
- Unprotected: `/unauthorized`, assets ทั้งหมด

**Matcher pattern:**
```ts
matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)']
```

pattern นี้ถูกต้อง — ครอบคลุม API routes และ pages ทั้งหมด ยกเว้น static assets

**ความพร้อมสำหรับ Vercel Edge Runtime:**

| ประเด็น | สถานะ |
|--------|-------|
| ใช้ `@supabase/ssr` | ✅ รองรับ Edge Runtime |
| ใช้ `next/server` (NextRequest, NextResponse) | ✅ รองรับ Edge Runtime |
| ไม่มี Node.js-only imports (fs, crypto ฯลฯ) | ✅ ไม่มี |
| Cookie handling pattern ถูกต้อง | ✅ ถูกต้อง |
| ไม่มี `export const runtime = 'nodejs'` | ✅ จะรันบน Edge โดย default |

**สรุป:** middleware พร้อม deploy บน Vercel Edge แล้ว ไม่ต้องแก้ไขอะไร

### เรื่อง Supabase Auth Cookie บน Production Domain

เมื่อ domain เปลี่ยนจาก `localhost` เป็น `booking-admin.craftbikelab.com` Supabase cookie จะผูกกับ domain ใหม่อัตโนมัติ ไม่ต้องแก้ไข code แต่ต้องตรวจสอบว่าใน Supabase dashboard:

1. ไปที่ **Authentication → URL Configuration**
2. **Site URL** ต้องตั้งเป็น `https://booking-admin.craftbikelab.com`
3. **Redirect URLs** ต้องเพิ่ม:
   - `https://booking-admin.craftbikelab.com/**`
   - `https://booking-admin.craftbikelab.com/dashboard`

---

## 6. Deployment Checklist

ทำตามลำดับนี้ทีละขั้น

### Phase A: เตรียม Supabase

- [ ] **A1.** เข้า Supabase dashboard → Project Settings → API → คัดลอก URL, anon key, service_role key ไว้พร้อม
- [ ] **A2.** รัน SQL query ดึง `shop_id` จริง: `SELECT id, name FROM bike_booking.shops;`
- [ ] **A3.** ตรวจสอบว่ามี user จริงในตาราง `shop_users` ที่ map กับ shop_id จริง
- [ ] **A4.** ไปที่ **Authentication → URL Configuration** ตั้ง Site URL เป็น `https://booking-admin.craftbikelab.com`
- [ ] **A5.** เพิ่ม Redirect URLs: `https://booking-admin.craftbikelab.com/**`

### Phase B: ตั้งค่า DNS

- [x] **B1.** Login DNS/provider และผูกโดเมนให้ทั้ง 2 projects จนใช้งานได้
- [ ] **B2.** ถ้ายังมี A record เก่าอยู่ ให้ normalize เป็น CNAME: `booking` → `cname.vercel-dns.com`
- [ ] **B3.** ถ้ายังมี A record เก่าอยู่ ให้ normalize เป็น CNAME: `booking-admin` → `cname.vercel-dns.com`
- [x] **B4.** ตอนนี้ domain ตอบแล้ว แต่ยังควรตรวจรูปแบบ record ให้ตรง best practice

### Phase C: Deploy apps/booking-consumer

- [x] **C1.** Project `craftbikelab-booking` ถูกสร้างแล้ว
- [x] **C2.** Root directory ถูกตั้งแล้ว
- [x] **C3.** Deploy ผ่านแล้ว
- [x] **C4.** Env vars หลักถูกใส่แล้ว
- [x] **C5.** Custom domain ถูกเพิ่มแล้ว
- [x] **C6.** `https://booking.craftbikelab.com` เปิดได้แล้ว
- [ ] **C7.** เปลี่ยน shop data จาก placeholder เป็นข้อมูลร้านจริง

### Phase D: Deploy apps/booking-admin

- [x] **D1.** Project `craftbikelab-booking-admin` ถูกสร้างแล้ว
- [x] **D2.** Root directory ถูกตั้งแล้ว
- [x] **D3.** Deploy ผ่านแล้ว
- [x] **D4.** Env vars หลักถูกใส่แล้ว
- [x] **D5.** Custom domain ถูกเพิ่มแล้ว
- [x] **D6.** `https://booking-admin.craftbikelab.com/login` เปิดได้แล้ว
- [ ] **D7.** ตรวจ login จริง + session persistence บน custom domain

### Phase E: Smoke Test

- [ ] **E1.** เปิด `https://booking.craftbikelab.com` → ต้องเห็นชื่อร้านจริง (ไม่ใช่ Bangkok Bike Care)
- [ ] **E2.** ทดสอบจองคิวจริง 1 รายการ ดูว่าข้อมูลเข้า Supabase
- [ ] **E3.** เปิด `https://booking-admin.craftbikelab.com` → ต้องถูก redirect ไป `/login`
- [ ] **E4.** Login ด้วย email/password จริง → ต้องเข้า `/dashboard` ได้
- [ ] **E5.** ตรวจ booking ที่เพิ่งจองปรากฏใน admin dashboard

---

## 7. Post-Deploy Verification

### 7.1 ตรวจ apps/booking-consumer

**URL ที่ต้องทดสอบ:**

| URL | ผลที่คาดหวัง |
|-----|-------------|
| `https://booking.craftbikelab.com` | เห็นหน้าจองคิว ชื่อร้านถูกต้อง |
| `https://booking.craftbikelab.com/success?id=[uuid]` | เห็นหน้ายืนยันการจอง |

**จุดที่ต้องตรวจ:**
- ชื่อร้านในหน้าแรกต้องเป็นชื่อจริง (ไม่ใช่ "Bangkok Bike Care" ซึ่งเป็น demo)
- บริการที่แสดงต้องตรงกับที่ตั้งค่าใน Supabase
- เลือกวัน/เวลาได้ตามเวลาทำการจริง
- กดจองแล้วได้รับ booking ID

**ตรวจสอบ Supabase หลังจอง:**
```sql
SELECT * FROM bike_booking.bookings ORDER BY created_at DESC LIMIT 5;
```

### 7.2 ตรวจ apps/booking-admin

**URL ที่ต้องทดสอบ:**

| URL | ผลที่คาดหวัง |
|-----|-------------|
| `https://booking-admin.craftbikelab.com` | redirect → `/login` |
| `https://booking-admin.craftbikelab.com/login` | เห็นหน้า login |
| `https://booking-admin.craftbikelab.com/dashboard` | (ถ้าไม่ login) redirect → `/login` |
| `https://booking-admin.craftbikelab.com/dashboard` | (ถ้า login แล้ว) เห็น dashboard |

**ทดสอบ auth flow:**
1. เปิด `/dashboard` โดยตรง → ต้องถูก redirect ไป `/login`
2. ใส่ email/password → login สำเร็จ → ถูก redirect ไป `/dashboard`
3. ดู bookings → ต้องเห็น booking จากการทดสอบ Phase E
4. ลอง login ผิดรหัส → ต้องเห็น toast error "เข้าสู่ระบบไม่สำเร็จ"

**ทดสอบ unauthorized:**
- ใช้ user ที่ไม่ได้อยู่ใน `shop_users` → ต้องถูก redirect ไป `/unauthorized`

### 7.3 ตรวจ SSL/TLS

ทั้ง 2 domains ต้องใช้ HTTPS — Vercel ออก SSL certificate ให้อัตโนมัติผ่าน Let's Encrypt หลัง DNS verify แล้ว ตรวจสอบได้ที่:
- Vercel Project Settings → Domains → ต้องเห็น status "Valid"

### 7.4 ตรวจ Cookie / Session

เปิด DevTools → Application → Cookies บน `booking-admin.craftbikelab.com` หลัง login:
- ต้องเห็น cookie ที่มีชื่อขึ้นต้นด้วย `sb-` (Supabase session cookie)
- ลอง refresh page → session ต้องยังอยู่ ไม่ถูก logout

### 7.5 ตรวจ Build Logs

ไปที่ Vercel → Project → Deployments → คลิก deployment ล่าสุด:
- ต้องไม่มี error ใน build log
- ต้องเห็น `✓ Compiled successfully`
- ตรวจ Functions tab ว่า middleware ถูก deploy เป็น Edge Function

---

## 8. สิ่งที่ต้องทำก่อน Multi-tenant (Phase ถัดไป)

รายการนี้ **ยังไม่ต้องทำตอน Phase 4** แต่บันทึกไว้เพื่อวางแผน:

### 8.1 Subdomain-based Shop Detection

ปัจจุบัน `apps/booking-consumer` มี middleware แล้ว แต่ยังพึ่ง `NEXT_PUBLIC_SHOP_ID` เป็น fallback สำคัญสำหรับ base domain / preview / local  
ถ้าจะให้หลายร้านใช้ระบบเดียวกันแบบ production-ready เต็มรูปแบบ ต้องยกระดับ middleware + shop lookup flow ต่อ:

และ `page.tsx`/server-side loader ต้องยึด slug จาก host เป็น primary path มากกว่า env-based default

### 8.2 Vercel Wildcard Domain

ต้องใช้ Vercel Pro plan ขึ้นไป และตั้งค่า wildcard domain ใน project settings

### 8.3 Production Data Cleanup

ก่อน open ให้ลูกค้าจริง:
- ตัดสินใจว่าจะเคลียร์ test bookings หรือไม่
- ลบ test user ออกจาก `shop_users` (ถ้ามี)
- ตรวจสอบ RLS policies ว่า anon user เห็นแค่ข้อมูลที่ควรเห็น

---

## สถานะก่อน Deploy

> อัปเดต: 1 พฤษภาคม 2026 — ผลการตรวจสอบความพร้อมก่อน deploy จริง

### สิ่งที่ตรวจสอบแล้ว (Auto-check)

**1. ไฟล์ .gitignore**

ตรวจสอบ `.gitignore` ทั้ง 3 ระดับ:

- **Root `.gitignore`** — ครบถ้วน ✅ มีทุก entry ที่จำเป็น: `.env.local`, `.env.*.local`, `node_modules`, `.next`
- **`apps/booking-consumer/.gitignore`** — ไม่มีไฟล์ → **สร้างใหม่แล้ว** ✅
- **`apps/booking-admin/.gitignore`** — ไม่มีไฟล์ → **สร้างใหม่แล้ว** ✅

ทั้ง 2 ไฟล์ใหม่ครอบคลุม: `node_modules/`, `.next/`, `.env`, `.env.local`, `.env.*.local`

**2. ไฟล์ .env.production.example**

อ่านค่าตัวแปรจาก `.env.local` ของทั้ง 2 app แล้วสร้างไฟล์ตัวอย่างพร้อมคำอธิบายภาษาไทย:

- **`apps/booking-consumer/.env.production.example`** — **สร้างใหม่แล้ว** ✅ (3 ตัวแปร)
- **`apps/booking-admin/.env.production.example`** — **สร้างใหม่แล้ว** ✅ (4 ตัวแปร รวม `SUPABASE_SERVICE_ROLE_KEY`)

ไฟล์เหล่านี้ commit ได้ เพราะไม่มีค่าจริง ใช้เป็น reference ตอนตั้งค่า Vercel

**3. ตรวจสอบ next.config.ts ทั้ง 2 apps**

| ประเด็น | apps/booking-consumer | apps/booking-admin |
|--------|--------------|------------|
| Hardcoded localhost URL | ✅ ไม่มี | ✅ ไม่มี |
| `output: 'export'` (ห้ามมีบน Vercel) | ✅ ไม่มี | ✅ ไม่มี |
| `outputFileTracingRoot` สำหรับ monorepo | ✅ ตั้งค่าถูกต้อง | ✅ ตั้งค่าถูกต้อง |
| Image domains config | ➖ ไม่ได้กำหนด | ➖ ไม่ได้กำหนด |

`outputFileTracingRoot: join(process.cwd(), "..")` ใน config ทั้งคู่ถูกต้องและจำเป็นสำหรับ Vercel monorepo — ไม่ต้องแก้ไข

ส่วน image domains ยังไม่ได้กำหนด — ดูหมายเหตุในหัวข้อ "สิ่งที่ผู้ใช้ต้องตรวจสอบเอง" ด้านล่าง

---

### สิ่งที่แก้ไขแล้ว (Auto-fix)

| ไฟล์ | การแก้ไข |
|------|---------|
| `apps/booking-consumer/.gitignore` | สร้างใหม่ — เพิ่ม node_modules, .next, .env*.local |
| `apps/booking-admin/.gitignore` | สร้างใหม่ — เพิ่ม node_modules, .next, .env*.local |
| `apps/booking-consumer/.env.production.example` | สร้างใหม่ — ตัวอย่างตัวแปร production พร้อมคำอธิบายไทย |
| `apps/booking-admin/.env.production.example` | สร้างใหม่ — ตัวอย่างตัวแปร production พร้อมคำอธิบายไทย |

ไม่มีการแก้ไข `next.config.ts` เพราะทั้ง 2 ไฟล์ถูกต้องอยู่แล้ว

---

### สิ่งที่ผู้ใช้ต้องทำเองที่คอมพิวเตอร์

#### ก่อน commit และ push โค้ด

**[1] ตรวจสอบว่า `.env.local` ไม่ถูก track โดย git**

เปิด terminal ในโฟลเดอร์ `bike-booking-saas` แล้วรัน:

```bash
git status
```

ต้องไม่เห็น `.env.local` หรือ `.env.*.local` ในรายการ "Changes to be committed" หรือ "Untracked files"  
ถ้าเห็น ให้รัน:

```bash
git rm --cached apps/booking-consumer/.env.local
git rm --cached apps/booking-admin/.env.local
```

**[2] Commit ไฟล์ใหม่ที่สร้างวันนี้**

```bash
git add apps/booking-consumer/.gitignore apps/booking-admin/.gitignore
git add apps/booking-consumer/.env.production.example apps/booking-admin/.env.production.example
git commit -m "chore: add gitignore and env.production.example for both apps"
git push
```

#### ก่อนสร้าง Vercel Project

**[3] ดึง Shop ID จริงจาก Supabase**

เข้า [Supabase SQL Editor](https://supabase.com/dashboard/project/gsbbkdppaegrttcqmjuq/sql) แล้วรัน:

```sql
SELECT id, name, slug FROM bike_booking.shops;
```

จดค่า `id` (UUID) ของร้านจริงไว้ ใช้แทน `NEXT_PUBLIC_SHOP_ID` ทั้ง 2 Vercel projects

**[4] คัดลอก keys จาก Supabase Dashboard**

ไปที่ Project Settings → API แล้วคัดลอก:
- **Project URL** → ใช้เป็น `NEXT_PUBLIC_SUPABASE_URL`
- **anon (public)** → ใช้เป็น `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **service_role (secret)** → ใช้เป็น `SUPABASE_SERVICE_ROLE_KEY` (เฉพาะ apps/booking-admin เท่านั้น ห้ามใส่ใน apps/booking-consumer)

**[5] ตรวจสอบ image domains (ถ้าใช้ Supabase Storage)**

ถ้า app มีการแสดงรูปภาพจาก Supabase Storage โดยใช้ component `<Image>` จาก `next/image` จะต้องเพิ่มใน `next.config.ts`:

```ts
const nextConfig: NextConfig = {
  outputFileTracingRoot: join(process.cwd(), ".."),
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "gsbbkdppaegrttcqmjuq.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};
```

ถ้าไม่ได้ใช้ `<Image>` กับ URL จาก Supabase Storage (ใช้แค่ `<img>` หรือไม่มีรูปจาก external URL) ไม่ต้องทำขั้นตอนนี้

#### ตั้งค่า Supabase Authentication

**[6] ตั้ง Supabase Auth Redirect URLs**

ไปที่ Supabase Dashboard → Authentication → URL Configuration:
- **Site URL:** ตั้งเป็น `https://booking-admin.craftbikelab.com`
- **Redirect URLs:** เพิ่ม `https://booking-admin.craftbikelab.com/**`

ขั้นตอนนี้จำเป็น — ถ้าไม่ตั้ง Supabase จะ block การ redirect หลัง login บน production domain

---

## อ้างอิง

- Supabase Project: [https://supabase.com/dashboard/project/gsbbkdppaegrttcqmjuq](https://supabase.com/dashboard/project/gsbbkdppaegrttcqmjuq)
- Vercel Monorepo Docs: [https://vercel.com/docs/monorepos](https://vercel.com/docs/monorepos)
- Supabase SSR Docs: [https://supabase.com/docs/guides/auth/server-side/nextjs](https://supabase.com/docs/guides/auth/server-side/nextjs)
- Next.js Middleware Edge Runtime: [https://nextjs.org/docs/app/building-your-application/routing/middleware](https://nextjs.org/docs/app/building-your-application/routing/middleware)

---

## Known Risks Before Go-Live

จาก Supabase advisors ยังมีประเด็นที่ควรเก็บในรอบถัดไป:

- `bike_booking.public_booking_slots` ถูกเตือนเรื่อง `SECURITY DEFINER` view
- หลาย function ใน `bike_booking` ยังเปิด execute ผ่าน exposed API schema ได้
- leaked password protection ของ Supabase Auth ยัง disabled
- `shop_users.user_id` foreign key ยังไม่มี covering index
- RLS บาง policy ยังมี perf warning เรื่อง repeated auth evaluation / multiple permissive policies

รายการพวกนี้ไม่ใช่ blocker ของการเปิดหน้าเว็บ แต่เป็น **hardening / performance backlog** ที่ควรเก็บก่อนเปิดใช้จริงในวงกว้าง
