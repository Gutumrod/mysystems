create type bike_booking.platform_user_role as enum ('super_admin');

create table bike_booking.platform_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role bike_booking.platform_user_role not null default 'super_admin',
  created_at timestamptz not null default now()
);

create unique index idx_shop_users_one_owner_per_shop
  on bike_booking.shop_users (shop_id)
  where role = 'owner';

create or replace function bike_booking.assert_single_shop_owner()
returns trigger
language plpgsql
security definer
set search_path = bike_booking, public
as $$
begin
  if new.role = 'owner' and exists (
    select 1
    from bike_booking.shop_users su
    where su.shop_id = new.shop_id
      and su.role = 'owner'
      and (
        tg_op <> 'UPDATE'
        or su.user_id <> old.user_id
      )
  ) then
    raise exception 'แต่ละร้านมีเจ้าของได้เพียง 1 คน';
  end if;

  return new;
end;
$$;

drop trigger if exists shop_users_assert_single_owner on bike_booking.shop_users;
create trigger shop_users_assert_single_owner
before insert or update of shop_id, role
on bike_booking.shop_users
for each row execute function bike_booking.assert_single_shop_owner();

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

create policy "Users read own platform membership" on bike_booking.platform_users
for select using (user_id = auth.uid());

create policy "Platform admins manage platform users" on bike_booking.platform_users
for all using (bike_booking.is_platform_admin()) with check (bike_booking.is_platform_admin());

create policy "Platform admins manage shops" on bike_booking.shops
for all using (bike_booking.is_platform_admin()) with check (bike_booking.is_platform_admin());

create policy "Platform admins manage services" on bike_booking.service_items
for all using (bike_booking.is_platform_admin()) with check (bike_booking.is_platform_admin());

create policy "Platform admins manage holidays" on bike_booking.shop_holidays
for all using (bike_booking.is_platform_admin()) with check (bike_booking.is_platform_admin());

create policy "Platform admins manage bookings" on bike_booking.bookings
for all using (bike_booking.is_platform_admin()) with check (bike_booking.is_platform_admin());

create policy "Platform admins manage customers" on bike_booking.customers
for all using (bike_booking.is_platform_admin()) with check (bike_booking.is_platform_admin());

create policy "Platform admins manage memberships" on bike_booking.shop_users
for all using (bike_booking.is_platform_admin()) with check (bike_booking.is_platform_admin());

grant select on bike_booking.platform_users to authenticated;
