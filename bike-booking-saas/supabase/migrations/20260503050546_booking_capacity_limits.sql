begin;

with day_keys(day_key) as (
  values ('mon'), ('tue'), ('wed'), ('thu'), ('fri'), ('sat'), ('sun')
),
normalized as (
  select
    s.id,
    jsonb_object_agg(
      day_keys.day_key,
      coalesce(s.working_hours -> day_keys.day_key, '{}'::jsonb)
      || jsonb_build_object(
        'enabled', coalesce((s.working_hours -> day_keys.day_key ->> 'enabled')::boolean, false),
        'start', coalesce(s.working_hours -> day_keys.day_key ->> 'start', '09:00'),
        'end', coalesce(s.working_hours -> day_keys.day_key ->> 'end', '18:00'),
        'slot_capacity', greatest(coalesce(nullif(s.working_hours -> day_keys.day_key ->> 'slot_capacity', '')::int, 1), 1),
        'daily_limit', greatest(coalesce(nullif(s.working_hours -> day_keys.day_key ->> 'daily_limit', '')::int, 0), 0)
      )
    ) as working_hours
  from bike_booking.shops s
  cross join day_keys
  group by s.id
)
update bike_booking.shops s
set working_hours = normalized.working_hours
from normalized
where normalized.id = s.id;

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
  slot_capacity int;
  daily_limit int;
  daily_booking_count int;
  booking_start_at timestamp;
  booking_end_at timestamp;
  segment_start_at timestamp;
  segment_end_at timestamp;
  overlapping_count int;
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

  if new.booking_time_end <= new.booking_time_start then
    raise exception 'เวลาจองไม่ถูกต้อง';
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

  open_time := coalesce(hours ->> 'start', '09:00')::time;
  close_time := coalesce(hours ->> 'end', '18:00')::time;
  slot_capacity := greatest(coalesce(nullif(hours ->> 'slot_capacity', '')::int, 1), 1);
  daily_limit := greatest(coalesce(nullif(hours ->> 'daily_limit', '')::int, 0), 0);

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

  if new.status in ('confirmed', 'in_progress') then
    perform pg_advisory_xact_lock(hashtextextended(new.shop_id::text || ':' || new.booking_date::text, 0));

    if daily_limit > 0 then
      select count(*)::int
      into daily_booking_count
      from bike_booking.bookings b
      where b.shop_id = new.shop_id
        and b.booking_date = new.booking_date
        and b.status not in ('cancelled', 'no_show')
        and b.id <> coalesce(new.id, gen_random_uuid());

      if daily_booking_count >= daily_limit then
        raise exception 'วันนี้คิวเต็มแล้ว';
      end if;
    end if;

    booking_start_at := (new.booking_date + new.booking_time_start)::timestamp;
    booking_end_at := (new.booking_date + new.booking_time_end)::timestamp;
    segment_start_at := booking_start_at;

    while segment_start_at < booking_end_at loop
      segment_end_at := least(segment_start_at + interval '1 hour', booking_end_at);

      select count(*)::int
      into overlapping_count
      from bike_booking.bookings b
      where b.shop_id = new.shop_id
        and b.booking_date = new.booking_date
        and b.status in ('confirmed', 'in_progress')
        and b.id <> coalesce(new.id, gen_random_uuid())
        and segment_start_at::time < b.booking_time_end
        and segment_end_at::time > b.booking_time_start;

      if overlapping_count >= slot_capacity then
        raise exception 'เวลานี้เต็มแล้ว';
      end if;

      segment_start_at := segment_end_at;
    end loop;
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
  perform pg_advisory_xact_lock(hashtextextended(p_shop_id::text || ':' || p_booking_date::text, 0));

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
