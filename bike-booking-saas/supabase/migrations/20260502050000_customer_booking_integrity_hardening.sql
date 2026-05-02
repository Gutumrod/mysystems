begin;

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
  open_time time;
  close_time time;
begin
  if new.booking_date < (timezone('Asia/Bangkok', now()))::date then
    raise exception 'ไม่สามารถจองวันที่ผ่านมาแล้ว';
  end if;

  if new.booking_date > ((timezone('Asia/Bangkok', now()))::date + interval '45 days')::date then
    raise exception 'จองล่วงหน้าได้ไม่เกิน 45 วัน';
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

  open_time := (hours ->> 'start')::time;
  close_time := (hours ->> 'end')::time;

  if new.booking_time_start < open_time or new.booking_time_end > close_time then
    raise exception 'เวลาที่เลือกอยู่นอกเวลาทำการ';
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

create or replace function bike_booking.create_public_booking(
  p_shop_id uuid,
  p_customer_name text,
  p_customer_phone text,
  p_customer_fb text,
  p_customer_line_id text,
  p_bike_model text,
  p_bike_year int,
  p_service_items uuid[],
  p_booking_date date,
  p_booking_time_start time,
  p_booking_time_end time,
  p_additional_notes text
)
returns uuid
language plpgsql
security definer
set search_path = bike_booking, public
as $$
declare
  v_booking_id uuid;
  v_duration_hours int;
  v_service_count int;
  v_booking_time_end time;
begin
  if not exists (
    select 1 from bike_booking.shops
    where id = p_shop_id
      and subscription_status in ('trial', 'active')
  ) then
    raise exception 'ร้านนี้ไม่เปิดรับจอง';
  end if;

  select coalesce(sum(s.duration_hours), 0)::int, count(*)::int
  into v_duration_hours, v_service_count
  from bike_booking.service_items s
  where s.shop_id = p_shop_id
    and s.is_active = true
    and s.id = any(p_service_items);

  if p_service_items is null
    or cardinality(p_service_items) = 0
    or cardinality(p_service_items) > 10
    or v_service_count <> cardinality(p_service_items) then
    raise exception 'invalid service items for shop';
  end if;

  v_booking_time_end := (p_booking_time_start + make_interval(hours => v_duration_hours))::time;

  insert into bike_booking.bookings (
    shop_id, customer_name, customer_phone, customer_fb, customer_line_id,
    bike_model, bike_year, service_items,
    booking_date, booking_time_start, booking_time_end,
    additional_notes, status
  ) values (
    p_shop_id, p_customer_name, p_customer_phone, p_customer_fb, p_customer_line_id,
    p_bike_model, p_bike_year, p_service_items,
    p_booking_date, p_booking_time_start, v_booking_time_end,
    p_additional_notes, 'confirmed'
  )
  returning id into v_booking_id;

  return v_booking_id;
end;
$$;

revoke execute on function bike_booking.create_public_booking(uuid,text,text,text,text,text,int,uuid[],date,time,time,text) from public;
grant execute on function bike_booking.create_public_booking(uuid,text,text,text,text,text,int,uuid[],date,time,time,text) to anon, authenticated;

commit;
