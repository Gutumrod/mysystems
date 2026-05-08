# SESSION_NOTES_V28 - KMORackBarCustom Launch Checklist

วันที่: 2026-05-04
โปรเจกต์: Bike Booking SaaS
ต่อจาก: V27 (KMO Tenant Flow Cleanup and Onboarding Fixup)

---

## สิ่งที่ทำใน session นี้

### 1) สร้าง launch checklist สำหรับ KMO

เพิ่มไฟล์เช็กลิสต์แบบติ๊กได้เพื่อใช้ตรวจความพร้อมก่อนปล่อยร้านใช้งานจริง:

- `docs/LAUNCH_CHECKLIST_KMORACKBARCUSTOM.md`

เนื้อหาครอบคลุม:

- domain / deploy
- Supabase / database
- customer flow
- admin flow
- business rules
- data / safety
- device / UX
- smoke test ก่อนเปิดจริง
- ข้อมูลที่ต้องเตรียมจากร้าน
- เกณฑ์ผ่านก่อน go-live

---

## สถานะของ KMO ตอนนี้

- shop ถูกสร้างแล้ว
- owner ถูกผูกแล้ว
- customer/admin อ้างอิง tenant ได้แล้วในโค้ด
- เอกสาร onboarding พร้อมใช้งาน
- มี checklist สำหรับ go-live แล้ว

---

## สิ่งที่ควรทำต่อ

1. ไล่ checklist ทีละข้อก่อนปล่อยจริง
2. เทส customer/admin บน deployment จริง
3. เก็บผลทดสอบลง session note ถัดไป
4. ถ้าพบจุดเสี่ยง ให้ backup ก่อนแก้

