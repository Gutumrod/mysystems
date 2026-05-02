# SESSION NOTES V10 — Phase 4: Verify, Fix & Admin Deploy Prep

> วันที่: 1 พฤษภาคม 2569 (2026-05-01)
> Sub-agent: Claude Sonnet 4.6

---

## เป้าหมาย

รับช่วงต่อจาก V9 เพื่อ:

1. ยืนยันว่า V9 changes push ขึ้น GitHub แล้ว
2. ตรวจคุณภาพโค้ดด้วย TypeScript + Gemini CLI
3. ตรวจ runtime จริงบน Vercel
4. สร้าง Vercel project สำหรับ `apps/booking-admin`
5. บันทึก session notes ฉบับสมบูรณ์

---

## สถานะรับช่วงต่อจาก V9

V9 sub-agent ทำ 3 commits สำเร็จและ push ขึ้น `origin/main` แล้ว:

| Commit | สิ่งที่ทำ |
|--------|---------|
| `5de74b2` | `feat: add multi-tenant subdomain routing` — เพิ่ม `middleware.ts` ใน `apps/booking-consumer` รองรับ 3 โหมด |
| `7e42699` | `fix: remove outputFileTracingRoot for Vercel compatibility` — ลบทดสอบ |
| `e836d90` | `fix: correct outputFileTracingRoot for Vercel repo root` — ใส่กลับเป็น `../../..` (3 ระดับ) |

ผล V9: `craftbikelab-booking` บน Vercel สถานะ **READY** ✅ — build ผ่านทั้ง 2 apps

---

## สิ่งที่ทำใน V10

### 1. ยืนยัน Git Status (push แล้ว)

```
git status → working tree clean ✅
git log origin/main → e836d90 ตรงกับ local HEAD ✅
```

V9 changes อยู่ใน `origin/main` เรียบร้อย ไม่มีอะไรค้างต้อง push

---

### 2. ตรวจสอบโค้ดคุณภาพ

**TypeScript type-check:**
```bash
cd apps/booking-consumer && npx tsc --noEmit
# → 0 errors ✅
```

**เครื่องมือ AI ที่มีในเครื่อง (ตรวจสอบครั้งแรก):**

| CLI | สถานะ |
|-----|------|
| `codex` | ✅ พร้อมใช้ |
| `gemini` | ✅ พร้อมใช้ |
| `ollama` | ✅ พร้อมใช้ |

**Gemini Code Review ผล:**

#### ประเด็นที่ 1: `outputFileTracingRoot` — False Alarm ✅

Gemini แนะนำให้เปลี่ยนจาก `../../..` เป็น `../../` แต่หลังวิเคราะห์โครงสร้างจริง ค่าปัจจุบันถูกต้องแล้ว:

```
apps/booking-consumer/  ─(..)/→  apps/
apps/                   ─(..)/→  bike-booking-saas/
bike-booking-saas/      ─(..)/→  mysystems/  ← git repo root
```

Vercel clone repo `mysystems` ทั้งหมด → tracing root ต้องอยู่ที่ `mysystems/` (3 ระดับขึ้น) ไม่ใช่แค่ `bike-booking-saas/` (2 ระดับ) → **ไม่ต้องแก้**

#### ประเด็นที่ 2: Reserved Subdomain Collision — Real Bug ⚠️ → แก้แล้ว ✅

ปัญหา: เมื่อผู้ใช้เข้า `booking.craftbikelab.com` (base domain) หรือ `craftbikelab-booking.vercel.app` (Vercel preview) — middleware เดิมจะ extract slug ได้ว่า `"booking"` หรือ `"craftbikelab-booking"` และส่งเป็น `x-shop-slug` header ทำให้ query Supabase ด้วย slug ที่ไม่มีอยู่จริง

**การแก้ (commit `f6b857c`):**

```typescript
// Platform subdomains ที่ไม่ใช่ tenant
const RESERVED_SLUGS = new Set([
  "booking", "booking-admin", "www",
  "staging", "preview", "api",
]);

// *.vercel.app preview deployments
const isVercelPreview = host.endsWith(".vercel.app");

const rawSlug = host.split(".")[0];

// slug = null → fallback ไป NEXT_PUBLIC_SHOP_ID
const slug =
  isLocalDev || isVercelPreview || RESERVED_SLUGS.has(rawSlug)
    ? null
    : rawSlug;
```

