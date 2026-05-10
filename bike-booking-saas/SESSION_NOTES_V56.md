# SESSION_NOTES_V56

## สรุป

- แก้ renewal ของ CraftBike Control Center ให้เป็นแบบต่อจากยอดเดิม
- ตอนกดต่ออายุร้าน ระบบจะเอาวันที่ไกลสุดระหว่าง `today / billing_due_date / expires_at` มาเป็นฐาน แล้วค่อยบวกวันเพิ่ม
- ทำให้กดต่อ 30 วันหลังจากต่อ 1 ปีแล้ว จะได้วันที่ใหม่ที่ยาวขึ้นจริง
- `billing history` และ `activity log` ยังทำงานเหมือนเดิม

## สิ่งที่แก้

- `extendBilling()` ใน `apps/booking-admin/components/platform/PlatformAdminConsole.tsx`
- renewal note จะบอกชัดว่า “ต่ออายุ X วัน จาก YYYY-MM-DD ถึง YYYY-MM-DD”

## ผลเทส

- `npm --workspace apps/booking-admin run lint` ผ่าน
- `npm --workspace apps/booking-admin run build` ผ่าน

## commit ล่าสุด

- ยังไม่ commit ตอนบันทึก note นี้

## ข้อควรระวัง

- renewal ต้องใช้วันที่ฐานที่ไกลสุดก่อนบวกวันเพิ่ม

## ส่งต่อให้ใคร

- Codex เครื่องถัดไป
- เจ้าของระบบ CraftBike
