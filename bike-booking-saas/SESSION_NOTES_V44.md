# SESSION_NOTES_V44 - Control Center Rename and Platform Cleanup

## path

- `C:\Users\Win10\Documents\mysystems\bike-booking-saas`

## สรุปงาน

- ปรับ platform admin ให้เป็นศูนย์กลางกลางจริง ๆ
- ล็อกชื่อหน้าเป็น **CraftBike Control Center**
- ล็อกโดเมนกลางเป็น `https://control.craftbikelab.com/`
- เอา default ร้าน KMO ออกจาก platform console เพื่อไม่ให้ platform เอนร้านเดียว

## สิ่งที่เปลี่ยน

- `apps/booking-admin/app/platform/page.tsx`
- `apps/booking-admin/components/platform/PlatformAdminConsole.tsx`
- `README.md`
- `index.md`
- `docs/DOMAIN_STANDARD.md`
- `START_HERE.md`
- `docs/AGENT_START_END.md`
- `HANDOFF_TEMPLATE.md`
- `docs/WORKFLOW.md`

## สิ่งที่ต้องทำต่อ

- เช็กว่า `/platform` บน local / production ขึ้นชื่อใหม่ครบ
- ถ้าจะต่อ flow สมัครร้านใหม่ ให้ยึด `control.craftbikelab.com` เป็น platform owner entrypoint
- commit / push งานชุดนี้

## ข้อควรระวัง

- ห้ามให้ platform admin default ไปเอนร้าน KMO อีก
- ห้ามแตะ `Chatbot/` ถ้าไม่ได้สั่ง
- `control.craftbikelab.com` ต้องเป็นโดเมนกลางของเจ้าของระบบเท่านั้น

## ลงชื่อ

- Codex

## ส่งต่อให้ใคร

- Codex เครื่องถัดไป
- Claude / Gemini ที่อ่าน `START_HERE.md`
