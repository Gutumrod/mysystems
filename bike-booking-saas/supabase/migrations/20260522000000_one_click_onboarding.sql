-- One-Click Tenant Onboarding Stored Procedure
-- Atomically provisions a new tenant shop, default services, and assigns the shop owner.

create or replace function bike_booking.onboard_shop(
  p_slug text,
  p_name text,
  p_phone text,
  p_owner_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = bike_booking, public
as $$
declare
  v_shop_id uuid;
begin
  -- 1. Verify caller is a platform admin
  if not bike_booking.is_platform_admin() then
    raise exception 'สิทธิ์ไม่ถูกต้อง เฉพาะ Platform Admin เท่านั้นที่สามารถเพิ่มร้านค้าได้';
  end if;

  -- 2. Verify owner user exists in auth.users
  if not exists (select 1 from auth.users where id = p_owner_id) then
    raise exception 'ไม่พบรหัสผู้ใช้ (User ID) ของเจ้าของร้านในระบบ กรุณาตรวจสอบรหัสผู้ใช้อีกครั้ง';
  end if;

  -- 3. Insert the shop
  insert into bike_booking.shops (
    slug,
    name,
    phone,
    subscription_status
  )
  values (
    p_slug,
    p_name,
    p_phone,
    'trial'
  )
  returning id into v_shop_id;

  -- 4. Provision default services
  insert into bike_booking.service_items (shop_id, name, duration_hours, is_active, sort_order)
  values
    (v_shop_id, 'ตรวจเช็ครถ', 1, true, 1),
    (v_shop_id, 'เปลี่ยนน้ำมันเครื่อง', 1, true, 2),
    (v_shop_id, 'ติดตั้งของแต่ง', 3, true, 3);

  -- 5. Link the owner user to the shop
  insert into bike_booking.shop_users (shop_id, user_id, role)
  values (
    v_shop_id,
    p_owner_id,
    'owner'
  );

  return v_shop_id;
end;
$$;

grant execute on function bike_booking.onboard_shop to authenticated;
