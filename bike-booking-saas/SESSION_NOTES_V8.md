# SESSION NOTES V8 - Phase 4 Deploy Hardening

วันที่บันทึก: 1 พฤษภาคม 2026  
โปรเจค: `bike-booking-saas`

## เป้าหมายรอบนี้

เดินงานต่อเองโดยไม่รอผู้ใช้กลับ และโฟกัสที่ blocker ล่าสุดก่อน deploy:

1. ตรวจ repo ตัวจริงและ sync context ล่าสุด
2. หา root cause ของ Vercel runtime/deploy issue
3. แก้สิ่งที่ทำได้จากฝั่งโค้ดและ monorepo wiring
4. เก็บรายงานไว้ให้ตามต่อได้จากมือถือ

## สิ่งที่ทำ

### 1. ย้ายมาทำงานบน path ตัวจริง

repo หลักที่ใช้งานจริง:

- `C:\Users\Win10\Documents\mysystems\bike-booking-saas`

ตรวจแล้วสถานะ git สะอาดตอนเริ่มรอบนี้ และ repo นี้ตรงกับ GitHub `Gutumrod/mysystems`

### 2. sync อัปเดตจาก GitHub

pull ล่าสุดจาก `origin/main` สำเร็จ

commit ใหม่ที่ดึงเข้ามา:

- `ab254b3` add bike-booking-saas - phase 3 complete, monorepo structure
- `a780963` refactor: rename to apps/booking-consumer and apps/booking-admin
- `aa1983e` add session notes v7
- `5de74b2` feat: add multi-tenant subdomain routing
- `7e42699` fix: remove outputFileTracingRoot for Vercel compatibility
- `e836d90` fix: correct outputFileTracingRoot for Vercel repo root

### 3. อ่าน context ล่าสุด

ไฟล์ที่อ่าน:

- `SESSION_NOTES_V7.md`
- `DEPLOY_PLAN.md`
- `README.md`

ข้อสรุป:

- Phase 3 จบแล้ว
- ตอนนี้อยู่ใน Phase 4
- แผน deploy ถูกวางไว้ค่อนข้างครบ
- blocker หลักคือฝั่ง Vercel runtime/build reliability

### 4. ใช้ worker สแกนสาเหตุ Vercel issue

worker review ให้สัญญาณที่มีประโยชน์ 2 จุด:

1. `package-lock.json` ยังสะท้อน workspace เก่า (`shop-frontend`, `shop-admin`)
2. `outputFileTracingRoot` น่าจะตั้งสูงเกิน monorepo root

ตรวจซ้ำในเครื่องแล้วพบจริง:

- `package-lock.json` เก่ามี workspace เก่า
- `node_modules` มี junction ไป path เก่าใน `C:\Users\Win10\Documents\New project\...`
- `npm ls --workspaces --depth=0` ให้สถานะผิดปกติจาก install graph เก่า

### 5. แก้ `outputFileTracingRoot`

ปรับทั้ง 2 app จาก:

- `../../..`

เป็น:

- `../..`

เพื่อให้ trace จาก monorepo root `bike-booking-saas` โดยตรง

ไฟล์ที่แก้:

- `apps/booking-consumer/next.config.ts`
- `apps/booking-admin/next.config.ts`

### 6. regenerate lockfile ให้ตรงโครงปัจจุบัน

รัน:

```bash
npm install --package-lock-only
```

ผล:

- root workspace ใน `package-lock.json` เปลี่ยนเป็น:
  - `apps/booking-consumer`
  - `apps/booking-admin`
- entries ของ lockfile ตอนนี้ชี้ไป `apps/...` ถูกต้อง

หมายเหตุ:

- package `name` ภายในแต่ละ app ยังเป็น `shop-frontend` และ `shop-admin`
- จุดนี้ยังไม่ใช่ blocker เพราะชื่อยัง unique อยู่ แต่เป็น technical debt ด้าน naming

### 7. ทำ clean-room verification แยกจาก working copy หลัก

เพื่อไม่ไปแตะ install state หลักของผู้ใช้ ผมคัด repo ไปไว้ใน temp directory แล้วทดสอบใหม่ทั้งหมด:

