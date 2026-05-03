# SESSION_NOTES_V22 - Visual QA + Calendar Stabilization

วันที่: 2026-05-03
โปรเจกต์: Bike Booking SaaS

## เป้าหมายรอบนี้

- เช็คความเรียบร้อยหน้าตาเว็บทั้งฝั่งลูกค้าและฝั่งร้าน
- ตรวจว่า dev servers เปิดใช้งานได้
- ตรวจ booking test ที่สร้างไว้ยังเห็นใน admin
- แก้จุดที่ทำให้ข้อมูล/หน้าตาไม่นิ่ง
- บันทึกงานต่อจาก V21

## สถานะ Dev Servers

- Customer: `http://localhost:3000`
- Admin: `http://localhost:3001`
- Restart dev servers หลัง build แล้ว
- Process ล่าสุด:
  - port 3000 ทำงานอยู่
  - port 3001 ทำงานอยู่

## สิ่งที่ตรวจแล้ว

### Customer

- `http://localhost:3000/`
  - หน้า booking โหลดได้
  - CSS โหลดสำเร็จ
  - ข้อมูลร้าน Bangkok Bike Care แสดงถูก
  - รายการบริการแสดงครบ:
    - เช็คสายไฟ
    - ติดตั้งไฟสปอร์ตไลท์
    - ทำสายแตร
  - layout desktop/mobile ใน browser test ไม่พบ runtime error

- `http://localhost:3000/success?id=f39521e8-6b5e-403a-960f-70aa03a73150`
  - success page โหลดได้
  - เห็น ticket `#BK-F39521E8`
  - เห็นข้อมูลรถ/บริการ/เวลา booking ทดสอบ

### Admin

- `http://localhost:3001/dashboard`
  - โหลดได้
  - stats เห็น booking ทดสอบในสัปดาห์/เดือน

- `http://localhost:3001/bookings`
  - โหลดได้
  - เห็น booking ทดสอบ:
    - Codex Test
    - 2026-05-07
    - 09:00 - 11:00
    - Honda ADV350
    - เช็คสายไฟ

- `http://localhost:3001/calendar`
  - โหลดได้
  - ปุ่ม `ก่อนหน้า`, `ถัดไป`, `เดือน`, `สัปดาห์`, `วัน` ใช้งานได้
  - Week view เห็น event `Codex Test · Honda ADV350`
  - เพิ่มรายการคิวใต้ปฏิทิน เพื่อให้เห็น booking แน่นอนทุก view
  - คลิกรายการคิวแล้วเปิด modal รายละเอียดได้

- `http://localhost:3001/services`
  - โหลดได้
  - เห็นบริการ 3 รายการ

- `http://localhost:3001/settings/shop`
  - โหลดได้
  - เห็นข้อมูลร้าน

- `http://localhost:3001/settings/schedule`
  - โหลดได้
  - เห็นเวลาทำการและวันหยุดพิเศษ

## Bug / Incident ที่เจอและแก้แล้ว

### 1. ESLint ไล่เข้า backup cache

อาการ:
- `npm run lint` fail เพราะ ESLint เข้าไปอ่าน `.next.backup-devcache`

สาเหตุ:
- เราเก็บ backup `.next` จากรอบแก้ CSS cache ไว้
- Git ignore แล้ว แต่ ESLint ยังไม่ได้ ignore

วิธีแก้:
- เพิ่ม ignore ใน:
  - `apps/booking-admin/eslint.config.mjs`
  - `apps/booking-consumer/eslint.config.mjs`
- เพิ่ม pattern:
  - `.next.backup-devcache*/**`

ผล:
- `npm run lint` ผ่าน

### 2. Calendar month view ไม่แสดง event ใน DOM snapshot

อาการ:
- หน้า `/bookings` เห็น booking
- หน้า `/calendar` week view เห็น booking
- แต่ month view ของ `react-big-calendar` ไม่โชว์ event ใน DOM snapshot แม้ server query มี booking

