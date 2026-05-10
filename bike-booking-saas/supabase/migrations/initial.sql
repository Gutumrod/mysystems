create extension if not exists "pgcrypto";
create schema if not exists bike_booking;

create type bike_booking.subscription_status as enum ('trial', 'active', 'suspended', 'cancelled');
create type bike_booking.booking_status as enum ('confirmed', 'in_progress', 'completed', 'cancelled', 'no_show');
create type bike_booking.shop_user_role as enum ('owner', 'staff');

create table bike_booking.shops (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  name text not null,
  phone text,
  line_id text,
  facebook_url text,
  billing_plan text,
  billing_due_date date,
  expires_at date,
  billing_note text,
  working_hours jsonb not null default '{
    "mon":{"enabled":true,"start":"09:00","end":"18:00","slot_capacity":1,"daily_limit":0},
    "tue":{"enabled":true,"start":"09:00","end":"18:00","slot_capacity":1,"daily_limit":0},
    "wed":{"enabled":true,"start":"09:00","end":"18:00","slot_capacity":1,"daily_limit":0},
    "thu":{"enabled":true,"start":"09:00","end":"18:00","slot_capacity":1,"daily_limit":0},
    "fri":{"enabled":true,"start":"09:00","end":"18:00","slot_capacity":1,"daily_limit":0},
    "sat":{"enabled":true,"start":"09:00","end":"17:00","slot_capacity":1,"daily_limit":0},
    "sun":{"enabled":false,"start":"09:00","end":"17:00","slot_capacity":1,"daily_limit":0}
  }'::jsonb,
  regular_holidays text[] not null default array['sun'],
  subscription_status bike_booking.subscription_status not null default 'trial',
  created_at timestamptz not null default now()
);

