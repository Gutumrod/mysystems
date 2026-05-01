insert into bike_booking.shops (id, slug, name, phone, line_id, facebook_url, subscription_status)
values
  ('11111111-1111-1111-1111-111111111111', 'bangkok-bike-care', 'Bangkok Bike Care', '081-111-2222', '@bangkokbike', 'https://facebook.com/bangkokbikecare', 'active'),
  ('22222222-2222-2222-2222-222222222222', 'chiangmai-customs', 'Chiangmai Customs', '082-333-4444', '@cmcustoms', 'https://facebook.com/chiangmaicustoms', 'trial')
on conflict (id) do nothing;

insert into bike_booking.service_items (shop_id, name, duration_hours, is_active, sort_order)
values
  ('11111111-1111-1111-1111-111111111111', 'เปลี่ยนน้ำมันเครื่อง', 1, true, 1),
  ('11111111-1111-1111-1111-111111111111', 'เช็คระยะทั่วไป', 2, true, 2),
  ('11111111-1111-1111-1111-111111111111', 'ติดตั้งของแต่ง', 3, true, 3),
  ('22222222-2222-2222-2222-222222222222', 'ตรวจเช็คเบรก', 1, true, 1),
  ('22222222-2222-2222-2222-222222222222', 'ล้างหัวฉีด', 2, true, 2),
  ('22222222-2222-2222-2222-222222222222', 'เซ็ตช่วงล่าง', 3, true, 3);

insert into bike_booking.shop_holidays (shop_id, holiday_date, reason)
values
  ('11111111-1111-1111-1111-111111111111', current_date + interval '10 days', 'อบรมทีมช่าง'),
  ('22222222-2222-2222-2222-222222222222', current_date + interval '14 days', 'ปิดปรับปรุงร้าน');

