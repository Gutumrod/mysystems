# SESSION_NOTES_V42 - CraftBike Command Center Naming

## path

- `C:\Users\Win10\Documents\mysystems\bike-booking-saas`

## สรุปงาน

- เปลี่ยนชื่อ platform layer ให้เป็น **CraftBike Command Center**
- อัปเดตหน้า `/platform` ให้ใช้ชื่อใหม่บน badge, heading, และ fallback state
- อัปเดตเอกสารหลักบางส่วนให้ใช้ชื่อเดียวกันเพื่อไม่ให้ชื่อหลุดระหว่างเครื่อง

## สิ่งที่เปลี่ยน

- `apps/booking-admin/app/platform/page.tsx`
- `README.md`
- `index.md`
- `docs/ONBOARDING_KMORACKBARCUSTOM.md`
- `docs/MULTI_TENANT_SCALING_PATH.md`

## สิ่งที่ต้องทำต่อ

- เช็กหน้า `/platform` หลัง build ว่าชื่อใหม่ขึ้นครบ
- commit / push งานรอบนี้
- ถ้าย้ายเครื่อง ให้เปิด `SESSION_NOTES_CURRENT.md` ก่อนเสมอ

## ข้อควรระวัง

- อย่าแตะ `Chatbot/` ถ้าไม่ได้สั่ง
- งาน platform ยังเป็น layer แยกจาก booking customer/admin
- ก่อนแก้ production config หรือ DB logic ต้อง backup ก่อนเสมอ

## ลงชื่อ

- Codex

## ส่งต่อให้ใคร

- Codex เครื่องถัดไป
- Claude / Gemini ที่อ่าน `START_HERE.md`
