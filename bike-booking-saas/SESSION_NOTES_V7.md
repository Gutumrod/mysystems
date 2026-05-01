# SESSION NOTES V7 — Phase 4 เริ่มต้น

> วันที่: 1 พฤษภาคม 2569 (2026-05-01)

---

## สถานะเริ่มต้น

- Phase 3 เสร็จสมบูรณ์ (จาก V6)
- โค้ดทำงานกับ Supabase จริงแล้ว
- ยังไม่มี git repo, ยังไม่ deploy

---

## สิ่งที่ทำในเซสชันนี้ (Phase 4 เริ่มต้น)

### 1. วางแผน Deploy (`DEPLOY_PLAN.md`)

- ตัดสินใจ subdomain naming convention:
  - `booking.craftbikelab.com` → customer (wildcard `*.booking.craftbikelab.com` สำหรับแต่ละร้าน)
  - `booking-admin.craftbikelab.com` → admin
- Domain registrar: **Hostinger**
- Vercel projects: `craftbikelab-booking` และ `craftbikelab-booking-admin`

### 2. ตั้ง Namespace Strategy สำหรับ Multi-SaaS

- Pattern: `[product].craftbikelab.com` และ `[product]-admin.craftbikelab.com`
- เช่น ถ้ามี SaaS ตัวใหม่: `crm.craftbikelab.com`, `crm-admin.craftbikelab.com`
- ป้องกันชนกับ subdomain ในอนาคต

### 3. เตรียม Production Files

- สร้าง `.gitignore` ให้ `apps/booking-consumer` และ `apps/booking-admin`
- สร้าง `.env.production.example` ทั้ง 2 apps พร้อมคำอธิบายภาษาไทย
- ตรวจ `next.config.ts` — พร้อม Vercel แล้ว ไม่ต้องแก้

### 4. Monorepo Structure

- เปลี่ยนจาก `shop-frontend/` และ `shop-admin/` เป็น:
  - `apps/booking-consumer/` → booking.craftbikelab.com
  - `apps/booking-admin/` → booking-admin.craftbikelab.com
- อัปเดต `next.config.ts` path (outputFileTracingRoot ลึกขึ้น 1 ระดับ)
- อัปเดต root `package.json` workspaces

### 5. Push ขึ้น GitHub

- Repo: https://github.com/Gutumrod/mysystems.git
- โฟลเดอร์ใน repo: `bike-booking-saas/`
- Commit สุดท้าย: `refactor: rename to apps/booking-consumer and apps/booking-admin`

---

## ทีม AI ที่ใช้ในเซสชัน

| เครื่องมือ | บทบาท |
|---|---|
| Claude (Cowork) | Orchestrate, วางแผน, แก้ไฟล์ |
| Codex CLI | Available |
| Gemini CLI | Available |
| Ollama: gemma4:e4b, qwen3:8b | Available (local) |

---

## ขั้นตอนต่อไป (Phase 4 ที่เหลือ)

1. **Vercel Setup** — สร้าง 2 projects, ตั้ง root directory
2. **Environment Variables** — ใส่ค่าจริงใน Vercel dashboard (อ้างอิง `.env.production.example`)
3. **Hostinger DNS** — เพิ่ม CNAME records:
   - `booking` → `cname.vercel-dns.com`
   - `booking-admin` → `cname.vercel-dns.com`
   - `*.booking` → `cname.vercel-dns.com`
4. **Supabase Auth** — อัปเดต Redirect URLs ให้ชี้ production domain
5. **Staging Verification** — ทดสอบ booking flow, admin login, cookie
6. **Production Cleanup** — ลบ test data, ใส่ข้อมูลร้านจริง

---

## แผนอื่น (ทำทีหลัง)

- สมุดบันทึกโปรเจค (Project Handbook) ใน `mysystems/` — สารบัญโปรเจคทั้งหมด, URL, stack, สถานะ

---

## ไฟล์สำคัญที่สร้างวันนี้

| ไฟล์ | คำอธิบาย |
|---|---|
| `DEPLOY_PLAN.md` | แผน deploy ฉบับสมบูรณ์ |
| `apps/booking-consumer/.env.production.example` | ตัวอย่าง env vars สำหรับ consumer app |
| `apps/booking-admin/.env.production.example` | ตัวอย่าง env vars สำหรับ admin app |
| `apps/booking-consumer/.gitignore` | gitignore สำหรับ consumer app |
| `apps/booking-admin/.gitignore` | gitignore สำหรับ admin app |
