# SESSION NOTES V59

## Path
- repo: `/Users/wachirayachankhonkan/Documents/Codex/2026-05-09/users-wachirayachankhonkan-library-cloudstorage-googledrive-titazmth/repo-check-mysystems/bike-booking-saas`

## สรุปงาน
- เพิ่มข้อควรระวังสำคัญให้ทุกเครื่อง / ทุกคนเห็นในเอกสารเริ่มงานกลาง
- ย้ำสถานะ Supabase live project `gsbbkdppaegrttcqmjuq` ว่า apply migration `20260510000009_signup_requests.sql` แล้ว
- ย้ำให้ดู backup / verification note ที่ `docs/SUPABASE_LIVE_BACKUP_20260510_SIGNUP_REQUESTS.md`
- ย้ำ Supabase advisor warnings ที่ต้องแก้ต่อ:
  - `SECURITY DEFINER` functions callable ผ่าน exposed RPC roles
  - `default_signup_working_hours()` mutable search path
  - foreign keys ของ `signup_requests` ที่ยังไม่มี covering indexes
  - RLS policy ที่ควร optimize เป็น `(select auth.uid())`

## ไฟล์ที่แตะ
- `START_HERE.md`
- `docs/WORKSPACE_RULES.md`
- `SESSION_NOTES_CURRENT.md`
- `SESSION_NOTES_V59.md`

## ขอบเขตที่ยืนยัน
- ทำเฉพาะ `bike-booking-saas`
- ไม่แตะ `Chatbot/`
- ไม่แก้ Supabase schema เพิ่มในรอบนี้

## ข้อความเตือนที่เพิ่ม
- ห้ามลบ จนกว่าจะแก้ไขเสร็จ แล้วซิงค์ทั้งหมด

## ลงชื่อ
- codex
