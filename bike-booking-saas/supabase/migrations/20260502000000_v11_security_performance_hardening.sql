-- V11 hardening migration
-- Goal:
-- 1) reduce exposed SECURITY DEFINER surface
-- 2) split public/admin RLS paths more cleanly
-- 3) add missing FK index
-- 4) make booking slots view run with caller privileges

begin;

-- 1. Add the missing covering index for shop_users.user_id.
create index if not exists idx_shop_users_user_id
  on bike_booking.shop_users(user_id);

-- 2. Revoke execute on trigger/internal functions from public API roles.
revoke execute on function bike_booking.assert_booking_rules() from public, anon, authenticated;
revoke execute on function bike_booking.sync_customer_stats() from public, anon, authenticated;
revoke execute on function bike_booking.sync_customer_stats_on_status_change() from public, anon, authenticated;

-- 3. Restrict helper/admin RPC functions more tightly.
revoke execute on function bike_booking.is_shop_admin(uuid) from public, anon;
grant execute on function bike_booking.is_shop_admin(uuid) to authenticated;

create or replace function bike_booking.is_shop_owner(target_shop_id uuid)
returns boolean
language sql
security definer
set search_path = bike_booking, public
stable
as $$
  select exists (
    select 1 from bike_booking.shop_users
    where shop_id = target_shop_id
      and user_id = auth.uid()
      and role = 'owner'
  );
$$;

revoke execute on function bike_booking.is_shop_owner(uuid) from public, anon;
grant execute on function bike_booking.is_shop_owner(uuid) to authenticated;

revoke execute on function bike_booking.mark_booking_no_show(uuid) from public, anon;
grant execute on function bike_booking.mark_booking_no_show(uuid) to authenticated;

create or replace function bike_booking.get_public_booking_confirmation(target_booking_id uuid, target_shop_id uuid)
returns table (
  id uuid,
  shop_id uuid,
  customer_name text,
  customer_phone text,
  booking_date date,
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
    and b.created_at > now() - interval '30 minutes'
  limit 1;
$$;

revoke execute on function bike_booking.get_public_booking_confirmation(uuid, uuid) from public;
grant execute on function bike_booking.get_public_booking_confirmation(uuid, uuid) to anon, authenticated;

-- 4. Split public/admin SELECT paths so anonymous traffic no longer depends on admin helper functions.

drop policy if exists "Public can read active shops" on bike_booking.shops;
drop policy if exists "Admins can update own shops" on bike_booking.shops;

create policy "Public can read active shops" on bike_booking.shops
for select
to anon
using (subscription_status in ('trial', 'active'));

create policy "Admins can read own shops" on bike_booking.shops
for select
to authenticated
using (bike_booking.is_shop_admin(id));

create policy "Admins can update own shops" on bike_booking.shops
for update
to authenticated
using (bike_booking.is_shop_admin(id))
with check (bike_booking.is_shop_admin(id));

drop policy if exists "Public can read active services" on bike_booking.service_items;
drop policy if exists "Admins manage services" on bike_booking.service_items;

create policy "Public can read active services" on bike_booking.service_items
for select
to anon
using (is_active = true);

create policy "Admins can read own services" on bike_booking.service_items
for select
to authenticated
using (bike_booking.is_shop_admin(shop_id));

create policy "Admins insert own services" on bike_booking.service_items
for insert
to authenticated
with check (bike_booking.is_shop_admin(shop_id));

create policy "Admins update own services" on bike_booking.service_items
for update
to authenticated
using (bike_booking.is_shop_admin(shop_id))
with check (bike_booking.is_shop_admin(shop_id));

create policy "Admins delete own services" on bike_booking.service_items
for delete
to authenticated
using (bike_booking.is_shop_admin(shop_id));

drop policy if exists "Public can read active shop holidays" on bike_booking.shop_holidays;
drop policy if exists "Admins manage holidays" on bike_booking.shop_holidays;

create policy "Public can read active shop holidays" on bike_booking.shop_holidays
for select
to anon
using (
  exists (
    select 1 from bike_booking.shops s
    where s.id = shop_holidays.shop_id
      and s.subscription_status in ('trial', 'active')
  )
);

create policy "Admins can read own holidays" on bike_booking.shop_holidays
for select
to authenticated
using (bike_booking.is_shop_admin(shop_id));

create policy "Admins insert own holidays" on bike_booking.shop_holidays
for insert
to authenticated
with check (bike_booking.is_shop_admin(shop_id));

create policy "Admins update own holidays" on bike_booking.shop_holidays
for update
to authenticated
using (bike_booking.is_shop_admin(shop_id))
with check (bike_booking.is_shop_admin(shop_id));

create policy "Admins delete own holidays" on bike_booking.shop_holidays
for delete
to authenticated
using (bike_booking.is_shop_admin(shop_id));

drop policy if exists "Public can create bookings for active shops" on bike_booking.bookings;
drop policy if exists "Public can read recent confirmed bookings" on bike_booking.bookings;
drop policy if exists "Admins can read own bookings" on bike_booking.bookings;
drop policy if exists "Admins manage own bookings" on bike_booking.bookings;

create policy "Public can create bookings for active shops" on bike_booking.bookings
for insert
to anon
with check (
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

create policy "Admins can read own bookings" on bike_booking.bookings
for select
to authenticated
using (bike_booking.is_shop_admin(shop_id));

create policy "Admins update own bookings" on bike_booking.bookings
for update
to authenticated
using (bike_booking.is_shop_admin(shop_id))
with check (bike_booking.is_shop_admin(shop_id));

drop policy if exists "Admins can read customers" on bike_booking.customers;
drop policy if exists "Admins can update customers" on bike_booking.customers;

create policy "Admins can read customers" on bike_booking.customers
for select
to authenticated
using (bike_booking.is_shop_admin(shop_id));

create policy "Admins can update customers" on bike_booking.customers
for update
to authenticated
using (bike_booking.is_shop_admin(shop_id))
with check (bike_booking.is_shop_admin(shop_id));

drop policy if exists "Users read own memberships" on bike_booking.shop_users;
drop policy if exists "Owners manage memberships" on bike_booking.shop_users;

create policy "Users read own memberships" on bike_booking.shop_users
for select
to authenticated
using (user_id = (select auth.uid()));

create policy "Owners insert memberships" on bike_booking.shop_users
for insert
to authenticated
with check (bike_booking.is_shop_owner(shop_id));

create policy "Owners update memberships" on bike_booking.shop_users
for update
to authenticated
using (bike_booking.is_shop_owner(shop_id))
with check (bike_booking.is_shop_owner(shop_id));

create policy "Owners delete memberships" on bike_booking.shop_users
for delete
to authenticated
using (bike_booking.is_shop_owner(shop_id));

commit;
