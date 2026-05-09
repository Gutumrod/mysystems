begin;

create or replace function bike_booking.sync_customer_stats_on_delete()
returns trigger
language plpgsql
security definer
set search_path = bike_booking, public
as $$
declare
  next_no_show_count int;
begin
  update bike_booking.customers
  set
    total_bookings = greatest(total_bookings - case when old.status <> 'cancelled' then 1 else 0 end, 0),
    no_show_count = greatest(no_show_count - case when old.status = 'no_show' then 1 else 0 end, 0)
  where shop_id = old.shop_id
    and phone = old.customer_phone
  returning no_show_count into next_no_show_count;

  if found then
    update bike_booking.customers
    set
      is_blacklisted = next_no_show_count >= 3,
      blacklist_reason = case when next_no_show_count >= 3 then coalesce(blacklist_reason, 'no_show threshold met') else null end
    where shop_id = old.shop_id
      and phone = old.customer_phone;
  end if;

  return old;
end;
$$;

drop trigger if exists bookings_sync_customer_delete on bike_booking.bookings;
create trigger bookings_sync_customer_delete
after delete on bike_booking.bookings
for each row execute function bike_booking.sync_customer_stats_on_delete();

drop policy if exists "Admins delete own bookings" on bike_booking.bookings;
create policy "Admins delete own bookings" on bike_booking.bookings
for delete
to authenticated
using (bike_booking.is_shop_admin(shop_id));

grant delete on bike_booking.bookings to authenticated;

commit;
