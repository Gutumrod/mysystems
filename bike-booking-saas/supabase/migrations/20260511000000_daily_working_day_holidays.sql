begin;

create or replace function bike_booking.is_shop_open_on_date(
  p_shop_id uuid,
  p_date date
)
returns boolean
language plpgsql
security definer
set search_path = bike_booking, public
as $$
declare
  day_key text;
  hours jsonb;
  blocked boolean;
begin
  select case extract(dow from p_date)::int
    when 0 then 'sun'
    when 1 then 'mon'
    when 2 then 'tue'
    when 3 then 'wed'
    when 4 then 'thu'
    when 5 then 'fri'
    else 'sat'
  end into day_key;

  select s.working_hours -> day_key, day_key = any(s.regular_holidays)
  into hours, blocked
  from bike_booking.shops s
  where s.id = p_shop_id;

  if not found then
    return false;
  end if;

  return not coalesce(blocked, false)
    and coalesce((hours ->> 'enabled')::boolean, false)
    and not exists (
      select 1
      from bike_booking.shop_holidays h
      where h.shop_id = p_shop_id
        and h.holiday_date = p_date
    );
end;
$$;

create or replace function bike_booking.calculate_daily_booking_end_date(
  p_shop_id uuid,
  p_start_date date,
  p_required_days int
)
returns date
language plpgsql
security definer
set search_path = bike_booking, public
as $$
declare
  remaining_days int := greatest(coalesce(p_required_days, 1), 1);
  cursor_date date := p_start_date;
  last_open_date date := p_start_date;
begin
  for guard in 1..370 loop
    if bike_booking.is_shop_open_on_date(p_shop_id, cursor_date) then
      remaining_days := remaining_days - 1;
      last_open_date := cursor_date;

      if remaining_days <= 0 then
        return last_open_date;
      end if;
    end if;

    cursor_date := cursor_date + 1;
  end loop;

  raise exception 'ไม่พบวันเปิดทำการสำหรับการจองแบบรายวัน';
end;
$$;

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
  service_unit text;
  service_unit_count int;
  valid_service_count int;
  booking_mode bike_booking.booking_kind;
  current_date date;
  today_bangkok date := (timezone('Asia/Bangkok', now()))::date;
  required_days int;
  minimum_end_date date;
