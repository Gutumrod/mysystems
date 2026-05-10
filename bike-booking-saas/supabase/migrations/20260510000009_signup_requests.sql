-- Track self-service shop signup requests for CraftBike Platform.

do $$
begin
  create type bike_booking.signup_request_status as enum ('pending', 'approved', 'rejected');
exception
  when duplicate_object then null;
end $$;

create table if not exists bike_booking.signup_requests (
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

create index if not exists idx_signup_requests_status_created_at
  on bike_booking.signup_requests(status, created_at desc);

create index if not exists idx_signup_requests_slug
  on bike_booking.signup_requests(requested_slug);

create index if not exists idx_signup_requests_auth_user
  on bike_booking.signup_requests(auth_user_id);

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

drop policy if exists "Users read own signup requests" on bike_booking.signup_requests;
create policy "Users read own signup requests" on bike_booking.signup_requests
for select using (auth_user_id = auth.uid());

drop policy if exists "Platform admins manage signup requests" on bike_booking.signup_requests;
create policy "Platform admins manage signup requests" on bike_booking.signup_requests
for all using (bike_booking.is_platform_admin()) with check (bike_booking.is_platform_admin());

grant select, insert, update, delete on bike_booking.signup_requests to authenticated;
grant execute on function bike_booking.provision_signup_request(uuid) to authenticated;
grant execute on function bike_booking.reject_signup_request(uuid, text) to authenticated;
