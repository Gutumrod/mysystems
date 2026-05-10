-- Audit trail for CraftBike Control Center actions.

do $$
begin
  create type bike_booking.platform_activity_action as enum ('status_change', 'billing_update', 'shop_deleted');
exception
  when duplicate_object then null;
end $$;

create table if not exists bike_booking.platform_activity_logs (
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

alter table bike_booking.platform_activity_logs enable row level security;

drop policy if exists "Platform admins read activity logs" on bike_booking.platform_activity_logs;
create policy "Platform admins read activity logs" on bike_booking.platform_activity_logs
for select using (bike_booking.is_platform_admin());

drop policy if exists "Platform admins write activity logs" on bike_booking.platform_activity_logs;
create policy "Platform admins write activity logs" on bike_booking.platform_activity_logs
for insert with check (bike_booking.is_platform_admin());

grant select, insert on bike_booking.platform_activity_logs to authenticated;
