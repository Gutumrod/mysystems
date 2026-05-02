begin;

create policy "Authenticated users can create bookings for active shops" on bike_booking.bookings
for insert
to authenticated
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

commit;
