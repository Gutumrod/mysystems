# SESSION NOTES V10 — Phase 4: Middleware & Deploy Verification

> วันที่: 1 พฤษภาคม 2569 (2026-05-01)

---

## สถานะก่อนเริ่ม V10

รับช่วงต่อจาก V9 sub-agent ที่ทำสิ่งต่อไปนี้สำเร็จแล้ว:

| Commit | สิ่งที่ทำ |
|--------|---------|
| `5de74b2` | `feat: add multi-tenant subdomain routing` — เพิ่ม `middleware.ts` ให้ `apps/booking-consumer` |
| `7e42699` | `fix: remove outputFileTracingRoot for Vercel compatibility` — ลบ config เพื่อทดสอบ |
| `e836d90` | `fix: correct outputFileTracingRoot for Vercel repo root` — ใส่กลับด้วย `../../..` |

**ผล V9:** `craftbikelab-booking` deploy บน Vercel สถานะ READY ✅ — build ผ่านทั้ง 2 apps

---

## สิ่งที่ทำใน V10

### 1. ตรวจสอบ Git Status

- Working tree **clean** — ไม่มีไฟล์ค้างที่ต้องสร้าง commit
- Branch: `claude/bold-zhukovsky-aa349c`
- Commit ล่าสุด: `e836d90` อยู่ที่ `origin/main` แล้ว — ไม่ต้อง push เพิ่ม

### 2. ตรวจสอบโค้ดคุณภาพ

**TypeScript type-check:**
```
apps/booking-consumer: 0 errors ✅
```

**เครื่องมือที่มีในเครื่อง:**
- `codex` CLI: ✅
- `gemini` CLI: ✅
- `ollama`: ✅

**Gemini Code Review — ประเด็นที่พบ:**

#### `middleware.ts` (apps/booking-consumer)
| ประเด็น | ระดับ | รายละเอียด |
|---------|------|-----------|
| Reserved subdomain collision | ⚠️ Medium | เมื่อผู้ใช้เข้า `booking.craftbikelab.com` โดยตรง → `slug = "booking"` ซึ่งไม่ใช่ tenant — ควรเพิ่ม guard ป้องกัน |
| Fragile split logic | ℹ️ Low | `host.split(".")[0]` ใช้ได้กับ `slug.booking.craftbikelab.com` แต่ล้มเหลวถ้ามี `www.` นำหน้า — ยังรับได้สำหรับ use case ปัจจุบัน |
| Local subdomain testing | ℹ️ Info | ทดสอบ `tenant.localhost:3000` ไม่ได้ — expected, ไม่ใช่ bug |

#### `next.config.ts` — `outputFileTracingRoot: join(process.cwd(), "../../..")`
| ประเด็น | สถานะ |
|---------|------|
| Gemini แนะนำ `../../` (2 ระดับ) | ❌ ไม่ถูก |
| ค่าปัจจุบัน `../../..` (3 ระดับ) | ✅ ถูกต้อง |

**เหตุผลที่ 3 ระดับถูกต้อง:** Vercel clone repo `mysystems` (git root) ทั้งหมด แล้ว build จาก `bike-booking-saas/apps/booking-consumer/` ดังนั้น:
```
apps/booking-consumer/  → ..  → apps/
apps/                   → ..  → bike-booking-saas/
bike-booking-saas/      → ..  → mysystems/  ← git repo root ✅
```
การตั้ง tracing root ที่ `mysystems/` ทำให้ Vercel bundling รวม shared dependencies ได้ถูกต้อง

### 3. ตรวจ Runtime จริง

| URL | HTTP Status | ผล |
|-----|------------|-----|
| `https://craftbikelab-booking.vercel.app` | **200 OK** ✅ | แสดงหน้า "ร้านค้าไม่พบ" — expected (ดูด้านล่าง) |
| `https://booking.craftbikelab.com` | **404** ⚠️ | DNS ยังไม่ได้ตั้งค่า |