begin
  if new.service_items is null or cardinality(new.service_items) = 0 or cardinality(new.service_items) > 10 then
    raise exception 'invalid service items';
  end if;

  select
    count(*)::int,
    count(distinct s.duration_unit)::int,
    min(s.duration_unit)
  into valid_service_count, service_unit_count, service_unit
  from bike_booking.service_items s
  where s.shop_id = new.shop_id
    and s.is_active = true
    and s.id = any(new.service_items);

  if valid_service_count <> cardinality(new.service_items) then
    raise exception 'invalid service items for shop';
  end if;

  if service_unit_count > 1 or service_unit is null then
    raise exception 'mixed service types are not allowed';
  end if;

  booking_mode := case when service_unit = 'day' then 'daily' else 'hourly' end;

  if new.booking_kind is null then
    new.booking_kind := booking_mode;
  end if;

  if new.booking_kind <> booking_mode then
    raise exception 'service type and booking mode do not match';
  end if;

  if new.status in ('confirmed', 'in_progress') then
    if new.booking_date < today_bangkok then
      raise exception 'ไม่สามารถจองวันที่ผ่านมาแล้ว';
    end if;

    if new.booking_date > (today_bangkok + interval '45 days')::date then
      raise exception 'จองล่วงหน้าได้ไม่เกิน 45 วัน';
    end if;

    if exists (
      select 1
      from bike_booking.customers c
      where c.shop_id = new.shop_id
        and c.phone = new.customer_phone
        and c.is_blacklisted = true
    ) then
      raise exception 'ติดต่อร้านโดยตรง';
    end if;

    if new.booking_kind = 'hourly' then
      if new.booking_time_start is null or new.booking_time_end is null then
        raise exception 'เวลาจองไม่ถูกต้อง';
      end if;

      if new.booking_end_date is not null then
        raise exception 'งานแบบรายชั่วโมงไม่ต้องใช้วันสิ้นสุด';
      end if;

      if new.booking_time_end <= new.booking_time_start then
        raise exception 'เวลาจองไม่ถูกต้อง';
      end if;

      if new.booking_date = today_bangkok
        and new.booking_time_start < (timezone('Asia/Bangkok', now()))::time then
        raise exception 'ไม่สามารถจองเวลาที่ผ่านมาแล้ว';
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
        select 1
        from bike_booking.shop_holidays h
        where h.shop_id = new.shop_id
          and h.holiday_date = new.booking_date
      ) then
        raise exception 'ร้านหยุดพิเศษในวันที่เลือก';
      end if;

      open_time := coalesce(hours ->> 'start', '09:00')::time;
      close_time := coalesce(hours ->> 'end', '18:00')::time;
      slot_capacity := greatest(coalesce(nullif(hours ->> 'slot_capacity', '')::int, 1), 1);

      if new.booking_time_start < open_time or new.booking_time_end > close_time then
        raise exception 'เวลาที่เลือกอยู่นอกเวลาทำการ';
      end if;

      perform pg_advisory_xact_lock(hashtextextended(new.shop_id::text || ':' || new.booking_date::text || ':hourly', 0));

      booking_start_at := (new.booking_date + new.booking_time_start)::timestamp;
      booking_end_at := (new.booking_date + new.booking_time_end)::timestamp;
      segment_start_at := booking_start_at;

      while segment_start_at < booking_end_at loop
        segment_end_at := least(segment_start_at + interval '1 hour', booking_end_at);

        select count(*)::int
        into overlapping_count
        from bike_booking.bookings b
        where b.shop_id = new.shop_id
          and b.booking_kind = 'hourly'
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
    else
      if new.booking_end_date is null then
        raise exception 'กรุณาเลือกวันสิ้นสุด';
      end if;

      if new.booking_time_start is not null or new.booking_time_end is not null then
        raise exception 'งานแบบรายวันไม่ใช้เวลา';
      end if;

      if new.booking_end_date < new.booking_date then
        raise exception 'วันสิ้นสุดต้องไม่ก่อนวันเริ่ม';
      end if;

      if not bike_booking.is_shop_open_on_date(new.shop_id, new.booking_date) then
        raise exception 'ร้านหยุดในวันที่เลือก';
      end if;

      if not bike_booking.is_shop_open_on_date(new.shop_id, new.booking_end_date) then
        raise exception 'วันสิ้นสุดต้องเป็นวันเปิดทำการ';
      end if;

      select coalesce(sum(s.duration_value), 0)::int
      into required_days
      from bike_booking.service_items s
      where s.shop_id = new.shop_id
        and s.is_active = true
        and s.id = any(new.service_items)
        and s.duration_unit = 'day';

      minimum_end_date := bike_booking.calculate_daily_booking_end_date(new.shop_id, new.booking_date, greatest(required_days, 1));

      if new.booking_end_date < minimum_end_date then
        raise exception 'วันสิ้นสุดสั้นกว่าระยะเวลาบริการรวม';
      end if;

      if new.booking_end_date > (today_bangkok + interval '45 days')::date then
        raise exception 'จองล่วงหน้าได้ไม่เกิน 45 วัน';
      end if;

      for current_date in
        select generate_series(new.booking_date, new.booking_end_date, interval '1 day')::date
      loop
        if not bike_booking.is_shop_open_on_date(new.shop_id, current_date) then
          continue;
        end if;

        perform pg_advisory_xact_lock(hashtextextended(new.shop_id::text || ':' || current_date::text || ':daily', 0));

        select case extract(dow from current_date)::int
          when 0 then 'sun' when 1 then 'mon' when 2 then 'tue' when 3 then 'wed'
          when 4 then 'thu' when 5 then 'fri' else 'sat'
        end into day_key;

        select s.working_hours -> day_key, day_key = any(s.regular_holidays)
        into hours, blocked
        from bike_booking.shops s
        where s.id = new.shop_id;

        daily_limit := greatest(coalesce(nullif(hours ->> 'daily_limit', '')::int, 0), 0);
        if daily_limit > 0 then
          select count(*)::int
          into daily_booking_count
          from bike_booking.bookings b
          where b.shop_id = new.shop_id
            and b.booking_kind = 'daily'
            and b.status in ('confirmed', 'in_progress')
            and b.id <> coalesce(new.id, gen_random_uuid())
            and b.booking_date <= current_date
            and coalesce(b.booking_end_date, b.booking_date) >= current_date;

          if daily_booking_count >= daily_limit then
            raise exception 'คิวรายวันเต็มแล้ว';
          end if;
        end if;
      end loop;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists bookings_assert_rules on bike_booking.bookings;
