-- Allow authenticated platform admins to delete shops through the control center.
-- RLS already gates the row access; this migration only fixes the missing table-level DELETE grant.

grant delete on bike_booking.shops to authenticated;