- install ใหม่
- build ใหม่
- workspace link ใหม่

ผล:

- `npm install` ผ่าน
- `npm run build` ผ่านทั้ง `booking-consumer` และ `booking-admin`
- local clean-room state ไม่เจอ junction ไป path เก่าแล้ว

นี่เป็นสัญญาณดีว่า issue หลักอยู่ที่ monorepo metadata/install state เดิม มากกว่าตัวแอปเอง

### 8. อัปเดต README ให้ตรงโครงจริง

แก้ `README.md` ให้สะท้อน:

- `apps/booking-consumer`
- `apps/booking-admin`
- deploy root directory แบบใหม่

## Verification รอบนี้

ผ่าน:

- `npm run lint`
- `npm run build`
- clean-room install
- clean-room build

## ข้อผิดพลาด/ความเสี่ยงที่พบ

### Risk 1: local `node_modules` เดิมยังเป็น state เก่า

อาการ:

- `node_modules` ใน working copy หลักยังมี junction ชื่อเก่า
- path ชี้ไปโฟลเดอร์เก่าใน `New project`

ผลกระทบ:

- local install state อาจยังหลอกตาได้
- ไม่ควรใช้มันเป็นหลักในการสรุป deploy readiness

สถานะ:

- ยังไม่ได้ cleanup ใน working copy หลักรอบนี้
- หลีกเลี่ยงโดยใช้ clean-room verification แทน

### Risk 2: ยังไม่ได้พิสูจน์บน Vercel จริง

ถึงแม้ local + clean-room จะดีขึ้นมาก แต่ยังไม่ได้พิสูจน์ deployment จริงบน Vercel project

สถานะ:

- ค้างไว้เป็น action ถัดไป

## สิ่งที่ทำได้โดยไม่รอผู้ใช้

ทำแล้ว:

- sync code
- วิเคราะห์ repo
- แก้ monorepo config
- regenerate lockfile
- verify build ใหม่
- อัปเดตเอกสาร

## สิ่งที่ยังต้องแตะระบบภายนอก

ยังคงต้องทำต่อใน Phase 4:

1. สร้าง/ตรวจ Vercel projects จริง
2. ยืนยัน Root Directory ของแต่ละ project
3. ใส่ env vars จริง
4. ตรวจ runtime logs หลัง deploy
5. ตั้ง Supabase Auth redirect URLs
6. ตั้ง Hostinger DNS

## หมายเหตุเรื่องการแจ้งเตือนผู้ใช้

รอบนี้ยังไม่มี automation tool สำหรับ push notification โดยตรงใน session นี้

วิธีที่ใช้งานได้ตอนนี้:

- อัปเดตความคืบหน้าใน thread นี้
- บันทึก `SESSION_NOTES_V8.md` เพื่อเปิดดูต่อจากมือถือ/เครื่องอื่นได้

ถ้าจะส่ง email แจ้ง milestone จริงภายหลัง ต้องมีการยืนยันตอนส่งตามกติกาความปลอดภัย

## ไฟล์ที่แก้ในรอบนี้

- `C:\Users\Win10\Documents\mysystems\bike-booking-saas\apps\booking-consumer\next.config.ts`
- `C:\Users\Win10\Documents\mysystems\bike-booking-saas\apps\booking-admin\next.config.ts`
- `C:\Users\Win10\Documents\mysystems\bike-booking-saas\package-lock.json`
- `C:\Users\Win10\Documents\mysystems\bike-booking-saas\README.md`
- `C:\Users\Win10\Documents\mysystems\bike-booking-saas\SESSION_NOTES_V8.md`

## ขั้นตอนต่อไปที่แนะนำ

1. ใช้โค้ดชุดนี้เป็นฐาน deploy ต่อ
2. ตรวจ Vercel project settings จริงว่า root directory ถูก
3. ทำ deploy test รอบแรก
4. ถ้า runtime ยังพัง ให้ดู logs แล้วเทียบกับ fix รอบนี้
5. ถ้าผ่าน ค่อยไป Supabase Auth + DNS + end-to-end verification
