#!/usr/bin/env bash
set -euo pipefail

if [ "$#" -lt 3 ]; then
  echo "Usage: ./scripts/create-shop.sh <slug> <name> <phone>"
  exit 1
fi

SLUG="$1"
NAME="$2"
PHONE="$3"

cat <<SQL
insert into bike_booking.shops (slug, name, phone, subscription_status)
values ('$SLUG', '$NAME', '$PHONE', 'trial')
returning id, slug, name;

-- After creating the auth user, connect owner:
-- insert into bike_booking.shop_users (shop_id, user_id, role)
-- values ('<SHOP_ID>', '<AUTH_USER_ID>', 'owner');
SQL
