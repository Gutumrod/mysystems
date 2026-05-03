# SESSION NOTES V20 - Shop Admin QA Fixes

วันที่บันทึก: 3 พฤษภาคม 2026
โปรเจค: `bike-booking-saas`

## เป้าหมายรอบนี้

แก้บัคฝั่งระบบร้านจากรายงาน Claude/Gemini ให้ครบ 3 รอบก่อนเดิน feature ใหม่ เช่น รับหลายคิวต่อช่วงเวลา

## Backup

ใช้ backup แบบ rolling ตามที่ตกลง เพื่อไม่ให้ไฟล์ backup เก่าสะสมหนักเครื่อง:

- Local file backup:
  - `supabase/backups/rolling-pre-admin-fixes/`
- Production DB backup:
  - `supabase/backups/rolling-pre-db-fixes/`

โฟลเดอร์เหล่านี้ถูก ignore ไม่ขึ้น GitHub

## รอบ 1 - Admin Quick Wins

แก้แล้ว:

- Calendar localizer ใช้ `startOfWeek` จาก `date-fns` จริง
- Calendar ถูกปรับเป็น controlled component โดยคุม `date/view` เอง เพื่อให้ปุ่มก่อนหน้า/ถัดไป/เดือน/สัปดาห์/วันทำงานนิ่งขึ้น
- Middleware ครอบ route หลังบ้านร้านให้ครบ:
  - `/dashboard`
  - `/bookings`
  - `/calendar`
  - `/services`
  - `/settings/*`
- Booking detail modal เพิ่มวันที่และเวลา
- Shop settings เพิ่ม validation:
  - ชื่อร้านห้ามว่าง
  - เบอร์โทรต้องมีจำนวนหลักเหมาะสม
  - LINE ID ห้ามมีช่องว่าง
  - Facebook URL ต้องเป็น `http://` หรือ `https://`
- Services page:
  - แก้ชื่อ/ระยะเวลาไม่ยิง DB ทุกตัวอักษรแล้ว
  - บันทึกเมื่อ blur
  - เปิด/ปิด service ยังบันทึกทันที
  - เพิ่ม confirm ก่อนลบบริการ

## รอบ 2 - DB/Security Posture

เพิ่ม migration:

- `supabase/migrations/20260503001000_admin_security_success_window.sql`

Apply เข้า Supabase production แล้ว และ mark migration history เป็น applied แล้ว

สิ่งที่ทำ:

- ขยาย `get_public_booking_confirmation(...)` จาก 30 นาทีเป็น 24 ชั่วโมง
- เพิ่ม conditional revoke/grant สำหรับ `is_platform_admin()` เฉพาะกรณี function มีอยู่จริง

หมายเหตุสำคัญ:

- Production DB ตอน apply ยังไม่พบ `bike_booking.is_platform_admin()`
- แปลว่า migration platform admin guardrails (`20260502040000...`) ยังไม่ได้อยู่ production จริง
- รอบนี้จึงไม่ฝืนสร้าง platform schema เพิ่ม เพื่อไม่ขยายขอบเขตโดยไม่ตั้งใจ

## รอบ 3 - Query Performance เบื้องต้น

แก้แล้ว:

- Dashboard query จำกัดเฉพาะเดือนปัจจุบัน
- Dashboard reload ใช้ date window เดียวกัน
- Dashboard คำนวณวันนี้ด้วย timezone `Asia/Bangkok`
- Calendar query จำกัดช่วง `-90` ถึง `+180` วัน
- Bookings page query จำกัดช่วง `-180` ถึง `+365` วัน และ limit 500 rows
- Platform page ไม่ดึง booking ทุกแถวมา count แล้ว เปลี่ยนเป็น count ต่อร้าน

## Verification

ผ่าน:

- `npm --prefix apps/booking-admin run lint`
- `npm --prefix apps/booking-admin run build`
- Browser smoke test ผ่านบน `http://localhost:3001`:
  - `/login` redirect เข้า dashboard เมื่อมี session
  - `/dashboard`
  - `/bookings`
  - `/calendar`
  - `/services`
  - `/settings/shop`
  - `/settings/schedule`
- Calendar กด Week view แล้วไม่มี runtime error
- หลัง restart dev server ทดสอบ Calendar control ผ่าน:
  - `ถัดไป` เปลี่ยนเดือน
  - `สัปดาห์` เปลี่ยน view
  - `ก่อนหน้า` ถอยช่วงวันที่
  - `เดือน` กลับ month view
- Shop settings validation ชื่อร้านว่างขึ้น toast `กรุณากรอกชื่อร้าน`
- Middleware no-cookie redirect route หลังบ้านร้านทั้งหมดไป `/login`

Production DB verify:

- `get_public_booking_confirmation(...)` มี window `24 hours` แล้ว
- `is_platform_admin()` ยังไม่มีใน production ตามที่ตรวจพบ

## ข้อค้าง / ต้องระวัง

- ยังไม่ได้ commit/push งาน V20
- ยังไม่ได้ทดสอบ action ที่เขียน DB จริง เช่น แก้ service, ลบ service, บันทึก setting จริง เพื่อเลี่ยงการเปลี่ยนข้อมูล production ระหว่าง smoke test
- ระหว่างทดสอบพบ dev server/HMR ค้างหลัง build ทำให้ Calendar control ไม่ตอบสนอง ต้อง restart dev server ก่อน verify
- Platform admin DB migration ยังไม่ได้ apply production จริง ต้องตัดสินใจแยกก่อนเปิดใช้ platform admin
- Service reorder ยังใช้หลาย request อยู่ ควรทำ RPC transaction ภายหลัง
- ยังไม่ได้ทำหน้า “งานวันนี้” สำหรับใช้หน้าร้านจริง
- ยังไม่ได้ทำ feature รับหลายคิวต่อช่วงเวลา
- ยังไม่ได้ทำ manual copy/LINE template สำหรับร้าน

## แนะนำขั้นต่อไป

1. เปิด dev server แล้วทดสอบ admin routes จริง
2. เทส Services:
   - แก้ชื่อแล้ว blur
   - แก้ระยะเวลาแล้ว blur
   - ซ่อน/แสดง service
   - ลบ service ต้องมี confirm
3. เทส Bookings modal ว่ามีวัน/เวลา
4. เทส Calendar week/month view
5. ถ้าผ่าน ค่อย commit/push