---

### 3. ตรวจ Runtime จริงบน Vercel

| URL | HTTP | ผล | หมายเหตุ |
|-----|-----|----|---------|
| `https://craftbikelab-booking.vercel.app` | **200** ✅ | "ร้านค้าไม่พบ" | Expected — ดูด้านล่าง |
| `https://booking.craftbikelab.com` | **404** ⚠️ | Not found | DNS ยังไม่ตั้ง |

**ทำไม "ร้านค้าไม่พบ" ถึงเป็น expected:**

App render ได้ปกติ (200 OK) — หมายความว่า build/deploy ถูกต้องทุกอย่าง  
"ร้านค้าไม่พบ" เกิดจาก:
- URL ไม่มี tenant prefix → ไม่มี `x-shop-slug` header
- `NEXT_PUBLIC_SHOP_ID` ใน Vercel ยังเป็น test UUID `11111111-...-1111`
- Supabase query ไม่เจอ shop → fallback error state

แก้ได้ด้วยการใส่ `NEXT_PUBLIC_SHOP_ID` จริงใน Vercel env vars

---

### 4. สร้าง Vercel Project สำหรับ booking-admin

**ผลการค้นหา Vercel Token:**

| ที่ตรวจ | ผล |
|--------|---|
| `VERCEL_TOKEN` env var | ❌ ไม่มี |
| `~/.config/vercel/auth.json` | ❌ ไม่มี |
| `AppData/Roaming/com.vercel.cli/auth.json` | ❌ ไม่มี |
| `.env*` files ในโปรเจค | ❌ ไม่มี |

**สรุป: ไม่สามารถสร้าง project ผ่าน API ได้ ต้องทำเองหรือสร้าง token ก่อน**

ข้อมูลที่เตรียมไว้พร้อมเพื่อใช้ตอนสร้าง:
- Team ID: `team_rdPAt9hlvE3YmKS71wGy4jfx`
- Project name: `craftbikelab-booking-admin`
- Root Directory: `bike-booking-saas/apps/booking-admin`
- Repo: `mysystems` (GitHub)

---

### 5. Vercel Project สำหรับ booking-admin (ทำผ่าน API)

สร้างสำเร็จด้วย Vercel REST API:
- **Project ID:** `prj_lrPPLPzWHiKTAfGgNpIz5LCRaCXu`
- **Project Name:** `craftbikelab-booking-admin`
- **Root Directory:** `bike-booking-saas/apps/booking-admin`
- **Repo:** `Gutumrod/mysystems` (GitHub, repoId: `1173527362`)

Env vars ที่ตั้งไว้:

| Variable | ค่า | targets |
|----------|-----|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://gsbbkdppaegrttcqmjuq.supabase.co` | production,preview,development |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGci...uWc` (JWT) | production,preview,development |
| `NEXT_PUBLIC_SHOP_ID` | `f9080dd8-9070-473c-9ff9-8e8a636bbdec` | production,preview,development |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJ2IjoidjIi...` (v2 encrypted) | production,preview,development |

Admin deployment: **✅ HTTP 307 → /login** (auth guard working)

---

### 6. แก้ Root Cause — Consumer แสดง "ร้านค้าไม่พบ"

**ปัญหา:** `craftbikelab-booking.vercel.app` แสดง "ร้านค้าไม่พบ" ทั้งๆ ที่ schema และ shop data ใช้งานได้

**Root Cause:** `NEXT_PUBLIC_SUPABASE_URL` และ `NEXT_PUBLIC_SUPABASE_ANON_KEY` บน consumer project เป็น **empty string** (ตั้งผิดในช่วง session ก่อน V9) ทำให้ `hasSupabaseEnv()` return false → app ใช้ demo mode แต่ไม่มี subdomain → ไม่ได้ทำ Supabase query เลย

**การแก้:**
1. ลบ env vars เก่าที่ว่างเปล่า (`ji1zYtKb4V1lnZzL`, `lMB34rM4to7Ju1l6`)
2. เพิ่ม `NEXT_PUBLIC_SUPABASE_URL = https://gsbbkdppaegrttcqmjuq.supabase.co` (plain, ทุก target)
3. เพิ่ม `NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJhbGci...uWc` (plain, ทุก target)
4. Fix `server.ts` `setAll` ให้มี try-catch (Server Component cookie writes throw)
5. Trigger deployment ใหม่ด้วย SHA `d5e6289`

