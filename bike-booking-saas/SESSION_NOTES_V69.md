# SESSION NOTES V69

## วันที่

- 2026-07-04

## เหตุการณ์หลัก

ผู้ใช้ต้องการเอกสารภาพรวมปัจจุบันของโปรเจกต์ เพราะต้องการจำให้ได้ว่าโปรเจกต์ชื่ออะไร ทำถึงไหนแล้ว มีลิงก์อะไรบ้าง ใช้ stack อะไร อยู่ตรงไหน และ repo คืออะไร

## สิ่งที่ตรวจจากเครื่องจริง

- repo root: `C:\Users\Win10\Documents\mysystems`
- project root: `C:\Users\Win10\Documents\mysystems\bike-booking-saas`
- branch ปัจจุบัน: `review-signup-form-v67`
- remote: `https://github.com/Gutumrod/mysystems.git`
- commit ล่าสุดของ branch: `d191992 docs: prepare claude sales handoff`
- `origin/main`: `ff4a4ab feat(bike-booking-saas): implement dynamic subdomain routing, onboarding UI/DB procedure, and Thai manuals`

## สิ่งที่ตรวจจาก live URL

- `https://kmorackbarcustom.craftbikelab.com/` เปิดได้ `200`
- `https://kmorackbarcustom-admin.craftbikelab.com/login` เปิดได้ `200`
- `https://control.craftbikelab.com/login` เปิดได้ `200`
- `https://control.craftbikelab.com/signup` ได้ `404`

## สิ่งที่ตรวจจาก live Supabase

- project ref: `gsbbkdppaegrttcqmjuq`
- platform user: 1 คน
- role: `super_admin`
- shop: `KMO RACK BAR CUSTOM`
- slug: `kmorackbarcustom`
- shop id: `a20672f2-59a7-4b4f-99da-0065ae98b73d`
- shop status: `active`
- active services: 6
- bookings: 7
- signup requests: 0

## สิ่งที่ตรวจด้วย command

ผ่าน:

```bash
npm run lint
npm run build
```

## สิ่งที่เพิ่ม/แก้ในรอบนี้

เพิ่ม:

- `docs/PROJECT_CURRENT_OVERVIEW.md`

อัปเดต:

- `README.md`
- `START_HERE.md`
- `SESSION_NOTES_CURRENT.md`

## สรุปสถานะ

แกนระบบ booking/customer/shop admin/platform admin ใช้งานได้ระดับ demo/controlled pilot แล้ว

จุดที่ต้องแก้ก่อนขายจริง:

- `control.craftbikelab.com/signup` ยังได้ `404`
- Telegram notification ยังเป็น untracked work และต้อง review/security/test ก่อน
- billing data ของ KMO ยังเป็นข้อมูลทดสอบ: `billing_due_date = 2026-05-17`, `expires_at = 2027-05-10`
- ห้าม merge `origin/main` ตรงๆ จนกว่าจะทำ merge-cleanup

## ลงชื่อ

- codex
