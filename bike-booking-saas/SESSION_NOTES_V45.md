# SESSION_NOTES_V45 - Control Login Split

## path

- `C:\Users\Win10\Documents\mysystems\bike-booking-saas`

## สรุปงาน

- แยกหน้า `/login` ให้รู้บทบาทตาม hostname แล้ว
- `control.craftbikelab.com/login` แสดงเป็น login เจ้าของระบบ
- ร้าน admin ใช้ login ของร้านตามเดิม
- `control.craftbikelab.com` ถูกกันไม่ให้ถูกตีเป็น shop slug ใน middleware

## สิ่งที่เปลี่ยน

- `apps/booking-admin/app/login/page.tsx`
- `apps/booking-admin/components/auth/PortalLoginForm.tsx`
- `apps/booking-admin/app/unauthorized/page.tsx`
- `apps/booking-admin/lib/portal.ts`
- `apps/booking-admin/middleware.ts`
- `docs/DOMAIN_STANDARD.md`

## สิ่งที่ต้องทำต่อ

- เช็กว่า `control.craftbikelab.com/login` แสดงข้อความเจ้าของระบบจริงบน production
- เช็กว่า login แล้วไป `/platform` ได้
- commit / push งานรอบนี้

## ข้อควรระวัง

- `control.craftbikelab.com` ต้องไม่กลายเป็น tenant ของร้าน
- อย่าแตะ `Chatbot/` ถ้าไม่ได้สั่ง
- ถ้าจะเพิ่มโดเมนใหม่ในอนาคต ให้ update `DOMAIN_STANDARD.md` ก่อน

## ลงชื่อ

- Codex

## ส่งต่อให้ใคร

- Codex เครื่องถัดไป
- Claude / Gemini ที่อ่าน `START_HERE.md`
