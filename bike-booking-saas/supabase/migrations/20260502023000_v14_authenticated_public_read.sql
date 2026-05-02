begin;

create policy "Authenticated users can read active shops" on bike_booking.shops
for select
to authenticated
using (subscription_status in ('trial', 'active'));

create policy "Authenticated users can read active services" on bike_booking.service_items
for select
to authenticated
using (is_active = true);

create policy "Authenticated users can read active shop holidays" on bike_booking.shop_holidays
for select
to authenticated
using (
  exists (
    select 1 from bike_booking.shops s
    where s.id = shop_holidays.shop_id
      and s.subscription_status in ('trial', 'active')
  )
);

commit;
