# SESSION_NOTES_V43 - Domain Standard for Roles and URLs

## path

- `C:\Users\Win10\Documents\mysystems\bike-booking-saas`

## สรุปงาน

- ล็อกมาตรฐานโดเมนและบทบาทของระบบให้ชัดแล้ว
- customer = ของแต่ละร้าน
- shop admin = ของร้านนั้น
- platform admin = ของเจ้าของระบบ คุมทุกร้าน
- platform admin URL มาตรฐานเป็น `https://control.craftbikelab.com/`
- shop URL มาตรฐานเป็น `https://[shop-slug].craftbikelab.com/`
- shop admin URL มาตรฐานเป็น `https://[shop-slug]-admin.craftbikelab.com/`

## สิ่งที่เปลี่ยน

- เพิ่ม `docs/DOMAIN_STANDARD.md`
- อัปเดต `START_HERE.md`
- อัปเดต `docs/AGENT_START_END.md`
- อัปเดต `HANDOFF_TEMPLATE.md`
- อัปเดต `docs/WORKFLOW.md`
- อัปเดต `README.md`
- อัปเดต `index.md`

## สิ่งที่ต้องทำต่อ

- ใช้ `DOMAIN_STANDARD.md` เป็น source of truth เวลาเริ่มงาน / ส่งงาน
- ต่อไปค่อยทำ flow สมัครร้านใหม่แบบกรอกอีเมล + จ่ายเงิน + ได้ 2 ลิงก์อัตโนมัติ
- commit / push งานชุดนี้

## ข้อควรระวัง

- `control.craftbikelab.com` ต้องเป็นของ platform admin เท่านั้น
- ห้ามใช้ชื่อร้านปนในโดเมนกลาง
- อย่าแตะ `Chatbot/` ถ้าไม่ได้สั่ง

## ลงชื่อ

- Codex

## ส่งต่อให้ใคร

- Codex เครื่องถัดไป
- Claude / Gemini ที่อ่าน `START_HERE.md`
