-- Harden signup requests and related auth policies.

begin;

create index if not exists idx_signup_requests_approved_shop_id
  on bike_booking.signup_requests(approved_shop_id);

create index if not exists idx_signup_requests_reviewed_by
  on bike_booking.signup_requests(reviewed_by);

create or replace function bike_booking.is_shop_admin(target_shop_id uuid)
returns boolean
language sql
security definer
set search_path = bike_booking, public
stable
as $$
  select exists (
    select 1 from bike_booking.shop_users
    where shop_id = target_shop_id
      and user_id = (select auth.uid())
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
    where user_id = (select auth.uid())
  );
$$;

do $$
begin
  if to_regprocedure('bike_booking.is_shop_admin(uuid)') is not null then
    revoke execute on function bike_booking.is_shop_admin(uuid) from public, anon;
    grant execute on function bike_booking.is_shop_admin(uuid) to authenticated;
  end if;

  if to_regprocedure('bike_booking.is_platform_admin()') is not null then
    revoke execute on function bike_booking.is_platform_admin() from public, anon;
    grant execute on function bike_booking.is_platform_admin() to authenticated;
  end if;
end;
$$;

create or replace function bike_booking.default_signup_working_hours()
returns jsonb
language sql
immutable
set search_path = pg_catalog
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

drop policy if exists "Users read own signup requests" on bike_booking.signup_requests;
create policy "Users read own signup requests" on bike_booking.signup_requests
for select using (auth_user_id = (select auth.uid()));

drop policy if exists "Users read own memberships" on bike_booking.shop_users;
create policy "Users read own memberships" on bike_booking.shop_users
for select using (user_id = (select auth.uid()));

drop policy if exists "Users read own platform membership" on bike_booking.platform_users;
create policy "Users read own platform membership" on bike_booking.platform_users
for select using (user_id = (select auth.uid()));

do $$
begin
  if to_regprocedure('bike_booking.default_signup_working_hours()') is not null then
    revoke execute on function bike_booking.default_signup_working_hours() from public, anon, authenticated;
  end if;

  if to_regprocedure('bike_booking.sync_signup_requests_updated_at()') is not null then
    revoke execute on function bike_booking.sync_signup_requests_updated_at() from public, anon, authenticated;
  end if;

  if to_regprocedure('bike_booking.provision_signup_request(uuid)') is not null then
    revoke execute on function bike_booking.provision_signup_request(uuid) from public, anon;
    grant execute on function bike_booking.provision_signup_request(uuid) to authenticated;
  end if;

  if to_regprocedure('bike_booking.reject_signup_request(uuid, text)') is not null then
    revoke execute on function bike_booking.reject_signup_request(uuid, text) from public, anon;
    grant execute on function bike_booking.reject_signup_request(uuid, text) to authenticated;
  end if;
end;
$$;

commit;