**เหตุผลที่ "ร้านค้าไม่พบ" เป็น expected behavior:**

App ตอบ HTTP 200 และ render ได้ปกติ — แสดงว่า build/deploy ถูกต้อง  
"ร้านค้าไม่พบ" เกิดเพราะ:
1. URL เป็น `craftbikelab-booking.vercel.app` ไม่ใช่ `{slug}.booking.craftbikelab.com` → middleware ไม่ set `x-shop-slug` header
2. `NEXT_PUBLIC_SHOP_ID` ใน Vercel env ยังเป็น test UUID `11111111-1111-1111-1111-111111111111`
3. Supabase query หา shop ด้วย test ID ไม่เจอ → fallback "ร้านค้าไม่พบ"

---

## สิ่งที่ต้องทำต่อ (ขั้นตอนที่เหลือของ Phase 4)

### Priority 1 — ทำก่อน (ทำเองบน dashboard)

| ขั้นตอน | รายละเอียด |
|---------|-----------|
| **ตั้ง NEXT_PUBLIC_SHOP_ID จริงใน Vercel** | เข้า Supabase → SQL Editor → `SELECT id, name FROM bike_booking.shops;` → copy UUID → ใส่ใน Vercel project settings |
| **ตั้ง DNS บน Hostinger** | CNAME `booking` → `cname.vercel-dns.com` |
| **ตั้ง Supabase Auth Redirect URL** | Authentication → URL Config → Site URL: `https://booking-admin.craftbikelab.com` |

### Priority 2 — Code fix (ควรทำก่อน go-live)

**เพิ่ม reserved subdomain guard ใน `apps/booking-consumer/middleware.ts`:**

```typescript
// ป้องกัน base domain และ Vercel preview URLs
const RESERVED_SLUGS = new Set(["booking", "www", "staging", "preview"]);
const isVercelPreview = host.endsWith(".vercel.app");

const slug =
  isLocalDev || isVercelPreview || RESERVED_SLUGS.has(host.split(".")[0])
    ? null
    : host.split(".")[0];
```

### Priority 3 — ทำทีหลัง

- Deploy `apps/booking-admin` บน Vercel (ยังไม่ได้ทำ)
- ตั้ง DNS `booking-admin` → `cname.vercel-dns.com`
- End-to-end smoke test ตาม checklist ใน `DEPLOY_PLAN.md`

---

## สถานะ Deployment สรุป

| App | Vercel Project | Status | Custom Domain |
|-----|--------------|--------|--------------|
| `apps/booking-consumer` | `craftbikelab-booking` | ✅ READY (build ผ่าน) | ⚠️ DNS pending |
| `apps/booking-admin` | `craftbikelab-booking-admin` | ❓ ยังไม่ได้ setup | ❌ ยังไม่ได้ตั้ง |

---

## ไฟล์สำคัญที่เกี่ยวข้อง

| ไฟล์ | สถานะ | หมายเหตุ |
|------|-------|---------|
| `apps/booking-consumer/middleware.ts` | ✅ Committed | Multi-tenant subdomain routing |
| `apps/booking-consumer/next.config.ts` | ✅ Committed | `outputFileTracingRoot: ../../..` (3 levels — ถูกต้อง) |
| `apps/booking-consumer/vercel.json` | ✅ Committed | `{"framework": "nextjs"}` |
| `apps/booking-consumer/.env.production.example` | ✅ Committed | Reference สำหรับตั้ง Vercel env vars |
| `DEPLOY_PLAN.md` | ✅ Committed | แผน deploy ฉบับสมบูรณ์ พร้อม checklist |

---

## ทีม AI ที่ใช้ใน V10

| เครื่องมือ | บทบาท |
|-----------|------|
| Claude Sonnet 4.6 (sub-agent) | Orchestrate, ตรวจสอบ, เขียน session notes |
| Gemini CLI | Code review — middleware.ts และ next.config.ts |
