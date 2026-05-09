-- Bootstrap missing platform admin schema bits for live Supabase.
-- This file is safe to run even if some parts already exist.

begin;

do $$
begin
  create type bike_booking.platform_user_role as enum ('super_admin');
exception
  when duplicate_object then null;
end $$;

create table if not exists bike_booking.platform_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role bike_booking.platform_user_role not null default 'super_admin',
  created_at timestamptz not null default now()
);

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

alter table bike_booking.platform_users enable row level security;

drop policy if exists "Users read own platform membership" on bike_booking.platform_users;
create policy "Users read own platform membership" on bike_booking.platform_users
for select using (user_id = auth.uid());

drop policy if exists "Platform admins manage platform users" on bike_booking.platform_users;
create policy "Platform admins manage platform users" on bike_booking.platform_users
for all using (bike_booking.is_platform_admin()) with check (bike_booking.is_platform_admin());

drop policy if exists "Platform admins manage shops" on bike_booking.shops;
create policy "Platform admins manage shops" on bike_booking.shops
for all using (bike_booking.is_platform_admin()) with check (bike_booking.is_platform_admin());

drop policy if exists "Platform admins manage services" on bike_booking.service_items;
create policy "Platform admins manage services" on bike_booking.service_items
for all using (bike_booking.is_platform_admin()) with check (bike_booking.is_platform_admin());

drop policy if exists "Platform admins manage holidays" on bike_booking.shop_holidays;
create policy "Platform admins manage holidays" on bike_booking.shop_holidays
for all using (bike_booking.is_platform_admin()) with check (bike_booking.is_platform_admin());

drop policy if exists "Platform admins manage bookings" on bike_booking.bookings;
create policy "Platform admins manage bookings" on bike_booking.bookings
for all using (bike_booking.is_platform_admin()) with check (bike_booking.is_platform_admin());

drop policy if exists "Platform admins manage customers" on bike_booking.customers;
create policy "Platform admins manage customers" on bike_booking.customers
for all using (bike_booking.is_platform_admin()) with check (bike_booking.is_platform_admin());

drop policy if exists "Platform admins manage memberships" on bike_booking.shop_users;
create policy "Platform admins manage memberships" on bike_booking.shop_users
for all using (bike_booking.is_platform_admin()) with check (bike_booking.is_platform_admin());

grant select on bike_booking.platform_users to authenticated;

insert into bike_booking.platform_users (user_id, role)
values (
  '54e28e6e-684f-4318-9f32-11809972c5f2',
  'super_admin'
)
on conflict (user_id) do update
set role = excluded.role;

delete from bike_booking.shop_users
where user_id = '54e28e6e-684f-4318-9f32-11809972c5f2';

commit;