create trigger bookings_assert_rules
before insert or update of booking_kind, booking_date, booking_end_date, booking_time_start, booking_time_end, service_items, status, customer_phone
on bike_booking.bookings
for each row execute function bike_booking.assert_booking_rules();

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
  p_booking_kind bike_booking.booking_kind,
  p_booking_end_date date,
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
  v_required_days int;
  v_service_count int;
  v_booking_time_end time;
  v_booking_kind bike_booking.booking_kind;
  v_service_unit text;
  v_service_unit_count int;
  v_minimum_end_date date;
begin
  perform pg_advisory_xact_lock(hashtextextended(p_shop_id::text || ':' || p_booking_date::text, 0));

  if not exists (
    select 1 from bike_booking.shops
    where id = p_shop_id
      and subscription_status in ('trial', 'active')
  ) then
    raise exception 'ร้านนี้ไม่เปิดรับจอง';
  end if;

  select
    count(*)::int,
    count(distinct s.duration_unit)::int,
    min(s.duration_unit),
    coalesce(sum(case when s.duration_unit = 'hour' then s.duration_value else 0 end), 0)::int,
    coalesce(sum(case when s.duration_unit = 'day' then s.duration_value else 0 end), 0)::int
  into v_service_count, v_service_unit_count, v_service_unit, v_duration_hours, v_required_days
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

  if v_service_unit_count > 1 or v_service_unit is null then
    raise exception 'mixed service types are not allowed';
  end if;

  v_booking_kind := case when v_service_unit = 'day' then 'daily' else 'hourly' end;

  if p_booking_kind is null then
    p_booking_kind := v_booking_kind;
  else
    p_booking_kind := p_booking_kind::bike_booking.booking_kind;
  end if;

  if p_booking_kind <> v_booking_kind then
    raise exception 'service type and booking mode do not match';
  end if;

  if p_booking_kind = 'hourly' then
    if p_booking_time_start is null then
      raise exception 'กรุณาเลือกเวลา';
    end if;

    if p_booking_time_end is null then
      p_booking_time_end := (p_booking_time_start + make_interval(hours => v_duration_hours))::time;
    end if;

    if p_booking_time_end <= p_booking_time_start then
      raise exception 'เวลาจองไม่ถูกต้อง';
    end if;
  else
    if p_booking_end_date is null then
      raise exception 'กรุณาเลือกวันสิ้นสุด';
    end if;

    if not bike_booking.is_shop_open_on_date(p_shop_id, p_booking_date) then
      raise exception 'ร้านหยุดในวันที่เลือก';
    end if;

    if not bike_booking.is_shop_open_on_date(p_shop_id, p_booking_end_date) then
      raise exception 'วันสิ้นสุดต้องเป็นวันเปิดทำการ';
    end if;

    v_minimum_end_date := bike_booking.calculate_daily_booking_end_date(
      p_shop_id,
      p_booking_date,
      greatest(v_required_days, 1)
    );

    if p_booking_end_date < v_minimum_end_date then
      raise exception 'วันสิ้นสุดสั้นกว่าระยะเวลาบริการรวม';
    end if;
  end if;

  insert into bike_booking.bookings (
    shop_id, customer_name, customer_phone, customer_fb, customer_line_id,
    bike_model, bike_year, service_items,
    booking_kind, booking_date, booking_end_date, booking_time_start, booking_time_end,
    additional_notes, status
  ) values (
    p_shop_id, p_customer_name, p_customer_phone, p_customer_fb, p_customer_line_id,
    p_bike_model, p_bike_year, p_service_items,
    p_booking_kind,
    p_booking_date,
    case when p_booking_kind = 'daily' then p_booking_end_date else null end,
    case when p_booking_kind = 'daily' then null else p_booking_time_start end,
    case when p_booking_kind = 'daily' then null else p_booking_time_end end,
    p_additional_notes, 'confirmed'
  )
  returning id into v_booking_id;

  return v_booking_id;
end;
$$;

drop function if exists bike_booking.create_public_booking(
  uuid, text, text, text, text, text, int, uuid[], date, text, date, time, time, text
);

revoke execute on function bike_booking.create_public_booking(
  uuid, text, text, text, text, text, int, uuid[], date, bike_booking.booking_kind, date, time, time, text
) from public;
grant execute on function bike_booking.create_public_booking(
  uuid, text, text, text, text, text, int, uuid[], date, bike_booking.booking_kind, date, time, time, text
) to anon, authenticated;

revoke execute on function bike_booking.is_shop_open_on_date(uuid, date) from public, anon, authenticated;
revoke execute on function bike_booking.calculate_daily_booking_end_date(uuid, date, int) from public, anon, authenticated;

commit;
