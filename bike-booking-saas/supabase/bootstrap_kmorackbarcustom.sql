begin;

do $$
declare
  v_shop_id uuid;
begin
  insert into bike_booking.shops (
    slug,
    name,
    phone,
    line_id,
    facebook_url,
    working_hours,
    regular_holidays,
    subscription_status
  )
  values (
    'kmorackbarcustom',
    'KMORackBarCustom',
    '0625893189',
    null,
    'https://www.facebook.com/Kmo4307',
    '{
      "mon":{"enabled":true,"start":"09:00","end":"18:00","slot_capacity":1,"daily_limit":0},
      "tue":{"enabled":true,"start":"09:00","end":"18:00","slot_capacity":1,"daily_limit":0},
      "wed":{"enabled":true,"start":"09:00","end":"18:00","slot_capacity":1,"daily_limit":0},
      "thu":{"enabled":true,"start":"09:00","end":"18:00","slot_capacity":1,"daily_limit":0},
      "fri":{"enabled":true,"start":"09:00","end":"18:00","slot_capacity":1,"daily_limit":0},
      "sat":{"enabled":true,"start":"09:00","end":"17:00","slot_capacity":1,"daily_limit":0},
      "sun":{"enabled":false,"start":"09:00","end":"17:00","slot_capacity":1,"daily_limit":0}
    }'::jsonb,
    array['sun']::text[],
    'trial'
  )
  on conflict (slug) do update set
    name = excluded.name,
    phone = excluded.phone,
    line_id = excluded.line_id,
    facebook_url = excluded.facebook_url,
    working_hours = excluded.working_hours,
    regular_holidays = excluded.regular_holidays,
    subscription_status = excluded.subscription_status
  returning id into v_shop_id;

  delete from bike_booking.service_items
  where shop_id = v_shop_id
    and name in ('ตรวจเช็ครถ', 'เปลี่ยนน้ำมันเครื่อง', 'ติดตั้งของแต่ง');

  insert into bike_booking.service_items (shop_id, name, duration_hours, is_active, sort_order)
  values
    (v_shop_id, 'ตรวจเช็ครถ', 1, true, 1),
    (v_shop_id, 'เปลี่ยนน้ำมันเครื่อง', 1, true, 2),
    (v_shop_id, 'ติดตั้งของแต่ง', 3, true, 3);

  raise notice 'KMORackBarCustom shop id: %', v_shop_id;
end $$;

commit;

-- หลังจากสร้าง auth user ของ owner ใน Supabase Auth แล้ว
-- ให้นำ user id ที่ได้มาใส่ในคำสั่งนี้:
--
-- insert into bike_booking.shop_users (shop_id, user_id, role)
-- values (
--   (select id from bike_booking.shops where slug = 'kmorackbarcustom'),
--   '<AUTH_USER_ID>',
--   'owner'
-- )
-- on conflict (shop_id, user_id) do update
-- set role = excluded.role;
