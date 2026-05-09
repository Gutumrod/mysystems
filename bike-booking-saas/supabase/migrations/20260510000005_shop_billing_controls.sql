-- Add billing and expiry metadata to shops for the control center.

begin;

alter table bike_booking.shops
  add column if not exists billing_plan text,
  add column if not exists billing_due_date date,
  add column if not exists expires_at date,
  add column if not exists billing_note text;

commit;
