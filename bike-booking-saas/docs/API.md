# API Documentation

โปรเจคนี้ใช้ Supabase client และ RLS เป็นหลัก ไม่มี custom REST API ใน Phase 1

## Tables

- `shops`: ข้อมูลร้านและเวลาทำการ
- `service_items`: รายการบริการ
- `shop_holidays`: วันหยุดพิเศษ
- `bookings`: รายการจอง
- `customers`: สถิติลูกค้าและ no-show
- `shop_users`: mapping ผู้ใช้ admin กับร้าน

## Public Operations

### Read shop

```ts
supabase.from("shops").select("*").eq("id", shopId).single()
```

### Read active services

```ts
supabase
  .from("service_items")
  .select("*")
  .eq("shop_id", shopId)
  .eq("is_active", true)
  .order("sort_order")
```

### Create booking

```ts
supabase.from("bookings").insert({
  shop_id,
  customer_name,
  customer_phone,
  booking_date,
  booking_time_start,
  booking_time_end,
  bike_model,
  service_items,
  status: "confirmed"
})
```

Postgres trigger `assert_booking_rules` validates past dates, holidays, blacklist, and time overlap.

## Admin Operations

Admin reads and updates rows only when `shop_users.user_id = auth.uid()` for the target shop.

### Mark no-show

```ts
supabase.rpc("mark_booking_no_show", { target_booking_id: bookingId })
```

### Realtime

Subscribe to booking changes:

```ts
supabase.channel("bookings")
  .on("postgres_changes", { event: "*", schema: "public", table: "bookings" }, reload)
  .subscribe()
```
