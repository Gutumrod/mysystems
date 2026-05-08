# SESSION NOTES V31

Date: 2026-05-07

## What changed
- Added mixed booking support for `hourly` and `daily` bookings.
- Added service-level `duration_unit` (`hour` / `day`) and `duration_value`.
- Added booking-level `booking_kind` and `booking_end_date`.
- Updated customer booking form and success page to handle daily booking ranges.
- Updated admin dashboard, calendar, bookings table, and today board to display and count daily bookings correctly.
- Updated service CRUD to let the shop choose hour/day duration units.
- Added daily-capacity support in the booking rules migration.

## Verification
- `npm --workspace apps/booking-consumer run lint` ✅
- `npm --workspace apps/booking-admin run lint` ✅
- `npm --workspace apps/booking-consumer run build` ✅
- `npm --workspace apps/booking-admin run build` ✅

## Backup
- Backed up the affected files before editing under:
  `.backups/2026-05-07_daily_booking_support`

## Important notes
- Mixed hourly + daily service selection is blocked in one booking.
- Daily bookings use `booking_end_date` and do not use time slots.
- Hourly bookings still use slot-based time selection and slot capacity.
- The new migration must be applied to the live Supabase project before production can use the feature.

## Remaining watchouts
- If a live booking update fails after this migration, re-check the `assert_booking_rules()` trigger guard for status transitions.
- After applying the migration, re-test one hourly booking and one daily booking end-to-end on KMO.