วิธีแก้/ทำให้ใช้งานนิ่งขึ้น:
- บังคับหน้าที่อ่านข้อมูลสดเป็น dynamic:
  - customer booking page
  - customer success page
  - admin dashboard/bookings/calendar/services/settings/platform
- ปรับ `BookingCalendar` ให้ client reload booking เองจาก Supabase และ subscribe realtime
- เพิ่ม fallback list ใต้ปฏิทิน: `รายการคิวในช่วงนี้`
- คลิกรายการใน list เพื่อเปิด modal รายละเอียดได้

ผล:
- calendar page เห็น booking ทดสอบแน่นอนใน list
- week view เห็น event ใน calendar grid
- controls ยังทำงานได้

## ไฟล์ที่แก้

- `apps/booking-consumer/app/page.tsx`
- `apps/booking-consumer/app/success/page.tsx`
- `apps/booking-consumer/eslint.config.mjs`
- `apps/booking-admin/app/(dashboard)/dashboard/page.tsx`
- `apps/booking-admin/app/(dashboard)/bookings/page.tsx`
- `apps/booking-admin/app/(dashboard)/calendar/page.tsx`
- `apps/booking-admin/app/(dashboard)/services/page.tsx`
- `apps/booking-admin/app/(dashboard)/settings/shop/page.tsx`
- `apps/booking-admin/app/(dashboard)/settings/schedule/page.tsx`
- `apps/booking-admin/app/platform/page.tsx`
- `apps/booking-admin/components/calendar/BookingCalendar.tsx`
- `apps/booking-admin/eslint.config.mjs`

## Verification

- `npm run lint` ผ่าน
- `npm run build` ผ่าน
- CSS links:
  - customer booking: 200
  - customer success: 200
  - admin login/admin shared CSS: 200
- Browser smoke:
  - customer page เห็น booking form + services
  - admin calendar เห็น `รายการคิวในช่วงนี้`
  - admin calendar list เห็น `Codex Test`
  - admin calendar week view เห็น `Codex Test`
  - console errors ของ app: ไม่มี

หมายเหตุ:
- มี warning จาก tooling/React outdated JSX transform และ Statsig ของ Codex browser client บ้าง ไม่ใช่ runtime error ของแอป
- booking test `f39521e8-6b5e-403a-960f-70aa03a73150` ยังอยู่ใน Supabase และยังไม่ได้ลบ

## งานถัดไปที่แนะนำ

### Path A - ปิดความนิ่งฝั่งร้านก่อน

1. เพิ่มหน้า `งานวันนี้` สำหรับใช้หน้าร้านจริง
2. เพิ่ม flow เปลี่ยนสถานะคิวแบบเร็ว:
   - เริ่มทำ
   - เสร็จแล้ว
   - ยกเลิก
   - no-show
3. เพิ่ม filter/quick view ใน Calendar:
   - วันนี้
   - พรุ่งนี้
   - 7 วันข้างหน้า
4. เพิ่มข้อความ copy สำหรับร้าน เพื่อส่ง LINE/Facebook manual

### Path B - Platform Control สำหรับเจ้าของ SaaS

1. หน้าเพิ่มร้านใหม่
2. ผูก owner email กับร้าน
3. ดูสถานะ subscription/trial/suspended
4. สร้าง checklist onboarding ร้านใหม่
5. แยกบทบาท platform admin กับ shop owner/staff ให้ชัด

### Path C - Hardening ก่อนมีร้านจริง

1. เพิ่ม automated test สำหรับ booking RPC
2. เพิ่ม test double booking
3. เพิ่ม test RLS shop isolation
4. เพิ่ม seed/test data reset script
5. เขียนคู่มือ QA หลัง deploy

## ข้อควรระวัง

- ห้ามลบ `.next.backup-devcache` แบบไม่ตั้งใจ ถ้ายังต้องการย้อน cache รอบก่อน แต่ไม่ต้อง commit
- ถ้า dev UI เพี้ยนอีก ให้เช็ค CSS 404 และ `.next` cache ก่อน
- ถ้าจะลบ booking test ต้องทำหลังได้รับคำสั่งชัดเจน เพราะเป็นข้อมูลจริงใน Supabase
