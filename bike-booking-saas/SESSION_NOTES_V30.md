# SESSION_NOTES_V30 - KMORackBarCustom Customer Domain Live

วันที่: 2026-05-04
โปรเจกต์: Bike Booking SaaS
ต่อจาก: V29 (KMO Domain Status Check)

---

## สิ่งที่ตรวจใน session นี้

### 1) Customer domain ของ KMO เปิดได้แล้ว

ยืนยันจาก `curl.exe -I`:

- `https://kmorackbarcustom.craftbikelab.com/` → `200 OK`

### 2) Admin domain ยังไม่พร้อม

ยืนยันจาก `curl.exe -I`:

- `https://kmorackbarcustom-admin.craftbikelab.com/login` → `404 DEPLOYMENT_NOT_FOUND`

---

## สรุปสถานะ

- customer side ของ KMO ขึ้นแล้ว
- customer domain ถูกผูกกับ deployment ได้แล้ว
- admin side ยังต้องไปผูก domain / deployment ต่อ

---

## สิ่งที่ต้องทำต่อ

1. เปิด Vercel project ฝั่ง admin
2. ตรวจ root directory ให้เป็น `apps/booking-admin`
3. เพิ่ม domain `kmorackbarcustom-admin.craftbikelab.com`
4. ตรวจ DNS CNAME ให้ถูก
5. รอ verify แล้วเทส login อีกครั้ง

