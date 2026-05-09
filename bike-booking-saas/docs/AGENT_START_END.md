# Agent Start / End Rules

ไฟล์นี้เขียนไว้ให้ Codex / Claude / Gemini อ่านแล้วเริ่มงานต่อได้ตรงกันใน `bike-booking-saas`

## ตอนเริ่มงาน ต้องอ่านตามลำดับนี้

1. `docs/WORKSPACE_RULES.md`
2. `docs/WORKFLOW.md`
3. `SESSION_NOTES_CURRENT.md`
4. `README.md`

อ่าน 4 ไฟล์นี้ก่อนเสมอ แล้วค่อยเริ่มทำงานต่อ

## หลังอ่านเสร็จ ต้องทำอะไรต่อ

1. เข้าเฉพาะโฟลเดอร์ `bike-booking-saas`
2. `git pull origin main`
3. `git status --short`
4. ถ้าต้องแก้โค้ด ให้ทำเฉพาะใน `bike-booking-saas`
5. ถ้าเป็นงานเสี่ยง ให้ backup ก่อน
6. ทำงานเสร็จแล้วรัน lint / build / test ที่เกี่ยวข้อง
7. อัปเดต session notes
8. `git add`
9. `git commit`
10. `git push`

## ตอนจบงาน ต้องบอกผู้ใช้แบบนี้

ให้บอกสั้น ๆ ว่า:

- ทำอะไรเสร็จแล้ว
- ตอนนี้สถานะ repo เป็นยังไง
- มีไฟล์อะไรที่เปลี่ยน
- มีอะไรที่ยังต้องทำต่อ
- ถ้าจะย้ายเครื่อง ให้เปิดไฟล์ไหนต่อ

## ข้อความสั่งต่อที่ควรใช้กับเครื่องถัดไป

ใช้ข้อความนี้เป็นแม่แบบได้:

```text
ให้เปิด bike-booking-saas แล้วอ่าน docs/WORKSPACE_RULES.md, docs/WORKFLOW.md, SESSION_NOTES_CURRENT.md, README.md ก่อน
จากนั้น git pull origin main
เช็ก git status --short
แล้วค่อยทำงานต่อจาก session ล่าสุด
```

## กติกาสำคัญ

- ห้ามปน `Chatbot/` ถ้าไม่ได้สั่งชัดเจน
- ห้าม commit ตอน sync ยังไม่จบ
- ถ้าแตะ schema / auth / production config ต้อง backup ก่อน
- ถ้างานเสร็จแล้ว ต้องอัปเดต session notes ทุกครั้ง
