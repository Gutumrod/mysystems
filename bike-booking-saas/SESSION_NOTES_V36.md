# SESSION_NOTES_V36

## เหตุการณ์สำคัญ
- เพิ่ม dialog เดียวสำหรับดูรายละเอียด / แก้ไข / ลบ booking ในแอดมิน
- เปิดให้แก้ไขวันนัด, เวลาเริ่ม, เวลาสิ้นสุด, วันสิ้นสุด และหมายเหตุ จาก modal เดิม
- เพิ่มปุ่ม `ดู/แก้ไข` ในหน้า Dashboard, งานวันนี้, และรายการจอง
- เพิ่ม migration สำหรับ delete booking พร้อม trigger อัปเดตสถิติลูกค้า
- อัปเดต `initial.sql` ให้มี policy + trigger ลบ booking ครบชุด
- lint/build ผ่านทั้งฝั่งแอดมิน

## สิ่งที่แก้
- `apps/booking-admin/components/bookings/BookingDetailDialog.tsx`
- `apps/booking-admin/components/bookings/BookingsTable.tsx`
- `apps/booking-admin/components/dashboard/DashboardClient.tsx`
- `apps/booking-admin/components/today/TodayBoard.tsx`
- `supabase/migrations/20260510000000_booking_delete_support.sql`
- `supabase/migrations/initial.sql`

## พฤติกรรมใหม่
- booking ที่ยังเป็นคิววันนี้หรืออนาคต และ mode ตรงกับ service สามารถแก้วัน/เวลาได้
- booking เก่าที่ `service type` กับ `booking mode` ไม่ตรงกันจะโชว์ warning และแนะนำให้ลบแล้วสร้างใหม่
- ปุ่มลบถาวรมีอยู่ใน dialog แล้ว

## สถานะการลบข้อมูลเล่น
- UI รองรับแล้ว
- migration รองรับแล้ว
- แต่ live delete ยังรันไม่ได้จากเครื่องนี้ เพราะ `apps/booking-admin/.env.local` มี `SUPABASE_SERVICE_ROLE_KEY` ว่างอยู่
- ถ้าจะลบ booking เทสใน Supabase live ต้อง apply migration ที่เกี่ยวข้องก่อน หรือให้สิทธิ์ฐานที่ใช้ลบได้

## commit / push
- ยังไม่ได้ commit รอบนี้

## สิ่งที่ต้องทำต่อ
1. apply migration `20260510000000_booking_delete_support.sql` ใน Supabase live
2. ลบ booking เทสที่ค้างอยู่
3. เทส edit booking จริงจาก Dashboard / งานวันนี้ / รายการจอง
4. ถ้านิ่งแล้วค่อยขยับไปฝั่ง customer เพิ่มช่องแก้ข้อมูลลูกค้า

## ลงชื่อ
- Codex
