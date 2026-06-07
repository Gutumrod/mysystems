# SESSION NOTES V68

## Path

- repo: `C:\Users\Win10\Documents\mysystems\bike-booking-saas`
- git branch: `review-signup-form-v67`

## วันที่

- 2026-06-07

## เหตุการณ์หลัก

ผู้ใช้ต้องการจัดระบบโปรเจกต์ให้เรียบร้อย เพื่อให้ Claude เข้ามาสรุปโปรเจกต์ทั้งหมดและทำแผนขายงานต่อ

## สถานะ git ที่ตรวจแล้ว

หลัง `git fetch --all --prune`:

- local branch ปัจจุบัน: `review-signup-form-v67`
- branch นี้ตรงกับ `origin/review-signup-form-v67`
- commit ล่าสุดของ branch:
  - `75667c2 fix: refine signup handoff and review notes`
- `origin/main` ล่าสุด:
  - `ff4a4ab feat(bike-booking-saas): implement dynamic subdomain routing, onboarding UI/DB procedure, and Thai manuals`

## ข้อควรระวังสำคัญ

ยังห้าม `git pull origin main` หรือ merge `origin/main` ตรงๆ

เหตุผล:

- `ff4a4ab` เคยตรวจแล้วว่ามี regression และต้อง merge-cleanup ก่อน
- เสี่ยงลบ session notes/migrations/features ที่ระบบหลักต้องรักษา

## สิ่งที่จัดระบบเพิ่มในรอบนี้

เพิ่มไฟล์:

- `CLAUDE.md`
- `docs/CLAUDE_SALES_HANDOFF.md`

อัปเดตไฟล์:

- `START_HERE.md`
- `SESSION_NOTES_CURRENT.md`

วัตถุประสงค์:

- ให้ Claude รู้ว่าไฟล์ไหนต้องอ่านก่อน
- ให้ Claude เข้าใจว่า branch ไหนปลอดภัย
- ให้ Claude ไม่ pull/merge main ตรงๆ
- ให้ Claude มี brief สำหรับทำ product summary และ sales plan
- แยก technical risk ออกจาก sales/demo readiness

## สิ่งที่ Claude ควรทำต่อ

Claude ควรทำ:

- สรุปโปรเจกต์ทั้งหมด
- สรุปสถานะปัจจุบัน
- แยกว่าอะไร demo ได้ / อะไรยังต้อง cleanup
- ทำแผนขาย
- ทำ target customer / package / pricing draft / demo script

Claude ไม่ควรทำ:

- แก้โค้ด
- รัน SQL
- deploy
- pull/merge `origin/main`
- เอา self-service onboarding SQL เข้า live

## ไฟล์ที่ Claude ควรอ่าน

1. `START_HERE.md`
2. `CLAUDE.md`
3. `SESSION_NOTES_CURRENT.md`
4. `SESSION_NOTES_V67.md`
5. `SESSION_NOTES_V68.md`
6. `docs/AGENT_REVIEW_LESSONS.md`
7. `docs/CLAUDE_SALES_HANDOFF.md`
8. `README.md`
9. `MASTER BLUEPRINT - Bike Booking SaaS.md`

## Local caveats

ยังมี untracked เดิมที่ Codex ไม่แตะ:

- `bike-booking-saas/supabase/config.toml`
- `bike-booking-saas/supabase/functions/`
- `bike-booking-saas/supabase/migrations/20260521000000_telegram_notifications.sql`

## ลงชื่อ

- codex
