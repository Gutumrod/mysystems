# SESSION NOTES V3 - Bike Booking SaaS

วันที่บันทึก: 1 พฤษภาคม 2026  
เวลา: 02:33 น. (Asia/Bangkok)  
โปรเจค: `bike-booking-saas`  
Supabase project: `craftbikelab-saas-hub`  
Project ref: `gsbbkdppaegrttcqmjuq`  
Project URL: `https://gsbbkdppaegrttcqmjuq.supabase.co`

## เป้าหมายของรอบนี้

รอบนี้โฟกัสที่ Path A hardening เพื่อปิดช่องโหว่และความเพี้ยนที่ยังเหลือหลังจากต่อระบบเข้ากับ Supabase จริงแล้ว โดยเน้น:

1. แก้ booking visibility สำหรับหน้า customer
2. กันการจองเวลาย้อนหลังในวันปัจจุบัน
3. บังคับ admin access ให้ผูกกับ `shop_users`
4. แก้ no-show flow ให้ใช้ RPC ที่อัปเดตสถิติลูกค้าได้ถูกต้อง
5. ใช้ worker tools ที่ไม่แตะ secrets

## งานที่ทำเสร็จในรอบนี้

### 1. ใช้ worker แบบไม่แตะ `.env` / secrets

สร้าง sanitized workspace สำหรับให้ worker ช่วย review โดยตัดไฟล์สำคัญออก เช่น:

- `.env`
- `.env.local`
- `.env.*`
- `node_modules`
- `.next`
- `.git`

ที่อยู่ sanitized copy:

`C:\Users\Win10\Documents\New project\gemini-workspaces\bike-booking-saas-sanitized-20260501-015146`

### 2. Gemini CLI review สำเร็จ

ใช้ Gemini CLI แบบ read-only review กับ sanitized workspace เพื่อช่วยหา risk ใน Path A

รายงาน:

`C:\Users\Win10\Documents\New project\bike-booking-saas\reports\gemini-path-a-review-20260501-015208.md`

ข้อสังเกต:

- Gemini มี error `429 No capacity available for model gemini-3.1-pro-preview` หลายครั้ง
- สุดท้ายยังได้ report ออกมาสำเร็จ
- ไม่มี secrets ถูกส่งออกไป

### 3. Local Qwen review สำเร็จ

ใช้ local model `qwen3:8b` ตรวจ patch รอบนี้เพิ่มเติม

รายงาน:

`C:\Users\Win10\Documents\New project\bike-booking-saas\reports\qwen-path-a-patch-review-20260501-022715.md`

ผล:

- ไม่พบ critical issue ใหม่
- output มีอาการ noisy จาก spinner/control characters และข้อความคิดใน terminal
- ไม่มี secrets ถูกส่งออกไป

### 4. แก้หน้า customer ให้เห็น slot ที่ถูกจองจริง

ปัญหาเดิม:

- หน้า customer ใช้ข้อมูล booking ที่อ่านไม่พอสำหรับ slot blocking
- ทำให้บางกรณี UI อาจแสดงเวลาว่างทั้งที่ถูกจองแล้ว

สิ่งที่แก้:

- เพิ่ม type `BookingSlot`
- เปลี่ยน query ให้หน้า customer อ่านจาก view `bike_booking.public_booking_slots`
- ทำให้หน้า customer ใช้ข้อมูล slot ที่ public-safe และพอสำหรับ block เวลา

ไฟล์ที่เกี่ยวข้อง:

- `shop-frontend/lib/types.ts`
- `shop-frontend/lib/utils.ts`
- `shop-frontend/components/booking/DateTimePicker.tsx`
- `shop-frontend/components/booking/BookingForm.tsx`
- `shop-frontend/app/page.tsx`

### 5. กันการจองเวลาย้อนหลังในวันปัจจุบัน

ปัญหาเดิม:

- แม้จะกันวันที่ย้อนหลังได้ แต่ยังสามารถเลือกเวลาย้อนหลังของ "วันนี้" ได้ในบางกรณี

สิ่งที่แก้:

- ฝั่ง frontend: ซ่อน slot ที่เวลาผ่านไปแล้วสำหรับวันปัจจุบัน
- ฝั่ง database: เพิ่ม check ใน `assert_booking_rules()` เพื่อกันที่ server/database อีกชั้น

ผล:

