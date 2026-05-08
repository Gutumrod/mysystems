# SESSION NOTES V33

Date: 2026-05-08

## What we tested
- Production customer flow on `kmorackbarcustom.craftbikelab.com`
- Hourly booking flow created successfully
- Daily booking flow created successfully for a 3-day range

## Verification
- Hourly booking succeeded through the public RPC path
- Daily booking succeeded through the public RPC path
- DB confirmed both records:
  - `444da0c2-8484-4410-a088-3ceba757fc19` -> `hourly`
  - `e73ec369-3f58-436c-88a2-5d9467079950` -> `daily`

## Daily test service
- Added a temporary daily service for KMO test coverage:
  - `ฝากรถค้าง`
- The customer page now exposes that service for daily booking tests

## UI note
- The customer UI still renders the daily service label with the old hour-style suffix in the service chip.
- Booking logic itself correctly saved the booking as `booking_kind = daily`.

## Production note
- The live customer route is healthy.
- The live admin browser surface still did not allow a full UI smoke test in this round, so admin verification remains DB-backed for now.

