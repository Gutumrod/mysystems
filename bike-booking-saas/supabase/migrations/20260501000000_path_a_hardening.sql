create or replace view bike_booking.public_booking_slots as
select
  b.id,
  b.shop_id,
  b.booking_date,
  b.booking_time_start,
  b.booking_time_end,
  b.status
from bike_booking.bookings b
join bike_booking.shops s on s.id = b.shop_id
where b.status in ('confirmed', 'in_progress')
  and s.subscription_status in ('trial', 'active');

grant select on bike_booking.public_booking_slots to anon, authenticated;

create or replace function bike_booking.assert_booking_rules()
returns trigger
language plpgsql
security definer
set search_path = bike_booking, public
as $$
declare
  day_key text;
  hours jsonb;
  blocked boolean;
begin
  if new.booking_date < (timezone('Asia/Bangkok', now()))::date then
    raise exception 'ไม่สามารถจองวันที่ผ่านมาแล้ว';
  end if;

  if new.booking_date = (timezone('Asia/Bangkok', now()))::date
    and new.booking_time_start < (timezone('Asia/Bangkok', now()))::time then
    raise exception 'ไม่สามารถจองเวลาที่ผ่านมาแล้ว';
  end if;

  if new.service_items is null or cardinality(new.service_items) = 0 or cardinality(new.service_items) > 10 then
    raise exception 'invalid service items';
  end if;

  if exists (
    select 1
    from unnest(new.service_items) as requested_service(id)
    left join bike_booking.service_items s
      on s.id = requested_service.id
      and s.shop_id = new.shop_id
      and s.is_active = true
    where s.id is null
  ) then
    raise exception 'invalid service items for shop';
  end if;

  select case extract(dow from new.booking_date)::int
    when 0 then 'sun' when 1 then 'mon' when 2 then 'tue' when 3 then 'wed'
    when 4 then 'thu' when 5 then 'fri' else 'sat'
  end into day_key;

  select s.working_hours -> day_key, day_key = any(s.regular_holidays)
  into hours, blocked
  from bike_booking.shops s
  where s.id = new.shop_id;

  if blocked or coalesce((hours ->> 'enabled')::boolean, false) = false then
    raise exception 'ร้านหยุดในวันที่เลือก';
  end if;

  if exists (
    select 1 from bike_booking.shop_holidays h
    where h.shop_id = new.shop_id and h.holiday_date = new.booking_date
  ) then
    raise exception 'ร้านหยุดพิเศษในวันที่เลือก';
  end if;

  if exists (
    select 1 from bike_booking.customers c
    where c.shop_id = new.shop_id
      and c.phone = new.customer_phone
      and c.is_blacklisted = true
  ) then
    raise exception 'ติดต่อร้านโดยตรง';
  end if;

  if exists (
    select 1 from bike_booking.bookings b
    where b.shop_id = new.shop_id
      and b.booking_date = new.booking_date
      and b.status in ('confirmed', 'in_progress')
      and b.id <> coalesce(new.id, gen_random_uuid())
      and new.booking_time_start < b.booking_time_end
      and new.booking_time_end > b.booking_time_start
  ) then
    raise exception 'เวลานี้มีคนจองแล้ว';
  end if;

  return new;
end;
$$;