- กันทั้งใน UI และที่ trigger ฝั่งฐานข้อมูล

### 6. แก้ no-show flow ให้ใช้ RPC ที่อัปเดต customer stats ถูกต้อง

ปัญหาเดิม:

- admin เปลี่ยนสถานะเป็น no-show โดยตรง ทำให้ risk ว่าสถิติ blacklist/no-show count จะไม่อัปเดตตาม business rules

สิ่งที่แก้:

- เปลี่ยนให้ปุ่ม no-show ใช้ RPC:
  `bike_booking.mark_booking_no_show(...)`
- อัปเดต local state หลัง RPC สำเร็จ

ไฟล์ที่แก้:

- `shop-admin/components/bookings/BookingsTable.tsx`

### 7. บังคับสิทธิ์เข้า admin ด้วย membership จริง

ปัญหาเดิม:

- layout admin เช็กแค่ว่ามี session หรือไม่
- ยังไม่เช็กให้แน่นว่า user คนนั้นอยู่ใน `bike_booking.shop_users` ของร้านนั้นจริง

สิ่งที่แก้:

- เพิ่มการตรวจ `shop_id + user_id` ใน `bike_booking.shop_users`
- ถ้าไม่พบ membership ให้ redirect ไปหน้า `/unauthorized`
- เพิ่มหน้า `unauthorized`

ไฟล์ที่แก้:

- `shop-admin/app/(dashboard)/layout.tsx`
- `shop-admin/app/unauthorized/page.tsx`

### 8. เก็บ mobile overflow ให้เรียบร้อยขึ้น

จุดที่เก็บเพิ่ม:

- ชื่อร้านใน header
- hero heading
- contact cards

ผล:

- ลดโอกาสข้อความล้นบนจอมือถือ

### 9. Apply migration เข้า Supabase จริงแล้ว

Migration ที่ apply:

`supabase/migrations/20260501000000_path_a_hardening.sql`

ผลที่ยืนยันแล้ว:

- `bike_booking.public_booking_slots` มีอยู่จริง
- `grant select` สำหรับ `anon, authenticated` ใช้งานได้
- ฟังก์ชัน `bike_booking.assert_booking_rules()` ถูก replace แล้ว

ตรวจจาก DB:

- public slot count ปัจจุบัน = `1`
- function `assert_booking_rules` มีอยู่จริงใน schema `bike_booking`

## ไฟล์ที่แก้ในรอบนี้

```text
shop-frontend/lib/types.ts
shop-frontend/lib/utils.ts
shop-frontend/components/booking/DateTimePicker.tsx
shop-frontend/components/booking/BookingForm.tsx
shop-frontend/app/page.tsx
shop-admin/components/bookings/BookingsTable.tsx
shop-admin/app/(dashboard)/layout.tsx
shop-admin/app/unauthorized/page.tsx
supabase/migrations/initial.sql
supabase/migrations/20260501000000_path_a_hardening.sql
SESSION_NOTES_V3.md
```

## Verification

รอบนี้ยืนยันแล้ว:

1. Migration เข้า Supabase จริงสำเร็จ
2. View `bike_booking.public_booking_slots` query ได้
3. Function `bike_booking.assert_booking_rules` มีอยู่จริงหลัง replace

สิ่งที่มีอยู่ก่อนหน้าและยังอ้างอิงได้:

1. `npm run lint` ผ่าน
2. `npm run build` ผ่าน
3. admin login flow ผ่านหลังแก้ `@supabase/ssr`

หมายเหตุ:

รอบนี้ไม่ได้รัน browser E2E ใหม่เต็มชุด เพราะงานหลักเป็น DB hardening + auth/data path hardening

## ข้อผิดพลาด/สิ่งที่เจอระหว่างทาง

### 1. Gemini capacity limit

อาการ:

- `429 No capacity available for model gemini-3.1-pro-preview`

ผลกระทบ:

- review ช้าลง
- ไม่ได้ทำให้ข้อมูลเสียหาย

วิธีรับมือ:

- ปล่อยให้ retry
- เก็บผลรายงานเฉพาะรอบที่สำเร็จ
- ใช้ local Qwen เป็นตัวตรวจซ้ำ

### 2. โฟลเดอร์โปรเจคไม่ใช่ git repo

อาการ:

