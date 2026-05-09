# Bike Booking SaaS Workflow

เอกสารนี้คือ workflow กลางของโปรเจค `bike-booking-saas` สำหรับใช้ทำงานแบบ Drive-first แล้วค่อยอัปเดต Git/GitHub ทีหลัง

## ขอบเขตที่ต้องยึด

- งาน active ของรอบนี้คือ `bike-booking-saas`
- `Chatbot/` ที่อยู่ระดับ repo เดียวกันเป็นโปรเจกต์แยก
- ถ้าไม่ได้สั่งชัดเจน ให้ ignore `Chatbot/` ไปเลย
- เวลาย้ายเครื่อง ให้เปิด `START_HERE.md` แล้วค่อยเริ่มจากตรงนั้น

## เป้าหมาย

- ใช้ `X:\My Drive\workspace\AI-Project\bike-booking-saas` เป็นพื้นที่กลางของงาน
- ทำงานให้ไม่วุ่นวายเวลาเปลี่ยนเครื่อง
- เก็บประวัติและสถานะงานให้ย้อนกลับได้
- ค่อยซิงก์ขึ้น Git / GitHub หลังงานเสร็จเป็นรอบ ๆ

## แหล่งที่มาแต่ละอย่าง

- **Drive folder**: พื้นที่ทำงานหลัก และที่เก็บเอกสารกลาง
- **Git repo / GitHub**: ประวัติโค้ดจริงและเวอร์ชันที่ต้องอัปเดตหลังจบงาน
- **Session notes**: บันทึกสถานะล่าสุดของงาน
- **Backups**: สำเนาก่อนแก้ของเสี่ยง เช่น schema, deployment config, logic สำคัญ

## โครงโฟลเดอร์ที่ใช้

- `01-Projects/Bike-Booking-SaaS` เอกสารและงานของโปรเจคนี้
- `02-Knowledge` ข้อมูลอ้างอิงร่วม
- `03-SOP` ขั้นตอนทำงานมาตรฐาน
- `04-Prompts` prompt ที่ใช้ซ้ำ
- `05-Agent-Memory` บันทึกจำสั้นของเอเจนต์
- `06-Agent-Logs` บันทึกรอบงานและผลลัพธ์
- `99-Archive` ของเก่า/ของที่เลิกใช้แล้ว

## Workflow หลัก

### 1) เริ่มงาน

1. เปิด `START_HERE.md`
2. เปิดโฟลเดอร์ Drive ของโปรเจค
3. อ่าน `SESSION_NOTES_CURRENT.md` ก่อนเสมอ
4. อ่าน `docs/WORKSPACE_RULES.md`
5. อ่าน `README.md`, `docs/ONBOARDING_*.md`, หรือ `docs/LAUNCH_CHECKLIST_*.md` ที่เกี่ยวข้อง
6. เช็กว่าไฟล์ที่กำลังจะทำไม่ชนกับรอบก่อน

### 2) ระหว่างทำงาน

1. แก้ใน working copy ของโปรเจค
2. ถ้าเป็นงานเสี่ยง ให้ backup snapshot ก่อนเสมอ
3. อย่าแก้พร้อมกันหลายเครื่อง
4. ถ้ามี output จากเทสหรือ error สำคัญ ให้จดไว้ทันที

### 3) ก่อนปิดรอบงาน

1. รอให้ Drive sync จบ
2. ตรวจ `git status`
3. รัน lint / build / test ที่เกี่ยวข้อง
4. อัปเดต session notes
5. ถ้างานเสี่ยง ให้เก็บ backup snapshot ไว้ใน Drive

### 4) หลังงานเสร็จ

1. `git add`
2. `git commit`
3. `git push`
4. อัปเดต GitHub ให้ตรงกับ Drive
5. ถ้าต้องส่งต่อรอบถัดไป ให้สรุปผลไว้ใน session notes

## กติกาสำคัญ

- ห้าม commit ตอน sync ยังไม่จบ
- ห้ามเปิดแก้ไฟล์ชุดเดียวกันบนหลายเครื่องพร้อมกัน
- ห้ามเก็บ secrets ลง Drive แบบเปิดอ่านได้
- ถ้าจะแก้ schema / auth / production config ต้อง backup ก่อน
- ถ้ามีข้อมูลหลายเวอร์ชัน ให้ยึด `SESSION_NOTES_CURRENT.md` เป็นหลัก

## สิ่งที่ควรเก็บใน Drive

- session notes
- onboarding / launch checklist
- blueprint / roadmap
- backup snapshot
- screenshots / logs ที่ใช้ยืนยันผลเทส
- prompt ที่ใช้ซ้ำ

## สิ่งที่ไม่ควรเก็บแบบเปิด

- `.env.local`
- service role key
- access token
- password ของระบบ production
- private API key ทุกชนิด

## รอบทำงานมาตรฐาน

### รอบสั้น

1. อ่านสถานะล่าสุด
2. แก้โค้ด
3. เทส
4. จดบันทึก
5. commit / push

### รอบใหญ่

1. backup ก่อน
2. แก้
3. เทสหลายรอบ
4. อัปเดต docs
5. sync Drive
6. commit / push
7. สรุป session ใหม่

## ใช้บน Mac

- ใช้ Google Drive for Desktop เป็น mount เดียวกับโฟลเดอร์งาน
- เปิดโปรเจคจาก path เดิมทุกครั้ง
- ถ้าย้ายเครื่อง ให้รอ sync ให้ครบก่อนเริ่มรอบใหม่
- ถ้า repo root มีหลายโปรเจกต์ ให้เข้า `bike-booking-saas` ก่อนเสมอ และอย่าแตะ `Chatbot/` ถ้าไม่ใช่งานนั้น

## ใช้บน Windows

- ใช้โฟลเดอร์ Drive เดิมเป็น working area
- ยึด path เดียวกันทั้งโปรเจค
- ถ้า sync ค้าง ให้รอให้ไฟล์นิ่งก่อน commit

## เช็กลิสต์ก่อนจบวัน

- [ ] sync Drive เสร็จ
- [ ] backup งานเสี่ยงแล้ว
- [ ] git status สะอาด หรือรู้ว่ามีอะไรค้างอยู่
- [ ] session notes อัปเดตแล้ว
- [ ] commit / push ถ้าเป็นรอบที่พร้อมส่งต่อ