create table bike_booking.service_items (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references bike_booking.shops(id) on delete cascade,
  name text not null,
  duration_hours int not null check (duration_hours between 1 and 12),
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table bike_booking.shop_holidays (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references bike_booking.shops(id) on delete cascade,
  holiday_date date not null,
  reason text,
  unique (shop_id, holiday_date)
);

create table bike_booking.customers (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references bike_booking.shops(id) on delete cascade,
  phone text not null,
  name text not null,
  total_bookings int not null default 0,
  no_show_count int not null default 0,
  is_blacklisted boolean not null default false,
  blacklist_reason text,
  created_at timestamptz not null default now(),
  unique (shop_id, phone)
);

create table bike_booking.bookings (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references bike_booking.shops(id) on delete cascade,
  customer_name text not null,
  customer_phone text not null,
  customer_fb text,
  customer_line_id text,
  booking_date date not null,
  booking_time_start time not null,
  booking_time_end time not null,
  bike_model text not null,
  bike_year int check (bike_year is null or bike_year between 1990 and extract(year from now())::int + 1),
  service_items uuid[] not null,
  additional_notes text check (additional_notes is null or char_length(additional_notes) <= 500),
  status bike_booking.booking_status not null default 'confirmed',
  customer_showed_up boolean,
  created_at timestamptz not null default now(),
  check (booking_time_end > booking_time_start)
);

create table bike_booking.shop_users (
  shop_id uuid not null references bike_booking.shops(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role bike_booking.shop_user_role not null default 'staff',
  primary key (shop_id, user_id)
);

create type bike_booking.platform_user_role as enum ('super_admin');

create table bike_booking.platform_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role bike_booking.platform_user_role not null default 'super_admin',
  created_at timestamptz not null default now()
);

create type bike_booking.platform_activity_action as enum ('status_change', 'billing_update', 'shop_deleted');

create type bike_booking.billing_event_type as enum ('renewal', 'manual_update', 'payment_marked');

create table bike_booking.platform_activity_logs (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references auth.users(id) on delete set null,
  actor_email text not null,
  action bike_booking.platform_activity_action not null,
  target_shop_id uuid references bike_booking.shops(id) on delete set null,
  target_shop_slug text not null,
  target_shop_name text not null,
  before_status bike_booking.subscription_status,
  after_status bike_booking.subscription_status,
  note text,
  created_at timestamptz not null default now()
);

create table bike_booking.shop_billing_events (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references bike_booking.shops(id) on delete cascade,
  actor_user_id uuid references auth.users(id) on delete set null,
  actor_email text not null,
  event_type bike_booking.billing_event_type not null,
  billing_plan text,
  billing_due_date date,
  expires_at date,
  note text,
  created_at timestamptz not null default now()
);

create type bike_booking.billing_event_type as enum ('renewal', 'manual_update', 'payment_marked');

create table bike_booking.shop_billing_events (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references bike_booking.shops(id) on delete cascade,
  actor_user_id uuid references auth.users(id) on delete set null,
  actor_email text not null,
  event_type bike_booking.billing_event_type not null,
  billing_plan text,
  billing_due_date date,
  expires_at date,
  note text,
  created_at timestamptz not null default now()
);

create index idx_shops_slug on bike_booking.shops(slug);
create index idx_bookings_shop_date on bike_booking.bookings(shop_id, booking_date);
create index idx_service_items_shop on bike_booking.service_items(shop_id, is_active);
create index idx_customers_phone on bike_booking.customers(shop_id, phone);
create index idx_platform_activity_logs_created_at on bike_booking.platform_activity_logs(created_at desc);
create index idx_platform_activity_logs_shop on bike_booking.platform_activity_logs(target_shop_id, created_at desc);
create index idx_shop_billing_events_shop_created_at on bike_booking.shop_billing_events(shop_id, created_at desc);
create index idx_shop_billing_events_shop_created_at on bike_booking.shop_billing_events(shop_id, created_at desc);

create view bike_booking.public_booking_slots as
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

create or replace function bike_booking.is_shop_admin(target_shop_id uuid)
returns boolean
language sql
security definer
set search_path = bike_booking, public
stable
as $$
  select exists (
    select 1 from bike_booking.shop_users
    where shop_id = target_shop_id and user_id = auth.uid()
  );
$$;

create or replace function bike_booking.is_platform_admin()
returns boolean
language sql
security definer
set search_path = bike_booking, public
stable
as $$
  select exists (
    select 1
    from bike_booking.platform_users
    where user_id = auth.uid()
  );
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

create trigger bookings_assert_rules
before insert or update of booking_date, booking_time_start, booking_time_end, service_items, status, customer_phone
on bike_booking.bookings
for each row execute function bike_booking.assert_booking_rules();

create or replace function bike_booking.sync_customer_stats()
returns trigger
language plpgsql
security definer
set search_path = bike_booking, public
as $$
begin
  insert into bike_booking.customers (shop_id, phone, name, total_bookings)
  values (new.shop_id, new.customer_phone, new.customer_name, 1)
  on conflict (shop_id, phone) do update
    set name = excluded.name,
        total_bookings = bike_booking.customers.total_bookings + 1;
  return new;
end;
$$;

create trigger bookings_sync_customer
after insert on bike_booking.bookings
for each row execute function bike_booking.sync_customer_stats();

create or replace function bike_booking.sync_customer_stats_on_status_change()
returns trigger
language plpgsql
security definer
set search_path = bike_booking, public
as $$
begin
  if old.status <> 'cancelled' and new.status = 'cancelled' then
    update bike_booking.customers
    set total_bookings = greatest(total_bookings - 1, 0)
    where shop_id = new.shop_id and phone = new.customer_phone;
  elsif old.status = 'cancelled' and new.status <> 'cancelled' then
    update bike_booking.customers
    set total_bookings = total_bookings + 1
    where shop_id = new.shop_id and phone = new.customer_phone;
  end if;

  return new;
end;
$$;

create trigger bookings_sync_customer_status_change
after update of status on bike_booking.bookings
for each row
when (old.status is distinct from new.status)
execute function bike_booking.sync_customer_stats_on_status_change();

create or replace function bike_booking.sync_customer_stats_on_delete()
returns trigger
language plpgsql
security definer
set search_path = bike_booking, public
as $$
declare
  next_no_show_count int;
begin
  update bike_booking.customers
  set
    total_bookings = greatest(total_bookings - case when old.status <> 'cancelled' then 1 else 0 end, 0),
    no_show_count = greatest(no_show_count - case when old.status = 'no_show' then 1 else 0 end, 0)
  where shop_id = old.shop_id and phone = old.customer_phone
  returning no_show_count into next_no_show_count;

  if found then
    update bike_booking.customers
    set
      is_blacklisted = next_no_show_count >= 3,
      blacklist_reason = case when next_no_show_count >= 3 then coalesce(blacklist_reason, 'no_show threshold met') else null end
    where shop_id = old.shop_id and phone = old.customer_phone;
  end if;

  return old;
end;
$$;

create trigger bookings_sync_customer_delete
after delete on bike_booking.bookings
for each row execute function bike_booking.sync_customer_stats_on_delete();

create or replace function bike_booking.mark_booking_no_show(target_booking_id uuid)
returns void
language plpgsql
security definer
set search_path = bike_booking, public
as $$
declare
  target_booking bike_booking.bookings;
begin
  select * into target_booking from bike_booking.bookings where id = target_booking_id;
  if not found or not bike_booking.is_shop_admin(target_booking.shop_id) then
    raise exception 'not allowed';
  end if;

  update bike_booking.bookings
  set status = 'no_show', customer_showed_up = false
  where id = target_booking_id;

  update bike_booking.customers
  set no_show_count = no_show_count + 1,
      is_blacklisted = no_show_count + 1 >= 3,
      blacklist_reason = case when no_show_count + 1 >= 3 then 'No-show 3 ครั้งขึ้นไป' else blacklist_reason end
  where shop_id = target_booking.shop_id and phone = target_booking.customer_phone;
end;
$$;

alter table bike_booking.shops enable row level security;
alter table bike_booking.service_items enable row level security;
alter table bike_booking.shop_holidays enable row level security;
alter table bike_booking.bookings enable row level security;
alter table bike_booking.customers enable row level security;
alter table bike_booking.shop_users enable row level security;
alter table bike_booking.platform_users enable row level security;
alter table bike_booking.platform_activity_logs enable row level security;
alter table bike_booking.shop_billing_events enable row level security;

create policy "Public can read active shops" on bike_booking.shops
for select using (subscription_status in ('trial', 'active'));

create policy "Admins can update own shops" on bike_booking.shops
for update using (bike_booking.is_shop_admin(id)) with check (bike_booking.is_shop_admin(id));

create policy "Public can read active services" on bike_booking.service_items
for select using (is_active = true or bike_booking.is_shop_admin(shop_id));

create policy "Admins manage services" on bike_booking.service_items
for all using (bike_booking.is_shop_admin(shop_id)) with check (bike_booking.is_shop_admin(shop_id));

create policy "Public can read active shop holidays" on bike_booking.shop_holidays
for select using (
  exists (
    select 1 from bike_booking.shops s
    where s.id = shop_holidays.shop_id
      and s.subscription_status in ('trial', 'active')
  )
);

create policy "Admins manage holidays" on bike_booking.shop_holidays
for all using (bike_booking.is_shop_admin(shop_id)) with check (bike_booking.is_shop_admin(shop_id));

create policy "Public can create bookings for active shops" on bike_booking.bookings
for insert with check (
  status = 'confirmed'
  and exists (
    select 1 from bike_booking.shops s
    where s.id = bookings.shop_id
      and s.subscription_status in ('trial', 'active')
  )
  and service_items is not null
  and cardinality(service_items) between 1 and 10
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

create policy "Public can read recent confirmed bookings" on bike_booking.bookings
for select using (
  status = 'confirmed'
  and created_at > now() - interval '30 minutes'
);

create policy "Admins can read own bookings" on bike_booking.bookings
for select using (bike_booking.is_shop_admin(shop_id));

create policy "Admins manage own bookings" on bike_booking.bookings
for update using (bike_booking.is_shop_admin(shop_id)) with check (bike_booking.is_shop_admin(shop_id));

create policy "Admins delete own bookings" on bike_booking.bookings
for delete using (bike_booking.is_shop_admin(shop_id));

create policy "Admins can read customers" on bike_booking.customers
for select using (bike_booking.is_shop_admin(shop_id));

create policy "Admins can update customers" on bike_booking.customers
for update using (bike_booking.is_shop_admin(shop_id)) with check (bike_booking.is_shop_admin(shop_id));

create policy "Users read own memberships" on bike_booking.shop_users
for select using (user_id = auth.uid());

create policy "Owners manage memberships" on bike_booking.shop_users
for all using (bike_booking.is_shop_admin(shop_id)) with check (bike_booking.is_shop_admin(shop_id));

create policy "Users read own platform membership" on bike_booking.platform_users
for select using (user_id = auth.uid());

create policy "Platform admins manage platform users" on bike_booking.platform_users
for all using (bike_booking.is_platform_admin()) with check (bike_booking.is_platform_admin());

create policy "Platform admins read activity logs" on bike_booking.platform_activity_logs
for select using (bike_booking.is_platform_admin());

create policy "Platform admins write activity logs" on bike_booking.platform_activity_logs
for insert with check (bike_booking.is_platform_admin());

create policy "Platform admins read billing events" on bike_booking.shop_billing_events
for select using (bike_booking.is_platform_admin());

create policy "Platform admins write billing events" on bike_booking.shop_billing_events
for insert with check (bike_booking.is_platform_admin());

grant usage on schema bike_booking to anon, authenticated;
grant select on bike_booking.shops, bike_booking.service_items, bike_booking.shop_holidays, bike_booking.public_booking_slots to anon, authenticated;
grant insert, select on bike_booking.bookings to anon, authenticated;
grant select, update, delete on bike_booking.bookings to authenticated;
grant select, insert, update, delete on bike_booking.service_items, bike_booking.shop_holidays to authenticated;
grant select, update, delete on bike_booking.shops to authenticated;
grant select, update on bike_booking.customers to authenticated;
grant select on bike_booking.shop_users to authenticated;
grant select on bike_booking.platform_users to authenticated;
grant select, insert on bike_booking.platform_activity_logs to authenticated;
grant select, insert on bike_booking.shop_billing_events to authenticated;
grant execute on function bike_booking.mark_booking_no_show(uuid) to authenticated;

do $$
begin
  create type bike_booking.signup_request_status as enum ('pending', 'approved', 'rejected');
exception
  when duplicate_object then null;
end $$;

create table bike_booking.signup_requests (
  id uuid primary key default gen_random_uuid(),
  requested_email text not null,
  requested_shop_name text not null,
  requested_slug text not null,
  requested_phone text,
  requested_note text,
  auth_user_id uuid references auth.users(id) on delete set null,
  status bike_booking.signup_request_status not null default 'pending',
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_note text,
  approved_shop_id uuid references bike_booking.shops(id) on delete set null,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  updated_at timestamptz not null default now()
);

create index idx_signup_requests_status_created_at on bike_booking.signup_requests(status, created_at desc);
create index idx_signup_requests_slug on bike_booking.signup_requests(requested_slug);
create index idx_signup_requests_auth_user on bike_booking.signup_requests(auth_user_id);

create or replace function bike_booking.sync_signup_requests_updated_at()
returns trigger
language plpgsql
security definer
set search_path = bike_booking, public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists signup_requests_sync_updated_at on bike_booking.signup_requests;
create trigger signup_requests_sync_updated_at
before update on bike_booking.signup_requests
for each row execute function bike_booking.sync_signup_requests_updated_at();

create or replace function bike_booking.default_signup_working_hours()
returns jsonb
language sql
immutable
as $$
  select '{
    "mon":{"enabled":true,"start":"09:00","end":"18:00","slot_capacity":1,"daily_limit":0},
    "tue":{"enabled":true,"start":"09:00","end":"18:00","slot_capacity":1,"daily_limit":0},
    "wed":{"enabled":true,"start":"09:00","end":"18:00","slot_capacity":1,"daily_limit":0},
    "thu":{"enabled":true,"start":"09:00","end":"18:00","slot_capacity":1,"daily_limit":0},
    "fri":{"enabled":true,"start":"09:00","end":"18:00","slot_capacity":1,"daily_limit":0},
    "sat":{"enabled":true,"start":"09:00","end":"17:00","slot_capacity":1,"daily_limit":0},
    "sun":{"enabled":false,"start":"09:00","end":"17:00","slot_capacity":1,"daily_limit":0}
  }'::jsonb;
$$;

create or replace function bike_booking.provision_signup_request(target_request_id uuid)
returns uuid
language plpgsql
security definer
set search_path = bike_booking, public
as $$
declare
  target_request bike_booking.signup_requests;
  v_shop_id uuid;
  v_due_date date := (timezone('Asia/Bangkok', now())::date + 7);
begin
  if not bike_booking.is_platform_admin() then
    raise exception 'not allowed';
  end if;

  select * into target_request
  from bike_booking.signup_requests
  where id = target_request_id
  for update;

  if not found then
    raise exception 'signup request not found';
  end if;

  if target_request.status <> 'pending' then
    raise exception 'signup request already processed';
  end if;

  if target_request.auth_user_id is null then
    raise exception 'signup request missing auth user';
  end if;

  if exists (select 1 from bike_booking.shops where slug = target_request.requested_slug) then
    raise exception 'shop slug already exists';
  end if;

  insert into bike_booking.shops (
    slug,
    name,
    phone,
    line_id,
    facebook_url,
    working_hours,
    regular_holidays,
    subscription_status,
    billing_plan,
    billing_due_date,
    expires_at,
    billing_note
  )
  values (
    target_request.requested_slug,
    target_request.requested_shop_name,
    target_request.requested_phone,
    null,
    null,
    bike_booking.default_signup_working_hours(),
    array['sun']::text[],
    'trial',
    'trial',
    v_due_date,
    v_due_date,
    coalesce(target_request.requested_note, 'อนุมัติจากคำขอสมัครร้าน')
  )
  returning id into v_shop_id;

  insert into bike_booking.service_items (shop_id, name, duration_hours, duration_unit, duration_value, is_active, sort_order)
  values
    (v_shop_id, 'ตรวจเช็ครถ', 1, 'hour', 1, true, 1),
    (v_shop_id, 'เปลี่ยนน้ำมันเครื่อง', 1, 'hour', 1, true, 2),
    (v_shop_id, 'ติดตั้งของแต่ง', 3, 'hour', 3, true, 3),
    (v_shop_id, 'ฝากรถค้าง', 1, 'day', 1, true, 4);

  insert into bike_booking.shop_users (shop_id, user_id, role)
  values (v_shop_id, target_request.auth_user_id, 'owner')
  on conflict (shop_id, user_id) do update
  set role = excluded.role;

  update bike_booking.signup_requests
  set status = 'approved',
      approved_shop_id = v_shop_id,
      reviewed_by = auth.uid(),
      reviewed_at = now(),
      reviewed_note = coalesce(reviewed_note, 'approved')
  where id = target_request.id;

  insert into bike_booking.platform_activity_logs (
    actor_user_id,
    actor_email,
    action,
    target_shop_id,
    target_shop_slug,
    target_shop_name,
    before_status,
    after_status,
    note
  )
  values (
    auth.uid(),
    coalesce((select email from auth.users where id = auth.uid()), 'system'),
    'status_change',
    v_shop_id,
    target_request.requested_slug,
    target_request.requested_shop_name,
    null,
    'trial',
    'อนุมัติคำขอสมัครร้าน'
  );

  return v_shop_id;
end;
$$;

create or replace function bike_booking.reject_signup_request(target_request_id uuid, note text default null)
returns void
language plpgsql
security definer
set search_path = bike_booking, public
as $$
declare
  target_request bike_booking.signup_requests;
begin
  if not bike_booking.is_platform_admin() then
    raise exception 'not allowed';
  end if;

  select * into target_request
  from bike_booking.signup_requests
  where id = target_request_id
  for update;

  if not found then
    raise exception 'signup request not found or already processed';
  end if;

  update bike_booking.signup_requests
  set status = 'rejected',
      reviewed_by = auth.uid(),
      reviewed_at = now(),
      reviewed_note = coalesce(nullif(note, ''), reviewed_note, 'rejected')
  where id = target_request_id
    and status = 'pending';

  if not found then
    raise exception 'signup request not found or already processed';
  end if;

  insert into bike_booking.platform_activity_logs (
    actor_user_id,
    actor_email,
    action,
    target_shop_id,
    target_shop_slug,
    target_shop_name,
    before_status,
    after_status,
    note
  )
  values (
    auth.uid(),
    coalesce((select email from auth.users where id = auth.uid()), 'system'),
    'status_change',
    null,
    target_request.requested_slug,
    target_request.requested_shop_name,
    null,
    null,
    coalesce(nullif(note, ''), 'ปฏิเสธคำขอสมัครร้าน')
  );
end;
$$;

alter table bike_booking.signup_requests enable row level security;

create policy "Users read own signup requests" on bike_booking.signup_requests
for select using (auth_user_id = auth.uid());

create policy "Platform admins manage signup requests" on bike_booking.signup_requests
for all using (bike_booking.is_platform_admin()) with check (bike_booking.is_platform_admin());

grant select, insert, update, delete on bike_booking.signup_requests to authenticated;
grant execute on function bike_booking.provision_signup_request(uuid) to authenticated;
grant execute on function bike_booking.reject_signup_request(uuid, text) to authenticated;



