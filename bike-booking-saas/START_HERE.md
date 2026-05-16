# START HERE — bike-booking-saas

ไฟล์นี้คือประตูหน้า สำหรับ Codex / Claude / Gemini ที่จะเข้ามาทำงานต่อใน `bike-booking-saas`

## อ่านตามลำดับนี้ก่อนทำอะไร

1. `docs/WORKSPACE_RULES.md`
2. `docs/WORKFLOW.md`
3. `docs/AGENT_START_END.md`
4. `HANDOFF_TEMPLATE.md`
5. `SESSION_NOTES_CURRENT.md`
6. `docs/TODAY_PLAN_20260510.md`
7. `docs/TODAY_TEST_PLAN_20260516.md`
8. `docs/DOMAIN_STANDARD.md`
9. `docs/SELF_SERVICE_SIGNUP_BLUEPRINT.md`
10. `README.md`

## หลังอ่านครบแล้ว ต้องทำอะไร

1. เข้าเฉพาะโปรเจกต์ `bike-booking-saas`
2. `git fetch origin main`
3. `git pull --ff-only origin main`
4. `git log --oneline -3`
5. `git status --short`
6. ถ้าไฟล์หรือ path ไหนหาไม่เจอ ให้หยุดแล้วรายงานทันที
7. ถ้าจะเริ่มแก้ ให้ทำเฉพาะ `bike-booking-saas`
8. ถ้าเป็นงานเสี่ยง ให้ backup ก่อน
9. งานเสร็จแล้วให้ lint / build / test ที่เกี่ยวข้อง
10. อัปเดต session notes
11. `git add`
12. `git commit`
13. `git push`

## ขอบเขตงาน

- ทำเฉพาะ `bike-booking-saas`
- อย่าแตะ `Chatbot/` ถ้าไม่ได้สั่งชัดเจน
- ถ้า repo root มีหลายโปรเจกต์ ให้เข้า `bike-booking-saas` ก่อนเสมอ

## ข้อควรระวังสำคัญที่ทุกเครื่องต้องรู้

- Supabase live project `gsbbkdppaegrttcqmjuq` apply migration `20260510000009_signup_requests.sql` แล้ว และมี backup / verification note อยู่ที่ `docs/SUPABASE_LIVE_BACKUP_20260510_SIGNUP_REQUESTS.md`
- ยังมี Supabase advisor warnings ที่ต้องแก้ต่อ โดยเฉพาะ `SECURITY DEFINER` functions ที่ callable ผ่าน exposed RPC roles, `default_signup_working_hours()` mutable search path, foreign keys ของ `signup_requests` ที่ยังไม่มี covering indexes, และ RLS policy ที่ควร optimize เป็น `(select auth.uid())`
- ก่อนแก้ต่อให้ backup และ verify live DB ก่อนเสมอ ห้ามเดาสถานะจาก local migration อย่างเดียว
- ห้ามลบ จนกว่าจะแก้ไขเสร็จ แล้วซิงค์ทั้งหมด

## ตอนจบงานต้องรายงานอะไร

- ทำอะไรเสร็จแล้ว
- repo status เป็นยังไง
- commit / push แล้วหรือยัง
- ยังต้องทำอะไรต่อ
- ถ้าย้ายเครื่อง ต้องเปิดไฟล์ไหนต่อ

## ข้อความส่งต่อที่ใช้ได้ทันที

```text
เปิด START_HERE.md ของโปรเจกต์ bike-booking-saas แล้วทำตามทีละข้อ
```