**ผล:** Consumer แสดง "ชื่อร้านจริงของคุณ" (ชื่อ shop จริงใน Supabase) — ✅ ทำงานถูกต้อง

---

### 7. Commits ที่ทำใน V10

| Commit | Message | ไฟล์ |
|--------|---------|------|
| `f6b857c` | `fix: add reserved slug blocklist to middleware` | `apps/booking-consumer/middleware.ts` |
| `04447c3` | `docs: add SESSION_NOTES_V10` | `SESSION_NOTES_V10.md` |
| `d5e6289` | `fix: add try-catch to supabase server client setAll` | `apps/booking-consumer/lib/supabase/server.ts` |

---

## สถานะ Deployment ณ สิ้น V10

| App | Vercel Project | Build | URL | Custom Domain |
|-----|--------------|-------|-----|--------------|
| `apps/booking-consumer` | `craftbikelab-booking` (prj_7Qwpwu9X6VJ0miN8pXLfb3fXrFWV) | ✅ READY | `craftbikelab-booking.vercel.app` → 200 ✅ | ⚠️ DNS pending |
| `apps/booking-admin` | `craftbikelab-booking-admin` (prj_lrPPLPzWHiKTAfGgNpIz5LCRaCXu) | ✅ READY | `craftbikelab-booking-admin.vercel.app` → 307 /login ✅ | ⚠️ DNS pending |

---

## สิ่งที่ค้าง (ก่อนปิด Phase 4)

### 🟡 ทำหลัง — DNS บน Hostinger

| Subdomain | Record | ชี้ไปที่ |
|-----------|--------|---------|
| `booking` | CNAME | `cname.vercel-dns.com` |
| `booking-admin` | CNAME | `cname.vercel-dns.com` |

จากนั้น Vercel Dashboard → เพิ่ม custom domain ให้แต่ละ project

### 🟡 ทำหลัง — Supabase Auth Config

ไปที่ Supabase Dashboard → Authentication → URL Configuration:
- **Site URL:** `https://booking-admin.craftbikelab.com`
- **Redirect URLs เพิ่ม:** `https://booking-admin.craftbikelab.com/**`

### 🟡 ทำหลัง — ใส่ข้อมูลร้านจริงใน Supabase

Shop `f9080dd8-9070-473c-9ff9-8e8a636bbdec` ยังมีชื่อ placeholder "ชื่อร้านจริงของคุณ" → ต้องอัปเดตใน Supabase ก่อน go-live

---

## สรุป

| หัวข้อ | ผล |
|-------|---|
| V9 push ยืนยัน | ✅ อยู่ใน origin/main แล้ว |
| TypeScript type-check | ✅ 0 errors |
| Gemini review — outputFileTracingRoot | ✅ false alarm, ค่าเดิม `../../..` ถูกต้อง |
| Gemini review — reserved slugs | ✅ แก้แล้ว commit `f6b857c` |
| Vercel project booking-admin | ✅ สร้างแล้ว + deployed ผ่าน API |
| bike_booking schema permissions | ✅ USAGE + SELECT grants ทำงาน |
| Consumer env vars แก้ไข | ✅ URL+KEY ว่างเปล่า → ใส่ค่าถูกต้องแล้ว |
| server.ts setAll try-catch | ✅ commit `d5e6289` |
| Runtime craftbikelab-booking.vercel.app | ✅ HTTP 200, แสดงข้อมูล shop จริงจาก Supabase |
| Runtime craftbikelab-booking-admin.vercel.app | ✅ HTTP 307 → /login |
| DNS booking.craftbikelab.com | ⚠️ ยังไม่ตั้ง (ต้องทำบน Hostinger) |
| DNS booking-admin.craftbikelab.com | ⚠️ ยังไม่ตั้ง (ต้องทำบน Hostinger) |
| SESSION_NOTES_V10.md | ✅ อัปเดตสมบูรณ์ |

Phase 4 โค้ดฝั่ง repository เสร็จสมบูรณ์ทั้งหมด เหลือเฉพาะ DNS + Supabase auth redirect URL + ใส่ข้อมูลร้านจริง
