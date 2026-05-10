# Supabase Live Backup - 2026-05-10 Signup Requests

## Scope
- Project: `gsbbkdppaegrttcqmjuq`
- URL: `https://gsbbkdppaegrttcqmjuq.supabase.co`
- Migration target: `supabase/migrations/20260510000009_signup_requests.sql`
- Scope guard: `bike-booking-saas` only; `Chatbot/` untouched.

## Pre-Migration Snapshot
- Supabase migration history did not include `20260510000009_signup_requests`.
- `bike_booking.signup_requests` already existed in live DB with RLS enabled and `0` rows.
- Supporting live tables existed:
  - `bike_booking.shops`: `1` row
  - `bike_booking.service_items`: `6` rows
  - `bike_booking.shop_users`: `1` row
  - `bike_booking.platform_users`: `1` row
  - `bike_booking.platform_activity_logs`: `4` rows
  - `bike_booking.shop_billing_events`: `3` rows
- `auth.users` had `2` rows.

## Existing Signup Request Objects
- Type: `bike_booking.signup_request_status`
- Table: `bike_booking.signup_requests`
- Functions:
  - `bike_booking.default_signup_working_hours()`
  - `bike_booking.provision_signup_request(uuid)`
  - `bike_booking.reject_signup_request(uuid, text)`
  - `bike_booking.sync_signup_requests_updated_at()`
- Policies:
  - `Users read own signup requests`
  - `Platform admins manage signup requests`

## Verification Plan
- Apply migration through Supabase MCP `apply_migration`.
- Confirm migration history records the requested signup migration SQL.
- Confirm table, enum, trigger, functions, policies, grants, and indexes exist.
- Run non-mutating verification queries only.

## Post-Migration Verification
- Applied through Supabase MCP on 2026-05-10.
- Supabase migration history recorded this live apply as:
  - `20260510075828` / `signup_requests`
- Verified:
  - `bike_booking.signup_requests` exists.
  - `bike_booking.signup_request_status` exists.
  - RLS is enabled on `bike_booking.signup_requests`.
  - `signup_requests` row count remains `0`.
  - Functions exist:
    - `bike_booking.default_signup_working_hours()`
    - `bike_booking.provision_signup_request(uuid)`
    - `bike_booking.reject_signup_request(uuid, text)`
    - `bike_booking.sync_signup_requests_updated_at()`
  - Indexes exist:
    - `idx_signup_requests_auth_user`
    - `idx_signup_requests_slug`
    - `idx_signup_requests_status_created_at`
    - `signup_requests_pkey`
  - Policies exist:
    - `Users read own signup requests`
    - `Platform admins manage signup requests`

## Advisor Notes
- Security advisors reported existing project warnings, including:
  - `bike_booking.public_booking_slots` as a security definer view.
  - `bike_booking.default_signup_working_hours()` with mutable search path.
  - several `SECURITY DEFINER` functions callable by `anon` / `authenticated`.
- Signup-specific advisor findings after this migration:
  - `bike_booking.provision_signup_request(uuid)` and `bike_booking.reject_signup_request(uuid, text)` are `SECURITY DEFINER` and executable through exposed RPC roles.
  - `bike_booking.sync_signup_requests_updated_at()` is a trigger helper but also appears executable through exposed RPC roles.
  - `signup_requests_approved_shop_id_fkey` and `signup_requests_reviewed_by_fkey` do not have covering indexes.
  - `Users read own signup requests` can be optimized by using `(select auth.uid())`.
- No extra live schema changes were made beyond the requested migration.
