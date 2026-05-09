-- Transfer the old test owner account to platform admin use.
-- This removes the email from shop-level membership and grants platform control access instead.

begin;

delete from bike_booking.shop_users
where user_id = '54e28e6e-684f-4318-9f32-11809972c5f2';

insert into bike_booking.platform_users (user_id, role)
values (
  '54e28e6e-684f-4318-9f32-11809972c5f2',
  'super_admin'
)
on conflict (user_id) do update
set role = excluded.role;

commit;
