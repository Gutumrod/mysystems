# Domain Standard

เอกสารนี้กำหนดมาตรฐานชื่อโดเมนของ `bike-booking-saas` ให้ทุกเครื่อง / ทุก agent อ่านตรงกัน

## บทบาทหลัก

- `customer` = หน้าจองของแต่ละร้าน
- `shop admin` = หน้าจัดการร้านของร้านนั้น
- `platform admin` = หน้าคุมระบบของเจ้าของแพลตฟอร์มทั้งหมด

## มาตรฐานโดเมน

- `https://[shop-slug].craftbikelab.com/`
  - หน้าลูกค้าจองของร้านนั้น
  - ตัวอย่าง: `https://kmorackbarcustom.craftbikelab.com/`

- `https://[shop-slug]-admin.craftbikelab.com/`
  - หน้าแอดมินของร้านนั้น
  - ตัวอย่าง: `https://kmorackbarcustom-admin.craftbikelab.com/`

- `https://control.craftbikelab.com/`
  - หน้า platform admin
  - ใช้คุมทุกร้าน
  - เห็นสถานะร้าน, ใกล้หมดอายุ, ยังไม่จ่าย, suspend / reactivate และภาพรวมระบบ

## กติกา

- ใช้ตัวพิมพ์เล็กทั้งหมด
- `shop-slug` ต้องเหมือนกันทั้ง customer และ shop admin
- `control.craftbikelab.com` ห้ามผูกกับร้านใดร้านหนึ่ง
- ถ้ามีร้านใหม่เข้ามา ให้สร้าง 2 URL ของร้านนั้นอัตโนมัติเป็นหลัก

## Flow อนาคต

ระบบสมัครร้านใหม่ควรทำให้ได้ครบใน flow เดียว:

1. กรอกอีเมลเจ้าของร้าน
2. จ่ายเงิน / ยืนยันแพ็กเกจ
3. สร้าง shop + owner
4. ได้ URL 2 อันของร้านทันที
5. เข้าใช้งานร้านได้

## สิ่งที่ platform admin ต้องทำได้

- ดูร้านทั้งหมด
- ดูร้านที่ใกล้หมดอายุ
- ดูร้านที่ยังไม่จ่ายเงิน
- ระงับร้าน
- เปิดร้านกลับ
- ดูภาพรวม booking ของทุก tenant

