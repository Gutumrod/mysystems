# Workspace Rules

เอกสารนี้คือกติกาใช้งานจริงของ `bike-booking-saas` สำหรับสลับเครื่องและส่งต่องานให้ไม่หลุด state

## ขอบเขตของงาน

- โปรเจกต์หลักที่ active คือ `bike-booking-saas`
- โฟลเดอร์ `Chatbot/` ที่อยู่ระดับ repo เดียวกันเป็นงานแยก
- ถ้าไม่ได้สั่งชัด ๆ ให้ทำงานกับ Chatbot ให้ **ignore** ไปเลย

## สิ่งที่ถือเป็น source of truth

- โค้ดจริง: GitHub `main`
- จุดเริ่มงาน: `START_HERE.md`
- สถานะงาน: `SESSION_NOTES_CURRENT.md`
- ข้อมูลวิธีทำงาน: `docs/WORKFLOW.md`
- แม่แบบส่งงาน: `HANDOFF_TEMPLATE.md`
- เช็กลิสต์ปล่อยงาน: `docs/POST_DEPLOY_CHECKLIST.md`

## เริ่มงานบนเครื่องใหม่

1. เปิด `START_HERE.md`
2. เปิด repo ที่ `mysystems`
3. `git pull origin main`
4. เข้า `bike-booking-saas`
5. เปิด `SESSION_NOTES_CURRENT.md`
6. ตรวจ `git status --short`
7. ถ้าต้องทำงานต่อ ให้ `npm install` และรัน workspace commands ของโปรเจกต์นี้เท่านั้น

## กติกาเวลาแก้โค้ด

- แก้เฉพาะใน `bike-booking-saas`
- อย่าแตะไฟล์ของ Chatbot ถ้าไม่ใช่งานนั้น
- ก่อนแตะ schema / auth / production config ให้ backup ก่อนเสมอ
- ก่อนปิดรอบ ให้ `git status` ต้องรู้ว่ามีอะไรค้างหรือไม่

## ข้อควรระวังสำคัญสำหรับทุกเครื่อง / ทุกคน

- Supabase live project `gsbbkdppaegrttcqmjuq` apply migration `20260510000009_signup_requests.sql` แล้ว และมี backup / verification note อยู่ที่ `docs/SUPABASE_LIVE_BACKUP_20260510_SIGNUP_REQUESTS.md`
- ยังมี Supabase advisor warnings ที่ต้องแก้ต่อ โดยเฉพาะ `SECURITY DEFINER` functions ที่ callable ผ่าน exposed RPC roles, `default_signup_working_hours()` mutable search path, foreign keys ของ `signup_requests` ที่ยังไม่มี covering indexes, และ RLS policy ที่ควร optimize เป็น `(select auth.uid())`
- ก่อนแก้ต่อให้ backup และ verify live DB ก่อนเสมอ ห้ามเดาสถานะจาก local migration อย่างเดียว
- ห้ามลบ จนกว่าจะแก้ไขเสร็จ แล้วซิงค์ทั้งหมด

## คำสั่งที่ใช้บ่อย

```bash
git pull origin main
git status --short
git log --oneline -5
npm install
npm --workspace apps/booking-admin run lint
npm --workspace apps/booking-admin run build
```

## ลำดับอ้างอิงเวลางง

1. `START_HERE.md`
2. `SESSION_NOTES_CURRENT.md`
3. `docs/WORKFLOW.md`
4. `docs/POST_DEPLOY_CHECKLIST.md`
5. `README.md`
