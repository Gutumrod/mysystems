-- Migration: add machine-readable error code (SQLSTATE 'BK409') to the two
-- booking-conflict raise statements inside assert_booking_rules(), so the
-- frontend can detect conflicts via error.code instead of matching Thai
-- message substrings. Everything else in this function is byte-identical
-- to the version in 20260511000000_daily_working_day_holidays.sql.

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
          raise exception 'เวลานี้เต็มแล้ว' using errcode = 'BK409';
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
            raise exception 'คิวรายวันเต็มแล้ว' using errcode = 'BK409';
          end if;
        end if;
      end loop;
    end if;
  end if;

  return new;
end;
$$;
