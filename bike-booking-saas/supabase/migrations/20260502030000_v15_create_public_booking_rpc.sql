begin;

create or replace function bike_booking.create_public_booking(
  p_shop_id           uuid,
  p_customer_name     text,
  p_customer_phone    text,
  p_customer_fb       text,
  p_customer_line_id  text,
  p_bike_model        text,
  p_bike_year         int,
  p_service_items     uuid[],
  p_booking_date      date,
  p_booking_time_start time,
  p_booking_time_end  time,
  p_additional_notes  text
)
returns uuid
language plpgsql
security definer
set search_path = bike_booking, public
as $$
declare
  v_booking_id uuid;
begin
  -- Guard: shop must be active (RLS bypassed in SECURITY DEFINER, so check manually)
  if not exists (
    select 1 from bike_booking.shops
    where id = p_shop_id
      and subscription_status in ('trial', 'active')
  ) then
    raise exception 'ร้านนี้ไม่เปิดรับจอง';
  end if;

  insert into bike_booking.bookings (
    shop_id, customer_name, customer_phone, customer_fb, customer_line_id,
    bike_model, bike_year, service_items,
    booking_date, booking_time_start, booking_time_end,
    additional_notes, status
  ) values (
    p_shop_id, p_customer_name, p_customer_phone, p_customer_fb, p_customer_line_id,
    p_bike_model, p_bike_year, p_service_items,
    p_booking_date, p_booking_time_start, p_booking_time_end,
    p_additional_notes, 'confirmed'
  )
  returning id into v_booking_id;

  return v_booking_id;
end;
$$;

-- Revoke from public, grant only to anon + authenticated
revoke execute on function bike_booking.create_public_booking(uuid,text,text,text,text,text,int,uuid[],date,time,time,text) from public;
grant  execute on function bike_booking.create_public_booking(uuid,text,text,text,text,text,int,uuid[],date,time,time,text) to anon, authenticated;

commit;
