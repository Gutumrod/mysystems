# SESSION_NOTES_V27 - KMO Tenant Flow Cleanup and Onboarding Fixup

วันที่: 2026-05-03
โปรเจกต์: Bike Booking SaaS
ต่อจาก: V26 (Tenant-aware Admin Routing for KMORackBarCustom)

---

## โฟกัสของ Session นี้

Session นี้เป็นการเก็บงานต่อจาก V26 โดยโฟกัสให้ร้าน `KMORackBarCustom` ใช้แนวทาง multi-tenant ศูนย์กลางเดียวได้ชัดขึ้น และทำเอกสาร onboarding ให้พร้อมใช้งานจริงมากขึ้น

---

## สิ่งที่ทำต่อจาก V26

### 1) ตรวจสอบแนวทาง multi-tenant ของทั้ง customer และ admin

ยืนยันว่าแนวทาง routing ตอนนี้เป็นแบบศูนย์กลางเดียวแล้ว:

- customer app อ่านร้านจาก host / slug
- admin app อ่านร้านจาก host / slug เช่นกัน
- local dev ยังมี fallback ไป `NEXT_PUBLIC_SHOP_ID`
- production route จะอาศัย subdomain ของร้าน

### 2) เก็บงาน onboarding ของ KMO ให้ใช้งานจริง

อัปเดตไฟล์ onboarding ของร้าน `KMORackBarCustom` ให้สะอาดและใช้อ้างอิงต่อได้ง่ายขึ้น:

- `docs/ONBOARDING_KMORACKBARCUSTOM.md`

สิ่งที่ปรับ:

- แยก SQL template ออกเป็นส่วนที่อ่านง่าย
- เอาขั้นตอนสร้าง owner account ออกมาจาก code block ที่ปนกัน
- อัปเดตสถานะร้านให้ตรงกับของที่ทำไปแล้ว
- ระบุว่าร้านมี owner ผูกแล้ว

### 3) บันทึกแผน multi-tenant scaling สำหรับรอบต่อไป

เก็บแนวทางศูนย์กลางเดียวไว้ในเอกสาร:

- `docs/MULTI_TENANT_SCALING_PATH.md`

เพื่อใช้เป็น reference สำหรับ onboarding ร้านใหม่ร้านถัดไป

---

## สถานะของ KMO ตอนนี้

- shop `KMORackBarCustom` ถูก bootstrap แล้ว
- service เริ่มต้นถูกสร้างแล้ว
- owner account ถูกสร้างแล้ว
- owner ถูกผูกกับ `shop_users` แล้ว
- customer/admin ใช้แนวทาง tenant-aware แล้ว

---

## สิ่งที่ยังต้องเทส/ต่อยอด

1. เทส customer URL จริงบน deployment ที่ผูก subdomain แล้ว
2. เทส admin URL จริงบน deployment ที่ใช้งานได้
3. เทส flow จองจริงหลายรอบให้มั่นใจว่า capacity / booking rules ยังนิ่ง
4. วาง flow onboarding ร้านถัดไปให้ใกล้ self-service มากขึ้น

---

## ข้อสังเกต

- local host custom domain ยังอาจมีข้อจำกัดของ dev server
- production deployment และ domain routing ยังเป็นจุดที่ต้องยืนยันอีกที
- ฐานข้อมูลและแผน routing ตอนนี้พร้อมขึ้นมากสำหรับ multi-tenant

---

## สรุป

ตอนนี้ KMO อยู่บนเส้นทาง multi-tenant ศูนย์กลางเดียวเรียบร้อยแล้วในระดับโครงสร้าง
สิ่งที่เหลือคือการเทสบน deployment จริง และเก็บ flow onboarding ให้ต่อร้านใหม่ได้ง่ายขึ้นในรอบถัดไป