- `git status` ใช้ไม่ได้ใน `C:\Users\Win10\Documents\New project\bike-booking-saas`

ผลกระทบ:

- เช็ก diff ผ่าน git ไม่ได้

วิธีรับมือ:

- อ้างอิงจากไฟล์จริงใน workspace
- ใช้ session notes และ worker reports ช่วย track งาน

### 3. Hermes/OpenClaw model switching ยังไม่ยอมใช้ local model ตามที่ลอง

สิ่งที่พบ:

- service `openclaw-gateway` ทำงานอยู่จริง
- ลองสลับจาก `gemma4:31b-cloud` ไป `qwen3:8b`
- restart แล้ว log ยังกลับไปใช้ `ollama/gemma4:e4b`

สิ่งที่ทำ:

- ทดลองเปลี่ยน config และ `.env` เฉพาะรอบทดสอบ
- backup ก่อนแก้
- revert กลับหลังจบการทดลอง

สรุป:

- ตอนนี้หยุดแตะ Hermes ไว้ก่อนตามที่ตกลง
- ไม่กระทบ Bike Booking SaaS

## สถานะปัจจุบัน

Customer app:

```text
URL: http://localhost:3000
สถานะ: logic จองแข็งแรงขึ้น
slot visibility: ดีขึ้นผ่าน public_booking_slots
past-time same day: กันแล้วทั้ง UI และ DB
```

Admin app:

```text
URL: http://localhost:3001/login
สถานะ: login flow เคยผ่านแล้ว
dashboard authorization: แน่นขึ้นด้วย shop_users membership check
no-show flow: ผูกกับ RPC แล้ว
```

Database:

```text
Supabase project: craftbikelab-saas-hub
Schema: bike_booking
Path A hardening migration: applied
public booking slot view: active
assert_booking_rules: updated
```

## สิ่งที่ยังค้าง

1. รัน browser test จริงอีกครั้งบน:
   - `http://localhost:3000`
   - `http://localhost:3001/dashboard`

2. ทดสอบ flow สำคัญ end-to-end:
   - จองคิวจาก customer UI
   - success page
   - copy text
   - dashboard เห็น booking
   - bookings table
   - calendar
   - เปลี่ยนสถานะจนถึง no-show

3. เช็ก mobile UI รอบสุดท้าย
   - customer
   - admin login
   - contact cards

4. cleanup test data ก่อน deploy จริง

## Path ถัดไป

### Path A2 - Full UI Verification

ทำต่อเมื่ออยากปิดงาน local integration ให้แน่น

งาน:

1. เปิด dev servers
2. ยิงเทส customer/admin ผ่าน browser จริง
3. เก็บ bug UI/UX ที่เหลือ
4. แก้เฉพาะจุด
5. สรุปผลเป็น session ใหม่

ผลลัพธ์ที่ควรได้:

```text
flow หลักผ่านจาก browser จริงครบ
mobile ไม่ล้นจอ
พร้อม staging/deploy
```

### Path B - Staging / Vercel Preparation

ทำต่อเมื่อ Path A2 ผ่านแล้ว

งาน:

1. เตรียม Vercel projects
2. ใส่ env vars
3. ตั้ง domain/subdomain
4. เทส auth/cookie บน domain จริง
5. cleanup ข้อมูลทดสอบ

### Path C - SaaS Hardening

งาน:

1. สร้าง create-shop flow/script ให้ครบ
2. เพิ่ม manage users ต่อร้าน
3. ออกแบบ tenant routing/domain strategy
4. เตรียม onboarding ร้านใหม่

## Recommendation

แนะนำให้ไป `Path A2` ก่อน เพื่อพิสูจน์ UI จริงหลัง hardening รอบนี้ แล้วค่อยขยับไป staging/deploy จะเสี่ยงน้อยกว่า

## ไฟล์อ้างอิงสำคัญ

- `C:\Users\Win10\Documents\New project\bike-booking-saas\SESSION_NOTES_V2.md`
- `C:\Users\Win10\Documents\New project\bike-booking-saas\reports\gemini-path-a-review-20260501-015208.md`
- `C:\Users\Win10\Documents\New project\bike-booking-saas\reports\qwen-path-a-patch-review-20260501-022715.md`
- `C:\Users\Win10\Documents\New project\bike-booking-saas\supabase\migrations\20260501000000_path_a_hardening.sql`
