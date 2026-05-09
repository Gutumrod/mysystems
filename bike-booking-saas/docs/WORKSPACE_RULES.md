# Workspace Rules

เอกสารนี้คือกติกาใช้งานจริงของ `bike-booking-saas` สำหรับสลับเครื่องและส่งต่องานให้ไม่หลุด state

## ขอบเขตของงาน

- โปรเจกต์หลักที่ active คือ `bike-booking-saas`
- โฟลเดอร์ `Chatbot/` ที่อยู่ระดับ repo เดียวกันเป็นงานแยก
- ถ้าไม่ได้สั่งชัด ๆ ให้ทำงานกับ Chatbot ให้ **ignore** ไปเลย

## สิ่งที่ถือเป็น source of truth

- โค้ดจริง: GitHub `main`
- สถานะงาน: `SESSION_NOTES_V37.md` และเวอร์ชันล่าสุดถัดไป
- ข้อมูลวิธีทำงาน: `docs/WORKFLOW.md`
- เช็กลิสต์ปล่อยงาน: `docs/POST_DEPLOY_CHECKLIST.md`

## เริ่มงานบนเครื่องใหม่

1. เปิด repo ที่ `mysystems`
2. `git pull origin main`
3. เข้า `bike-booking-saas`
4. เปิด `SESSION_NOTES_V37.md`
5. ตรวจ `git status --short`
6. ถ้าต้องทำงานต่อ ให้ `npm install` และรัน workspace commands ของโปรเจกต์นี้เท่านั้น

## กติกาเวลาแก้โค้ด

- แก้เฉพาะใน `bike-booking-saas`
- อย่าแตะไฟล์ของ Chatbot ถ้าไม่ใช่งานนั้น
- ก่อนแตะ schema / auth / production config ให้ backup ก่อนเสมอ
- ก่อนปิดรอบ ให้ `git status` ต้องรู้ว่ามีอะไรค้างหรือไม่

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

1. `SESSION_NOTES_V37.md`
2. `docs/WORKFLOW.md`
3. `docs/POST_DEPLOY_CHECKLIST.md`
4. `README.md`
