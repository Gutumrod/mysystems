begin;

do $$
begin
  if to_regprocedure('bike_booking.is_platform_admin()') is not null then
    revoke execute on function bike_booking.is_platform_admin() from public, anon;
    grant execute on function bike_booking.is_platform_admin() to authenticated;
  end if;
end;
$$;

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
    and b.created_at > now() - interval '24 hours'
  limit 1;
$$;

revoke execute on function bike_booking.get_public_booking_confirmation(uuid, uuid) from public;
grant execute on function bike_booking.get_public_booking_confirmation(uuid, uuid) to anon, authenticated;

commit;
