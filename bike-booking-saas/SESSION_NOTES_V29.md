# SESSION_NOTES_V29 - KMO Domain Status Check

วันที่: 2026-05-04
โปรเจกต์: Bike Booking SaaS
ต่อจาก: V28 (KMORackBarCustom Launch Checklist)

---

## สิ่งที่ตรวจใน session นี้

### 1) ตรวจสถานะโดเมนจริงบน Vercel

ผลที่ยืนยันได้จาก `curl.exe -I`:

- `https://booking.craftbikelab.com` → `200 OK`
- `https://booking-admin.craftbikelab.com/login` → `404 DEPLOYMENT_NOT_FOUND`
- `https://kmorackbarcustom.craftbikelab.com` → `404 DEPLOYMENT_NOT_FOUND`
- `https://kmorackbarcustom-admin.craftbikelab.com/login` → `404 DEPLOYMENT_NOT_FOUND`

### 2) สรุปสาเหตุของ error ที่เห็น

error ที่เจอใน browser ไม่ใช่บั๊กในหน้า booking โดยตรง
แต่เป็นปัญหาระดับ deployment/domain mapping:

- customer base deployment มีอยู่แล้ว
- custom domain ของ KMO ยังไม่ถูกผูกกับ deployment
- admin domain ของ KMO ก็ยังไม่ถูกผูกเช่นกัน

---

## สิ่งที่ยืนยันได้

- โค้ดฝั่ง customer ยังมี deployment ใช้งานได้บน `booking.craftbikelab.com`
- custom host ของ KMO ยังไม่พร้อมใช้งานจริง
- admin host ของระบบยังไม่พร้อมใช้งานจริงบนโดเมนที่คาดหวัง

---

## สิ่งที่ควรทำต่อ

1. ไปที่ Vercel project ของ customer
2. เพิ่ม domain `kmorackbarcustom.craftbikelab.com`
3. ไปที่ Vercel project ของ admin
4. เพิ่ม domain `kmorackbarcustom-admin.craftbikelab.com`
5. ตรวจ DNS CNAME ให้ชี้ `cname.vercel-dns.com`
6. รอ verify แล้วทดสอบใหม่

---

## ข้อสังเกต

- ปัญหานี้ไม่ใช่การแก้ UI หน้า booking โดยตรง
- เป็นเรื่องการ map domain → deployment ให้ตรง
- ถ้า domain ยังไม่ถูกเพิ่มใน Vercel ต่อให้โค้ดพร้อม ก็ยังเปิดไม่ได้

