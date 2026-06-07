# CLAUDE HANDOFF — bike-booking-saas

ไฟล์นี้คือไฟล์เปิดอ่านสำหรับ Claude ก่อนสรุปโปรเจกต์หรือทำแผนขายงาน

## Current Safe Branch

- ใช้ branch นี้เป็นฐานอ่านสถานะล่าสุดที่ Codex ตรวจแล้ว:
  - `review-signup-form-v67`
- commit ล่าสุดของ branch นี้:
  - `75667c2 fix: refine signup handoff and review notes`

## Do Not Do This

- ห้าม `git pull origin main` หรือ merge `origin/main` ตรงๆ
- ห้ามรัน SQL migration บน Supabase live
- ห้าม deploy
- ห้ามลบ session notes หรือ migrations
- ห้ามเอา `self_onboard_shop()` / self-service create-shop-immediately flow เข้า live

เหตุผล:

- `origin/main` ล่าสุดคือ `ff4a4ab` ซึ่งมีของดีบางส่วน แต่เคยตรวจแล้วว่ามี regression สำคัญ:
  - ลบ session notes V47-V65
  - ลบ migrations สำคัญ
  - ลดความสามารถ Platform Control Center
  - onboarding ใช้ UX/SQL ที่ยังไม่ตรง requirement
  - daily booking holiday-aware logic มีโอกาสถอยหลัง

## Read Order

อ่านตามนี้ก่อนสรุปหรือทำแผนขาย:

1. `START_HERE.md`
2. `SESSION_NOTES_CURRENT.md`
3. `SESSION_NOTES_V67.md`
4. `docs/AGENT_REVIEW_LESSONS.md`
5. `docs/CLAUDE_SALES_HANDOFF.md`
6. `README.md`
7. `MASTER BLUEPRINT - Bike Booking SaaS.md`

## What You Should Produce

งานของ Claude รอบนี้คือ:

- สรุปโปรเจกต์ทั้งหมดแบบเข้าใจง่าย
- สรุปสถานะปัจจุบันว่าอะไรพร้อมใช้งาน / อะไรยังต้อง cleanup
- ทำแผนขายงานต่อสำหรับ CraftBike Booking SaaS
- แยกกลุ่มลูกค้าเป้าหมาย
- เสนอ package / pricing / pitch / demo flow
- ระบุสิ่งที่ต้องทำก่อนขายจริง

## Current Product Concept

CraftBike Booking SaaS คือระบบจองคิวสำหรับร้านแต่งรถ/ทำงานมอเตอร์ไซค์แบบ multi-tenant:

- ลูกค้าแต่ละร้านจองผ่าน subdomain ของร้าน
- ร้านมีหน้า admin ของตัวเอง
- เจ้าของระบบมี CraftBike Control Center เพื่อคุมทุกร้าน
- รองรับงานรายชั่วโมงและรายวัน
- รองรับวันหยุดร้านและวันหยุดพิเศษ
- มี signup/request flow สำหรับร้านใหม่ โดย platform owner ต้องอนุมัติก่อน

## Output Style

- ตอบเป็นภาษาไทย
- ตรงไปตรงมา
- แยกเป็นหัวข้อ
- ถ้าจะเสนอแผนขาย ให้แยกเป็นเฟสที่ทำได้จริง
- ถ้าไม่แน่ใจ ให้บอกว่าไม่แน่ใจและชี้ไฟล์ที่ควรตรวจเพิ่ม
