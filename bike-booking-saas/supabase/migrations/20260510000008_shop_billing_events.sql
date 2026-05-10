-- Track billing history for CraftBike Control Center.

do $$
begin
  create type bike_booking.billing_event_type as enum ('renewal', 'manual_update', 'payment_marked');
exception
  when duplicate_object then null;
end $$;

create table if not exists bike_booking.shop_billing_events (
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

create index if not exists idx_shop_billing_events_shop_created_at
  on bike_booking.shop_billing_events(shop_id, created_at desc);

alter table bike_booking.shop_billing_events enable row level security;

drop policy if exists "Platform admins read billing events" on bike_booking.shop_billing_events;
create policy "Platform admins read billing events" on bike_booking.shop_billing_events
for select using (bike_booking.is_platform_admin());

drop policy if exists "Platform admins write billing events" on bike_booking.shop_billing_events;
create policy "Platform admins write billing events" on bike_booking.shop_billing_events
for insert with check (bike_booking.is_platform_admin());

grant select, insert on bike_booking.shop_billing_events to authenticated;
