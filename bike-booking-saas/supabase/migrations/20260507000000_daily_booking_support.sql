begin;

do $$
begin
  create type bike_booking.service_duration_unit as enum ('hour', 'day');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type bike_booking.booking_kind as enum ('hourly', 'daily');
exception
  when duplicate_object then null;
end $$;

alter table bike_booking.service_items
  add column if not exists duration_unit bike_booking.service_duration_unit not null default 'hour',
  add column if not exists duration_value int not null default 1 check (duration_value between 1 and 365);

update bike_booking.service_items
set duration_unit = coalesce(duration_unit, 'hour'),
    duration_value = coalesce(nullif(duration_value, 0), duration_hours, 1)
where duration_unit is null or duration_value is null or duration_value = 0;

alter table bike_booking.bookings
  add column if not exists booking_kind bike_booking.booking_kind not null default 'hourly',
  add column if not exists booking_end_date date;

alter table bike_booking.bookings
  alter column booking_time_start drop not null,
  alter column booking_time_end drop not null;

alter table bike_booking.bookings
  drop constraint if exists bookings_mode_shape;

alter table bike_booking.bookings
  add constraint bookings_mode_shape check (
    (
      booking_kind = 'hourly'
      and booking_time_start is not null
      and booking_time_end is not null
      and booking_end_date is null
    )
    or
    (
      booking_kind = 'daily'
      and booking_end_date is not null
      and booking_end_date >= booking_date
      and booking_time_start is null
      and booking_time_end is null
    )
  );

create index if not exists idx_bookings_shop_end_date on bike_booking.bookings(shop_id, booking_end_date);
create index if not exists idx_bookings_shop_kind on bike_booking.bookings(shop_id, booking_kind);

drop view if exists bike_booking.public_booking_slots;

create view bike_booking.public_booking_slots as
select
  b.id,
  b.shop_id,
  b.booking_date,
  b.booking_end_date,
  b.booking_kind,
  b.booking_time_start,
  b.booking_time_end,
  b.status
from bike_booking.bookings b
join bike_booking.shops s on s.id = b.shop_id
where b.status in ('confirmed', 'in_progress')
  and s.subscription_status in ('trial', 'active');

drop function if exists bike_booking.get_public_booking_confirmation(uuid, uuid);

create or replace function bike_booking.get_public_booking_confirmation(target_booking_id uuid, target_shop_id uuid)
returns table (
  id uuid,
  shop_id uuid,
  customer_name text,
  customer_phone text,
  booking_date date,
  booking_end_date date,
  booking_kind bike_booking.booking_kind,
  booking_time_start time,
  booking_time_end time,
  bike_model text,
  bike_year int,
  service_items uuid[],
  additional_notes text
)
language sql
security definer
set search_path = bike_booking, public
stable
as $$
  select
    b.id,
    b.shop_id,
    b.customer_name,
    b.customer_phone,
    b.booking_date,
    b.booking_end_date,
    b.booking_kind,
    b.booking_time_start,
    b.booking_time_end,
    b.bike_model,
    b.bike_year,
    b.service_items,
    b.additional_notes
  from bike_booking.bookings b
  where b.id = target_booking_id
    and b.shop_id = target_shop_id
    and b.status in ('confirmed', 'in_progress', 'completed')
    and b.created_at > now() - interval '24 hours'
  limit 1;
$$;

revoke execute on function bike_booking.get_public_booking_confirmation(uuid, uuid) from public;
grant execute on function bike_booking.get_public_booking_confirmation(uuid, uuid) to anon, authenticated;

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

      if new.booking_end_date > (today_bangkok + interval '45 days')::date then
        raise exception 'จองล่วงหน้าได้ไม่เกิน 45 วัน';
      end if;

      for current_date in
        select generate_series(new.booking_date, new.booking_end_date, interval '1 day')::date
      loop
        perform pg_advisory_xact_lock(hashtextextended(new.shop_id::text || ':' || current_date::text || ':daily', 0));

        select case extract(dow from current_date)::int
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
            and h.holiday_date = current_date
        ) then
          raise exception 'ร้านหยุดพิเศษในวันที่เลือก';
        end if;

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
  v_service_count int;
  v_booking_time_end time;
  v_booking_kind bike_booking.booking_kind;
  v_service_unit text;
  v_service_unit_count int;
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
    coalesce(sum(case when s.duration_unit = 'day' then 1 else s.duration_value end), 0)::int
  into v_service_count, v_service_unit_count, v_service_unit, v_duration_hours
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

    insert into bike_booking.bookings (
      shop_id, customer_name, customer_phone, customer_fb, customer_line_id,
      bike_model, bike_year, service_items,
      booking_kind, booking_date, booking_end_date, booking_time_start, booking_time_end,
      additional_notes, status
    ) values (
      p_shop_id, p_customer_name, p_customer_phone, p_customer_fb, p_customer_line_id,
      p_bike_model, p_bike_year, p_service_items,
      'hourly', p_booking_date, null, p_booking_time_start, p_booking_time_end,
      p_additional_notes, 'confirmed'
    )
    returning id into v_booking_id;
  else
    if p_booking_end_date is null then
      raise exception 'กรุณาเลือกวันสิ้นสุด';
    end if;

    insert into bike_booking.bookings (
      shop_id, customer_name, customer_phone, customer_fb, customer_line_id,
      bike_model, bike_year, service_items,
      booking_kind, booking_date, booking_end_date, booking_time_start, booking_time_end,
      additional_notes, status
    ) values (
      p_shop_id, p_customer_name, p_customer_phone, p_customer_fb, p_customer_line_id,
      p_bike_model, p_bike_year, p_service_items,
      'daily', p_booking_date, p_booking_end_date, null, null,
      p_additional_notes, 'confirmed'
    )
    returning id into v_booking_id;
  end if;

  return v_booking_id;
end;
$$;

revoke execute on function bike_booking.create_public_booking(
  uuid, text, text, text, text, text, int, uuid[], date, bike_booking.booking_kind, date, time, time, text
) from public;
grant execute on function bike_booking.create_public_booking(
  uuid, text, text, text, text, text, int, uuid[], date, bike_booking.booking_kind, date, time, time, text
) to anon, authenticated;

drop policy if exists "Public can create bookings for active shops" on bike_booking.bookings;
create policy "Public can create bookings for active shops" on bike_booking.bookings
for insert with check (
  status = 'confirmed'
  and exists (
    select 1
    from bike_booking.shops s
    where s.id = bookings.shop_id
      and s.subscription_status in ('trial', 'active')
  )
  and service_items is not null
  and cardinality(service_items) between 1 and 10
  and (
    (
      booking_kind = 'hourly'
      and booking_time_start is not null
      and booking_time_end is not null
      and booking_end_date is null
    )
    or
    (
      booking_kind = 'daily'
      and booking_end_date is not null
      and booking_end_date >= booking_date
      and booking_time_start is null
      and booking_time_end is null
    )
  )
  and not exists (
    select 1
    from unnest(service_items) as requested_service(id)
    left join bike_booking.service_items s
      on s.id = requested_service.id
      and s.shop_id = bookings.shop_id
      and s.is_active = true
    where s.id is null
  )
);

commit;
