# SESSION_NOTES_V26 - Tenant-aware Admin Routing for KMORackBarCustom

วันที่: 2026-05-03
โปรเจกต์: Bike Booking SaaS
ต่อจาก: V25 (Multi-Tenant Onboarding, Capacity Limits & KMORackBarCustom Bootstrap)

---

## โฟกัสของ Session นี้

Session นี้เน้นทำให้ร้าน `KMORackBarCustom` ใช้งานแนวทาง multi-tenant ศูนย์กลางเดียวได้จริงมากขึ้น โดยเฉพาะฝั่ง admin ที่ก่อนหน้านี้ยังผูกกับ `NEXT_PUBLIC_SHOP_ID`

---

## สิ่งที่ทำเสร็จแล้ว

### 1) ทำ admin ให้ tenant-aware

เพิ่มการอ่านร้านจากโดเมน/slug ในฝั่ง admin:

- `apps/booking-admin/middleware.ts`
  - แยก tenant slug จาก host
  - รองรับ subdomain แบบ `kmorackbarcustom-admin.craftbikelab.com`
  - ส่ง `x-shop-slug` เข้า request headers
- `apps/booking-admin/lib/tenant.ts`
  - helper สำหรับ resolve ร้านจาก `x-shop-slug`
  - fallback ไป `NEXT_PUBLIC_SHOP_ID` เมื่อไม่มี tenant slug
- `apps/booking-admin/app/page.tsx`
  - login landing ตรวจสิทธิ์ shop ตาม tenant ปัจจุบัน
- `apps/booking-admin/app/(dashboard)/layout.tsx`
  - layout ตรวจ membership จาก shop ของ tenant จริง

### 2) เปลี่ยนหน้าหลักใน admin ให้ใช้ tenant context

อัปเดตหน้าสำคัญให้ query ข้อมูลจาก shop ที่ถูกต้อง:

- `apps/booking-admin/app/(dashboard)/dashboard/page.tsx`
- `apps/booking-admin/app/(dashboard)/bookings/page.tsx`
- `apps/booking-admin/app/(dashboard)/calendar/page.tsx`
- `apps/booking-admin/app/(dashboard)/services/page.tsx`
- `apps/booking-admin/app/(dashboard)/settings/shop/page.tsx`
- `apps/booking-admin/app/(dashboard)/settings/schedule/page.tsx`
- `apps/booking-admin/app/(dashboard)/today/page.tsx`

ผลลัพธ์:

- admin app ไม่ควรผูกกับร้านเดิมอย่างเดียวอีกต่อไป
- ถ้ารันบน subdomain ของร้าน KMO จะอ่าน shop ของร้านนั้น
- ถ้า local dev ยังไม่มี slug ก็ยัง fallback ได้

### 3) KMO shop bootstrap และ onboarding

ก่อนหน้านี้ใน session เดิมสร้างร้าน `KMORackBarCustom` ไว้แล้ว:

- shop id: `a20672f2-59a7-4b4f-99da-0065ae98b73d`
- subscription: `trial`
- service ตั้งต้น 3 รายการ
- owner ผูกกับ `kmowork2017@gmail.com`

ไฟล์ที่เกี่ยวข้อง:

- `supabase/bootstrap_kmorackbarcustom.sql`
- `docs/ONBOARDING_KMORACKBARCUSTOM.md`
- `docs/MULTI_TENANT_SCALING_PATH.md`

### 4) Build/Lint ผ่าน

ตรวจแล้วผ่าน:

- `npm run lint`
- `npm run build`

---

## สิ่งที่สังเกตได้

### 1) Custom host ใน local dev ยังมี 500

ลองยิง request ด้วย host:

- `kmorackbarcustom.craftbikelab.com`
- `kmorackbarcustom-admin.craftbikelab.com`

ที่ `localhost` แล้วได้ `500 Internal Server Error`

ข้อสันนิษฐาน:

- น่าจะเป็นข้อจำกัดของ Next dev server / custom host ใน local มากกว่าตัว logic ฝั่ง tenant
- logic ใน build ยังผ่านแล้ว จึงน่าจะต้องไปทดสอบผ่าน deployment จริงหรือปรับ dev host policy เพิ่ม

### 2) Deployment ฝั่ง admin ยังไม่พร้อม

ตอนลองเปิดโดเมนจริงของ admin ยังเจอ:

- `DEPLOYMENT_NOT_FOUND`

จึงสรุปได้ว่า:

- โค้ดพร้อมขึ้นมาก
- แต่ deployment / domain routing ฝั่ง Vercel ยังต้องต่อให้ครบ

---

## ไฟล์ที่เพิ่ม/แก้ใน Session นี้

### เพิ่มใหม่

| ไฟล์ | หมายเหตุ |
|------|----------|
| `apps/booking-admin/lib/tenant.ts` | helper resolve tenant shop context |
| `SESSION_NOTES_V26.md` | บันทึก session ล่าสุด |

### แก้ไข

| ไฟล์ | หมายเหตุ |
|------|----------|
| `apps/booking-admin/middleware.ts` | ใส่ x-shop-slug routing |
| `apps/booking-admin/app/page.tsx` | login landing ใช้ tenant shop |
| `apps/booking-admin/app/(dashboard)/layout.tsx` | membership check ตาม tenant |
| `apps/booking-admin/app/(dashboard)/dashboard/page.tsx` | query ตาม tenant shop |
| `apps/booking-admin/app/(dashboard)/bookings/page.tsx` | query ตาม tenant shop |
| `apps/booking-admin/app/(dashboard)/calendar/page.tsx` | query ตาม tenant shop |
| `apps/booking-admin/app/(dashboard)/services/page.tsx` | query ตาม tenant shop |
| `apps/booking-admin/app/(dashboard)/settings/shop/page.tsx` | query ตาม tenant shop |
| `apps/booking-admin/app/(dashboard)/settings/schedule/page.tsx` | query ตาม tenant shop |
| `apps/booking-admin/app/(dashboard)/today/page.tsx` | query ตาม tenant shop |

---

## สรุปสถานะ ณ ตอนนี้

- KMO shop ถูกสร้างแล้ว
- owner ถูกผูกแล้ว
- admin app เริ่มอ่าน tenant จากโดเมนได้
- code base รองรับแนว multi-tenant มากขึ้น
- ของที่ยังต้องทำต่อคือ deployment ให้โดเมนจริงชี้มาที่ app ที่ถูกต้อง และเทสบน production

