# 🎯 MASTER BLUEPRINT - Bike Booking SaaS

**Complete System Architecture & Implementation Guide**

---

## 📑 Table of Contents

```
1. EXECUTIVE SUMMARY
2. SYSTEM ARCHITECTURE
3. DATABASE DESIGN
4. FRONTEND ARCHITECTURE
5. BACKEND ARCHITECTURE
6. DEPLOYMENT STRATEGY
7. SECURITY & COMPLIANCE
8. BUSINESS OPERATIONS
9. SCALING ROADMAP
10. COST ANALYSIS
11. IMPLEMENTATION TIMELINE
12. RISK MITIGATION
```

---

## 1. EXECUTIVE SUMMARY

### 1.1 Product Vision

**Name:** Bike Booking SaaS  
**Tagline:** ระบบจองคิวออนไลน์สำหรับร้านมอเตอร์ไซค์ทั่วไทย  
**Target Market:** 20,000+ ร้านซ่อม/แต่งมอเตอร์ไซค์ในประเทศไทย  
**Pricing:** 500 THB/shop/month  
**Business Model:** Multi-Tenant SaaS

### 1.2 Core Value Proposition

**สำหรับร้าน:**
- ✅ ลดการจองซ้ำซ้อน
- ✅ ลดการติดต่อผ่าน LINE/Facebook
- ✅ จัดการคิวได้ง่าย
- ✅ ดูภาพรวมธุรกิจ
- ✅ ไม่ต้องจ้างคนรับโทรศัพท์

**สำหรับลูกค้า:**
- ✅ จองได้ 24/7
- ✅ เห็นเวลาว่าง real-time
- ✅ ไม่ต้องโทรจอง
- ✅ ได้รับการยืนยันทันที

### 1.3 Success Metrics

**Month 3 (Beta):**
- 5 shops, 100+ bookings, 99% uptime

**Month 6 (Launch):**
- 20 shops, 1,000+ bookings, 10K MRR, <10% churn

**Month 12 (Scale):**
- 50 shops, 5,000+ bookings, 25K MRR, profitable

**Year 2:**
- 200 shops, 20K+ bookings, 100K MRR, team of 3

---

## 2. SYSTEM ARCHITECTURE

### 2.1 High-Level Overview

```
┌─────────────────────────────────────────────────────────┐
│                    INTERNET                              │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                  CLOUDFLARE DNS                          │
│  *.bikebooking.com → Wildcard CNAME                      │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                    VERCEL EDGE                           │
│  - Global CDN (300+ locations)                           │
│  - Auto SSL                                              │
│  - Edge Functions                                        │
└─────────────────────────────────────────────────────────┘
                          │
        ┌─────────────────┴─────────────────┐
        ▼                                   ▼
┌──────────────────┐              ┌──────────────────┐
│  FRONTEND APP    │              │   ADMIN APP      │
│  Next.js 15      │              │   Next.js 15     │
│  (Booking)       │              │   (Management)   │
└──────────────────┘              └──────────────────┘
        │                                   │
        └─────────────────┬─────────────────┘
                          ▼
┌─────────────────────────────────────────────────────────┐
│                   SUPABASE                               │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐         │
│  │ PostgreSQL │  │    Auth    │  │  Realtime  │         │
│  │    (DB)    │  │  (Users)   │  │ (Webhooks) │         │
│  └────────────┘  └────────────┘  └────────────┘         │
│  ┌────────────┐  ┌────────────┐                         │
│  │  Storage   │  │ Edge Funcs │                         │
│  │  (Files)   │  │  (API)     │                         │
│  └────────────┘  └────────────┘                         │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│              EXTERNAL SERVICES                           │
│  - Email (Resend/SendGrid)                              │
│  - SMS (Twilio) [Future]                                │
│  - Payment (Omise/Stripe) [Future]                      │
└─────────────────────────────────────────────────────────┘
```

### 2.2 Data Flow

**Customer Booking Flow:**
```
1. Customer visits: joe.bikebooking.com
   ↓
2. Cloudflare DNS → Vercel Edge
   ↓
3. Next.js Middleware:
   - Extract subdomain: "joe"
   - Query Supabase: shops WHERE slug='joe'
   - Return shop data
   ↓
4. Booking Form Page:
   - Load services (RLS filtered)
   - Load holidays
   - Calculate availability
   ↓
5. Customer submits form
   ↓
6. Validation:
   - Client-side (Zod)
   - Check availability (Supabase query)
   - Check blacklist
   ↓
7. Insert booking (RLS auto-filters to correct shop)
   ↓
8. Redirect to success page
   ↓
9. Display booking summary + copy button
```

**Admin Management Flow:**
```
1. Admin visits: admin.bikebooking.com
   ↓
2. Login (Supabase Auth)
   ↓
3. Middleware checks:
   - Session valid?
   - User in shop_users table?
   - Shop subscription active?
   ↓
4. Dashboard:
   - Real-time subscription (Supabase Realtime)
   - Today's bookings
   - Stats
   ↓
5. Admin actions (CRUD):
   - All queries auto-filtered by RLS
   - Updates trigger Realtime events
```

### 2.3 Multi-Tenancy Strategy

**Approach:** Shared Database + Row-Level Security (RLS)

**Why:**
- ✅ Cost-effective (1 database for all)
- ✅ Easy maintenance
- ✅ Data isolation via RLS
- ✅ Scale to 1000+ shops

**Namespace Decision:** All Bike Booking tables, functions, triggers, and policies live in a dedicated PostgreSQL schema named `bike_booking`, not `public`.

**Why:**
- ✅ Keeps Bike Booking isolated if the same Supabase project later hosts another SaaS/app
- ✅ Prevents table/function name collisions
- ✅ Makes migrations, seed data, audits, and backups easier to reason about
- ✅ Keeps `public` clean while still using shared Supabase `auth.users`

**Application Query Pattern:**
```typescript
const db = supabase.schema("bike_booking")
const { data } = await db.from("shops").select("*")
```

**Implementation:**
```sql
CREATE SCHEMA IF NOT EXISTS bike_booking;

-- Every table has shop_id
CREATE TABLE bike_booking.bookings (
  id UUID PRIMARY KEY,
  shop_id UUID REFERENCES bike_booking.shops(id),
  ...
);

-- RLS Policy
CREATE POLICY "Users see only their shop's data"
ON bike_booking.bookings
FOR SELECT
USING (
  shop_id IN (
    SELECT shop_id FROM bike_booking.shop_users
    WHERE user_id = auth.uid()
  )
);
```

---

## 3. DATABASE DESIGN

### 3.1 Complete Schema

```sql
CREATE SCHEMA IF NOT EXISTS bike_booking;

-- ============================================
-- SHOPS & AUTHENTICATION
-- ============================================

CREATE TABLE bike_booking.shops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  line_id TEXT,
  facebook_url TEXT,
  
  -- Working hours (JSON)
  working_hours JSONB DEFAULT '{
    "mon": {"enabled": true, "start": "09:00", "end": "18:00"},
    "tue": {"enabled": true, "start": "09:00", "end": "18:00"},
    "wed": {"enabled": true, "start": "09:00", "end": "18:00"},
    "thu": {"enabled": true, "start": "09:00", "end": "18:00"},
    "fri": {"enabled": true, "start": "09:00", "end": "18:00"},
    "sat": {"enabled": true, "start": "09:00", "end": "18:00"},
    "sun": {"enabled": false}
  }'::jsonb,
  
  -- Regular closed days
  regular_holidays TEXT[] DEFAULT ARRAY['sun'],
  
  -- Subscription
  subscription_status TEXT DEFAULT 'trial' 
    CHECK (subscription_status IN ('trial', 'active', 'suspended', 'cancelled')),
  subscription_starts_at TIMESTAMPTZ,
  subscription_expires_at TIMESTAMPTZ,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE bike_booking.shop_users (
  shop_id UUID REFERENCES bike_booking.shops(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'staff' CHECK (role IN ('owner', 'staff')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (shop_id, user_id)
);

-- ============================================
-- SERVICES
-- ============================================

CREATE TABLE bike_booking.service_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID REFERENCES bike_booking.shops(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  duration_hours INTEGER NOT NULL CHECK (duration_hours > 0),
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE bike_booking.shop_holidays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID REFERENCES bike_booking.shops(id) ON DELETE CASCADE,
  holiday_date DATE NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (shop_id, holiday_date)
);

-- ============================================
-- BOOKINGS
-- ============================================

CREATE TABLE bike_booking.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID REFERENCES bike_booking.shops(id) ON DELETE CASCADE,
  
  -- Customer info
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_fb TEXT,
  customer_line_id TEXT,
  
  -- Booking details
  booking_date DATE NOT NULL,
  booking_time_start TIME NOT NULL,
  booking_time_end TIME NOT NULL,
  
  -- Bike info
  bike_model TEXT NOT NULL,
  bike_year INTEGER,
  
  -- Services (array of UUIDs)
  service_items UUID[] NOT NULL,
  
  -- Additional notes
  additional_notes TEXT,
  
  -- Status
  status TEXT DEFAULT 'confirmed' 
    CHECK (status IN ('confirmed', 'in_progress', 'completed', 'cancelled', 'no_show')),
  
  -- Metadata
  customer_showed_up BOOLEAN DEFAULT NULL,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE bike_booking.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID REFERENCES bike_booking.shops(id) ON DELETE CASCADE,
  phone TEXT NOT NULL,
  name TEXT NOT NULL,
  
  -- Statistics
  total_bookings INTEGER DEFAULT 0,
  no_show_count INTEGER DEFAULT 0,
  
  -- Blacklist
  is_blacklisted BOOLEAN DEFAULT false,
  blacklist_reason TEXT,
  blacklisted_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE (shop_id, phone)
);

-- ============================================
-- SHOP APPLICATIONS (for signup)
-- ============================================

CREATE TABLE bike_booking.shop_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_name TEXT NOT NULL,
  owner_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  line_id TEXT,
  facebook_url TEXT,
  
  -- Status
  status TEXT DEFAULT 'pending' 
    CHECK (status IN ('pending', 'approved', 'rejected')),
  notes TEXT,
  
  -- Review
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES auth.users(id),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_shops_slug ON bike_booking.shops(slug);
CREATE INDEX idx_shops_subscription ON bike_booking.shops(subscription_status, subscription_expires_at);

CREATE INDEX idx_service_items_shop ON bike_booking.service_items(shop_id, is_active);
CREATE INDEX idx_service_items_sort ON bike_booking.service_items(shop_id, sort_order);

CREATE INDEX idx_bookings_shop_date ON bike_booking.bookings(shop_id, booking_date);
CREATE INDEX idx_bookings_status ON bike_booking.bookings(shop_id, status);
CREATE INDEX idx_bookings_customer ON bike_booking.bookings(shop_id, customer_phone);

CREATE INDEX idx_customers_phone ON bike_booking.customers(shop_id, phone);
CREATE INDEX idx_customers_blacklist ON bike_booking.customers(shop_id, is_blacklisted);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_holidays ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- Shops: Public read for active shops
CREATE POLICY "Public can view active shops"
ON shops FOR SELECT
USING (subscription_status IN ('trial', 'active'));

-- Service Items: Public read for active items
CREATE POLICY "Public can view active services"
ON service_items FOR SELECT
USING (is_active = true);

-- Shop Holidays: Public read
CREATE POLICY "Public can view holidays"
ON shop_holidays FOR SELECT
USING (true);

-- Bookings: Public can insert
CREATE POLICY "Anyone can create bookings"
ON bookings FOR INSERT
WITH CHECK (true);

-- Bookings: Shop users can view their bookings
CREATE POLICY "Shop users can view their bookings"
ON bookings FOR SELECT
USING (
  shop_id IN (
    SELECT shop_id FROM shop_users
    WHERE user_id = auth.uid()
  )
);

-- Bookings: Shop users can update their bookings
CREATE POLICY "Shop users can update their bookings"
ON bookings FOR UPDATE
USING (
  shop_id IN (
    SELECT shop_id FROM shop_users
    WHERE user_id = auth.uid()
  )
);

-- Similar policies for other tables...

-- ============================================
-- TRIGGERS
-- ============================================

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER shops_updated_at
  BEFORE UPDATE ON shops
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Auto-blacklist on 3 no-shows
CREATE OR REPLACE FUNCTION check_no_show_limit()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.no_show_count >= 3 AND NOT NEW.is_blacklisted THEN
    NEW.is_blacklisted = true;
    NEW.blacklist_reason = 'No-show 3 ครั้ง';
    NEW.blacklisted_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER customers_no_show_check
  BEFORE UPDATE ON customers
  FOR EACH ROW
  EXECUTE FUNCTION check_no_show_limit();
```

### 3.2 Data Models (TypeScript)

```typescript
// lib/types.ts

export interface Shop {
  id: string
  slug: string
  name: string
  phone: string | null
  line_id: string | null
  facebook_url: string | null
  working_hours: WorkingHours
  regular_holidays: string[]
  subscription_status: 'trial' | 'active' | 'suspended' | 'cancelled'
  subscription_starts_at: string | null
  subscription_expires_at: string | null
  created_at: string
  updated_at: string
}

export interface WorkingHours {
  mon: DaySchedule
  tue: DaySchedule
  wed: DaySchedule
  thu: DaySchedule
  fri: DaySchedule
  sat: DaySchedule
  sun: DaySchedule
}

export interface DaySchedule {
  enabled: boolean
  start?: string  // "09:00"
  end?: string    // "18:00"
}

export interface ServiceItem {
  id: string
  shop_id: string
  name: string
  duration_hours: number
  is_active: boolean
  sort_order: number
  created_at: string
}

export interface ShopHoliday {
  id: string
  shop_id: string
  holiday_date: string  // YYYY-MM-DD
  reason: string | null
  created_at: string
}

export interface Booking {
  id: string
  shop_id: string
  customer_name: string
  customer_phone: string
  customer_fb: string | null
  customer_line_id: string | null
  booking_date: string  // YYYY-MM-DD
  booking_time_start: string  // HH:MM
  booking_time_end: string    // HH:MM
  bike_model: string
  bike_year: number | null
  service_items: string[]  // UUIDs
  additional_notes: string | null
  status: 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show'
  customer_showed_up: boolean | null
  completed_at: string | null
  created_at: string
  updated_at: string
}

export interface Customer {
  id: string
  shop_id: string
  phone: string
  name: string
  total_bookings: number
  no_show_count: number
  is_blacklisted: boolean
  blacklist_reason: string | null
  blacklisted_at: string | null
  created_at: string
  updated_at: string
}
```

---

## 4. FRONTEND ARCHITECTURE

### 4.1 Project Structure

```
bike-booking-frontend/
├── app/
│   ├── layout.tsx                 # Root layout
│   ├── page.tsx                   # Booking form
│   ├── success/
│   │   └── page.tsx              # Success page
│   ├── suspended/
│   │   └── page.tsx              # Suspended shop
│   └── globals.css
│
├── components/
│   ├── booking/
│   │   ├── BookingForm.tsx
│   │   ├── CustomerInfoSection.tsx
│   │   ├── BikeInfoSection.tsx
│   │   ├── ServiceSelector.tsx
│   │   ├── DateTimePicker.tsx
│   │   ├── BikeModelAutocomplete.tsx
│   │   ├── CopyBookingButton.tsx
│   │   └── BookingSummary.tsx
│   │
│   └── ui/                        # shadcn/ui components
│       ├── button.tsx
│       ├── input.tsx
│       ├── label.tsx
│       ├── textarea.tsx
│       ├── checkbox.tsx
│       ├── calendar.tsx
│       └── ...
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts             # Client-side Supabase
│   │   └── server.ts             # Server-side Supabase
│   │
│   ├── types.ts                  # TypeScript interfaces
│   ├── validations.ts            # Zod schemas
│   ├── utils.ts                  # Utility functions
│   └── bike-models.ts            # Popular bike models
│
├── middleware.ts                  # Subdomain extraction
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

### 4.2 Key Components

**BookingForm.tsx:**
```typescript
'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { bookingSchema } from '@/lib/validations'
import type { Shop, ServiceItem } from '@/lib/types'

interface Props {
  shop: Shop
  services: ServiceItem[]
  holidays: string[]
}

export function BookingForm({ shop, services, holidays }: Props) {
  const [selectedServices, setSelectedServices] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const form = useForm({
    resolver: zodResolver(bookingSchema)
  })
  
  const onSubmit = async (data) => {
    // 1. Validate availability
    // 2. Check blacklist
    // 3. Insert booking
    // 4. Redirect to success
  }
  
  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      {/* Form sections */}
    </form>
  )
}
```

**Middleware.ts:**
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || ''
  const subdomain = hostname.split('.')[0]
  
  // Extract shop from subdomain
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  
  const { data: shop } = await supabase
    .from('shops')
    .select('id, slug, subscription_status')
    .eq('slug', subdomain)
    .single()
  
  if (!shop) {
    return NextResponse.rewrite(new URL('/404', request.url))
  }
  
  if (shop.subscription_status === 'suspended') {
    return NextResponse.rewrite(new URL('/suspended', request.url))
  }
  
  const response = NextResponse.next()
  response.headers.set('x-shop-id', shop.id)
  return response
}
```

---

## 5. BACKEND ARCHITECTURE

### 5.1 Admin Panel Structure

```
bike-booking-admin/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx
│   │   └── layout.tsx
│   │
│   ├── (dashboard)/
│   │   ├── layout.tsx            # Sidebar layout
│   │   │
│   │   ├── dashboard/
│   │   │   └── page.tsx          # Today's queue
│   │   │
│   │   ├── calendar/
│   │   │   └── page.tsx          # Calendar view
│   │   │
│   │   ├── bookings/
│   │   │   ├── page.tsx          # All bookings
│   │   │   └── [id]/
│   │   │       └── page.tsx      # Booking detail
│   │   │
│   │   ├── services/
│   │   │   └── page.tsx          # Services CRUD
│   │   │
│   │   └── settings/
│   │       ├── shop/
│   │       │   └── page.tsx      # Shop info
│   │       └── schedule/
│   │           └── page.tsx      # Working hours + holidays
│   │
│   └── layout.tsx
│
├── components/
│   ├── layout/
│   │   ├── Sidebar.tsx
│   │   └── Header.tsx
│   │
│   ├── dashboard/
│   │   ├── TodaysQueue.tsx
│   │   ├── StatsCards.tsx
│   │   └── BookingCard.tsx
│   │
│   ├── calendar/
│   │   └── CalendarView.tsx
│   │
│   ├── bookings/
│   │   ├── BookingsTable.tsx
│   │   ├── BookingFilters.tsx
│   │   └── BookingModal.tsx
│   │
│   ├── services/
│   │   ├── ServicesList.tsx
│   │   ├── AddServiceModal.tsx
│   │   └── DraggableService.tsx
│   │
│   └── settings/
│       ├── WorkingHoursForm.tsx
│       ├── HolidaysList.tsx
│       └── ShopInfoForm.tsx
│
├── lib/
│   ├── supabase/
│   ├── types.ts
│   └── utils.ts
│
├── middleware.ts                  # Auth check
└── package.json
```

### 5.2 API Routes (Edge Functions)

```
supabase/functions/
├── check-availability/
│   └── index.ts
│
├── create-booking/
│   └── index.ts
│
├── send-booking-confirmation/
│   └── index.ts
│
└── process-payment/              # Future
    └── index.ts
```

**Example: check-availability/index.ts**

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from '@supabase/supabase-js'

serve(async (req) => {
  const { shop_id, date, start_time, end_time } = await req.json()
  
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )
  
  // Check for conflicts
  const { data: conflicts } = await supabase
    .from('bookings')
    .select('id')
    .eq('shop_id', shop_id)
    .eq('booking_date', date)
    .not('status', 'in', '["cancelled","no_show"]')
    .or(`and(booking_time_start.lt.${end_time},booking_time_end.gt.${start_time})`)
  
  return new Response(
    JSON.stringify({
      available: !conflicts || conflicts.length === 0
    }),
    { headers: { 'Content-Type': 'application/json' } }
  )
})
```

---

## 6. DEPLOYMENT STRATEGY

### 6.1 Infrastructure Overview

```
┌─────────────────────────────────────────────┐
│              DOMAIN LAYER                   │
│  bikebooking.com (Cloudflare DNS)          │
│  - *.bikebooking.com → Vercel              │
│  - Wildcard SSL (Auto)                     │
└─────────────────────────────────────────────┘
                    ▼
┌─────────────────────────────────────────────┐
│           APPLICATION LAYER                 │
│  Vercel Pro ($20/mo)                       │
│  ├── Frontend Project (1)                  │
│  │   - Handles all *.bikebooking.com      │
│  │   - Edge Functions                      │
│  │   - 100 GB-Hrs Execution                │
│  │                                         │
│  └── Admin Project (1)                     │
│      - admin.bikebooking.com               │
│      - Protected routes                    │
└─────────────────────────────────────────────┘
                    ▼
┌─────────────────────────────────────────────┐
│            DATABASE LAYER                   │
│  Supabase Pro ($25/mo)                     │
│  ├── PostgreSQL (8 GB)                     │
│  ├── Auth (50K MAU)                        │
│  ├── Realtime (Unlimited)                  │
│  ├── Storage (100 GB)                      │
│  └── Edge Functions (2M invocations)       │
└─────────────────────────────────────────────┘
```

### 6.2 Deployment Process

**Initial Setup (Once):**

```bash
# 1. Create Supabase project
# - Go to supabase.com
# - Create project: "bike-booking-prod"
# - Save credentials

# 2. Run migrations
supabase db push

# 3. Deploy Frontend
cd bike-booking-frontend
vercel --prod
# Add environment variables in Vercel dashboard

# 4. Deploy Admin
cd bike-booking-admin
vercel --prod
# Add environment variables

# 5. Configure DNS
# Cloudflare:
# - CNAME * → cname.vercel-dns.com
# - CNAME admin → cname.vercel-dns.com
# - TXT _vercel → [verification code]

# 6. Add domains in Vercel
# - *.bikebooking.com
# - admin.bikebooking.com
```

**Per-Shop Deployment (Automated):**

```bash
# Script handles everything
./scripts/create-shop.sh joe-garage "Joe Garage" "089-xxx-xxxx"

# What it does:
# 1. Insert to shops table
# 2. Create admin user in Supabase Auth
# 3. Link user to shop
# 4. Send welcome email
# 5. That's it! (DNS already wildcard)
```

### 6.3 Environment Variables

**Frontend (.env.local):**
```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
NEXT_PUBLIC_APP_URL=https://bikebooking.com
```

**Admin (.env.local):**
```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...
NEXT_PUBLIC_APP_URL=https://admin.bikebooking.com
```

**Supabase Edge Functions (.env):**
```bash
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...
RESEND_API_KEY=re_xxx...
```

---

## 7. SECURITY & COMPLIANCE

### 7.1 Security Layers

**1. Network Security:**
- ✅ Cloudflare DDoS protection
- ✅ Rate limiting (Vercel Edge)
- ✅ Auto SSL/TLS (Let's Encrypt)
- ✅ HTTPS only (redirect HTTP)

**2. Application Security:**
- ✅ Input validation (client + server)
- ✅ SQL injection prevention (Supabase parameterized queries)
- ✅ XSS prevention (React auto-escaping)
- ✅ CSRF protection (SameSite cookies)

**3. Authentication:**
- ✅ Supabase Auth (JWT)
- ✅ Row Level Security (RLS)
- ✅ Session management
- ✅ Password hashing (bcrypt)

**4. Data Privacy:**
- ✅ RLS isolates shop data
- ✅ No customer data sharing between shops
- ✅ Admin audit logs
- ✅ GDPR-ready (data export/delete)

### 7.2 RLS Policies Summary

```sql
-- Public Access (Frontend)
✅ Read shops (active only)
✅ Read services (active only)
✅ Read holidays
✅ Insert bookings

-- Authenticated Access (Admin)
✅ Read own shop data
✅ Update own shop data
✅ Delete own shop data
❌ Access other shops' data

-- Service Role (Backend only)
✅ Full access (for migrations, scripts)
```

### 7.3 Backup Strategy

**Automated:**
- ✅ Supabase daily backups (7 days retention)
- ✅ Point-in-time recovery (PITR)

**Manual:**
```bash
# Weekly backup script
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql
# Upload to S3/Google Cloud Storage
```

---

## 8. BUSINESS OPERATIONS

### 8.1 Onboarding Flow (MVP)

**1. Lead Generation:**
```
- Facebook Ads → Landing Page
- SEO (Google: "ระบบจองคิวร้านมอเตอร์ไซค์")
- Facebook Groups (มอเตอร์ไซค์ Thailand)
- LINE OA broadcast
- Word of mouth
```

**2. Qualification:**
```
ร้านติดต่อเข้ามา (LINE/Facebook)
  ↓
คุยเก็บข้อมูล (5 นาที):
  - ชื่อร้าน
  - จำนวนช่าง
  - คิวต่อวัน
  - ปัญหาปัจจุบัน
  ↓
ตัดสินใจ: เหมาะสมกับ product ไหม?
```

**3. Onboarding (15 นาที):**
```
รัน script สร้างร้าน (1 นาที)
  ↓
ส่ง welcome email + คู่มือ
  ↓
นัดโทร/LINE call สอนใช้งาน (10 นาที)
  ↓
ช่วยตั้งค่า:
  - เพิ่มบริการ 3-5 รายการ
  - ตั้งเวลาทำการ
  - ทดสอบจองครั้งแรก
  ↓
ร้านพร้อมใช้งาน!
```

**4. Trial → Paid:**
```
Day 7: ส่ง check-in message
Day 14: ถามปัญหา feedback
Day 21: แจ้งเตือน trial เหลือ 9 วัน
Day 27: ขอชำระเงิน (PromptPay QR)
Day 30: ถ้าไม่จ่าย → suspend
```

### 8.2 Pricing Strategy

**Base Plan:** 500 THB/month

**Includes:**
- ✅ Unlimited bookings
- ✅ Unlimited services
- ✅ Dashboard & calendar
- ✅ Real-time updates
- ✅ LINE support

**Future Tiers:**

**Starter (300 THB/mo):**
- Max 50 bookings/month
- 1 admin user

**Pro (500 THB/mo):** ← Current
- Unlimited bookings
- 3 admin users
- Priority support

**Enterprise (1,500 THB/mo):**
- Multi-location (3 branches)
- Custom domain
- API access
- Dedicated support

### 8.3 Payment Collection

**MVP (Manual):**
```
1. ส่ง invoice ทาง LINE/Email
2. ให้ร้านโอนผ่าน PromptPay
3. ส่งสลิปมายืนยัน
4. เช็คสลิป → Activate subscription
```

**Future (Automated):**
```
1. Integrate Omise/Stripe
2. Credit card auto-charge
3. PromptPay QR code
4. Invoice email auto-send
```

### 8.4 Customer Support

**Channels:**
- 📱 LINE OA (primary)
- 📧 Email: support@bikebooking.com
- 📱 Phone: 089-xxx-xxxx (business hours)

**SLA:**
- Response time: < 2 hours (business hours)
- Resolution time: < 24 hours
- Uptime: 99.9%

**Support Tiers:**
- Tier 1: คู่มือ + FAQ
- Tier 2: LINE chat
- Tier 3: โทรศัพท์

---

## 9. SCALING ROADMAP

### 9.1 Growth Phases

**Phase 1: MVP (Month 0-3)**
```
Goal: Validate product-market fit
- 5 beta shops
- 100+ bookings
- 99% uptime
- Collect feedback

Tech:
- Vercel Free tier
- Supabase Free tier
- Manual onboarding
```

**Phase 2: Launch (Month 3-6)**
```
Goal: Acquire first customers
- 20 paying shops
- 10K MRR
- <10% churn
- Referral program

Tech:
- Upgrade to Vercel Pro
- Upgrade to Supabase Pro
- Semi-automated onboarding
```

**Phase 3: Growth (Month 6-12)**
```
Goal: Scale to profitability
- 50 shops
- 25K MRR
- Break-even
- Hire support person

Tech:
- Fully automated onboarding
- Payment integration
- Email notifications
```

**Phase 4: Scale (Year 2)**
```
Goal: Market leader
- 200 shops
- 100K MRR
- Team of 3
- Mobile app

Tech:
- Mobile app (React Native)
- Advanced analytics
- API for integrations
```

### 9.2 Technical Scaling

**Database Optimization:**
```
10 shops → No optimization needed
50 shops → Add database indexes
100 shops → Query optimization
500 shops → Read replicas
1000+ shops → Consider sharding
```

**Hosting Optimization:**
```
20 shops → Vercel Pro single region
100 shops → Multi-region CDN
500 shops → Dedicated database
1000+ shops → Kubernetes cluster
```

### 9.3 Feature Roadmap

**V1.0 (Current):** ✅
- Booking system
- Admin panel
- Multi-tenant
- Copy booking button

**V1.1 (Month 3):**
- Email notifications
- SMS reminders (opt-in)
- Export bookings CSV
- Customer analytics

**V1.2 (Month 6):**
- LINE notifications (API)
- Facebook Messenger integration
- Mobile-optimized admin
- Inventory tracking (basic)

**V2.0 (Month 12):**
- Mobile app (iOS/Android)
- Payment integration
- Loyalty program
- Review system
- Multi-location support

**V3.0 (Year 2):**
- AI-powered scheduling
- Demand forecasting
- Dynamic pricing
- Marketplace (parts)

---

## 10. COST ANALYSIS

### 10.1 Monthly Operating Costs

**Infrastructure (0-20 shops):**
```
Domain:              42 THB/mo
Vercel Free:          0 THB/mo
Supabase Free:        0 THB/mo
Email (Resend):       0 THB/mo (1K emails/mo)
───────────────────────────────
Total:               42 THB/mo
```

**Infrastructure (20-100 shops):**
```
Domain:              42 THB/mo
Vercel Pro:         700 THB/mo ($20)
Supabase Pro:       900 THB/mo ($25)
Email:              350 THB/mo ($10)
SMS (optional):     700 THB/mo ($20)
───────────────────────────────
Total:            2,692 THB/mo
```

**Infrastructure (100-500 shops):**
```
Domain:              42 THB/mo
Vercel Team:      3,500 THB/mo ($100)
Supabase Team:    8,750 THB/mo ($250)
Email:            1,750 THB/mo ($50)
SMS:              3,500 THB/mo ($100)
Monitoring:         700 THB/mo ($20)
───────────────────────────────
Total:           18,242 THB/mo
```

### 10.2 Revenue Projections

**Month 3 (Beta):**
```
Shops: 5 (free trial)
Revenue: 0 THB
Costs: 42 THB
Net: -42 THB
```

**Month 6 (Launch):**
```
Shops: 20 paying
Revenue: 10,000 THB
Costs: 2,692 THB
Net: 7,308 THB ✅
```

**Month 12 (Growth):**
```
Shops: 50 paying
Revenue: 25,000 THB
Costs: 8,000 THB (+ support person)
Net: 17,000 THB ✅
```

**Year 2 (Scale):**
```
Shops: 200 paying
Revenue: 100,000 THB
Costs: 40,000 THB (infrastructure + team)
Net: 60,000 THB ✅
```

### 10.3 Break-Even Analysis

**Fixed Costs:** ~20,000 THB/month (at scale)
**Variable Costs:** ~50 THB/shop/month

```
Break-even = Fixed / (Price - Variable)
          = 20,000 / (500 - 50)
          = 44.4 shops

Round up: 45 shops to break even
```

**Target:** 50 shops by Month 12 ✅

---

## 11. IMPLEMENTATION TIMELINE

### 11.1 Development Phases (18 days)

**Week 1 (Days 1-5):**
```
Day 1: Setup
  - Create Supabase project
  - Create GitHub repos
  - Setup local environment

Day 2-3: Database + Frontend Foundation
  - Write SQL migrations
  - Setup Next.js projects
  - Install dependencies
  - Create basic layouts

Day 4-5: Booking Form
  - Build form components
  - Implement validation
  - Integrate Supabase
```

**Week 2 (Days 6-10):**
```
Day 6-7: Booking Form (continued)
  - Date/time picker
  - Availability checking
  - Success page

Day 8-10: Admin Dashboard
  - Sidebar navigation
  - Today's queue
  - Stats cards
  - Real-time updates
```

**Week 3 (Days 11-15):**
```
Day 11-12: Admin Features
  - Calendar view
  - Bookings table
  - Filters & search

Day 13-14: Services + Settings
  - Services CRUD
  - Drag & drop reorder
  - Working hours
  - Holidays management

Day 15: Multi-tenant
  - Middleware
  - RLS testing
  - Subdomain routing
```

**Week 4 (Days 16-18):**
```
Day 16: Deployment
  - Deploy to Vercel
  - Configure DNS
  - SSL setup

Day 17: Testing
  - E2E testing
  - Mobile testing
  - Cross-browser testing

Day 18: Documentation
  - README
  - USER_GUIDE (Thai)
  - Deployment scripts
```

### 11.2 Post-Launch Timeline

**Month 1: Beta Testing**
```
Week 1: Recruit 5 beta shops
Week 2: Onboard + train
Week 3: Monitor usage + collect feedback
Week 4: Fix bugs + iterate
```

**Month 2: Marketing Prep**
```
Week 1: Create landing page
Week 2: Setup Facebook Ads
Week 3: Create demo videos
Week 4: Prepare sales materials
```

**Month 3: Launch**
```
Week 1: Public launch
Week 2: First 10 paying customers
Week 3: Optimize onboarding
Week 4: Referral program
```

**Month 4-6: Growth**
```
Month 4: 20 shops
Month 5: 35 shops
Month 6: 50 shops
```

---

## 12. RISK MITIGATION

### 12.1 Technical Risks

**Risk: Database Downtime**
```
Probability: Low
Impact: High

Mitigation:
- Use Supabase (99.9% SLA)
- Enable PITR backups
- Monitor uptime (UptimeRobot)
- Have rollback plan
```

**Risk: Subdomain Conflicts**
```
Probability: Medium
Impact: Medium

Mitigation:
- Reserve common words (www, admin, api, etc.)
- Validate slug on creation
- Show error if slug taken
```

**Risk: RLS Bypass**
```
Probability: Low
Impact: Critical

Mitigation:
- Test RLS thoroughly
- Audit logs
- Penetration testing
- Bug bounty program (future)
```

### 12.2 Business Risks

**Risk: Low Adoption**
```
Probability: Medium
Impact: High

Mitigation:
- Free trial (30 days)
- Referral incentives
- Case studies
- Money-back guarantee
```

**Risk: High Churn**
```
Probability: Medium
Impact: High

Mitigation:
- Excellent onboarding
- Regular check-ins
- Feature requests
- Loyalty discounts
```

**Risk: Competition**
```
Probability: High
Impact: Medium

Mitigation:
- Focus on motorcycle niche
- Thai language & support
- Fast iteration
- Community building
```

### 12.3 Operational Risks

**Risk: Support Overload**
```
Probability: Medium
Impact: Medium

Mitigation:
- Comprehensive FAQ
- Video tutorials
- Self-service docs
- Hire support (at 50 shops)
```

**Risk: Payment Collection**
```
Probability: Medium
Impact: Medium

Mitigation:
- Start with prepaid
- Auto-suspend on non-payment
- Payment reminders (Day 21, 27, 30)
- Automate with Omise (Month 6)
```

---

## 13. SUCCESS METRICS & KPIs

### 13.1 Product Metrics

**Activation:**
- Time to first booking (Target: < 24 hours)
- % shops with >5 bookings in Week 1 (Target: >80%)

**Engagement:**
- Bookings per shop per month (Target: >20)
- Admin logins per week (Target: >3)
- Booking completion rate (Target: >85%)

**Retention:**
- Monthly churn rate (Target: <10%)
- 90-day retention (Target: >70%)

**Growth:**
- Month-over-month growth (Target: >20%)
- Referral rate (Target: >15%)

### 13.2 Business Metrics

**Revenue:**
- MRR (Monthly Recurring Revenue)
- ARR (Annual Recurring Revenue)
- ARPU (Average Revenue Per User)

**Costs:**
- CAC (Customer Acquisition Cost) - Target: <1,000 THB
- LTV (Lifetime Value) - Target: >12,000 THB
- LTV:CAC ratio - Target: >12:1

**Unit Economics:**
```
LTV = ARPU × Average Customer Lifespan
    = 500 × 24 months
    = 12,000 THB

CAC = Marketing Spend / New Customers
    = Target: <1,000 THB

Profit per customer = LTV - CAC - Variable Costs
                    = 12,000 - 1,000 - (50×24)
                    = 9,800 THB ✅
```

### 13.3 Technical Metrics

**Performance:**
- Page load time (Target: <2s)
- API response time (Target: <200ms)
- Database query time (Target: <100ms)

**Reliability:**
- Uptime (Target: 99.9%)
- Error rate (Target: <0.1%)
- Failed booking rate (Target: <1%)

**Security:**
- Security vulnerabilities (Target: 0 critical)
- RLS policy violations (Target: 0)
- Failed login attempts (Monitor)

---

## 14. APPENDIX

### 14.1 Tech Stack Summary

**Frontend:**
- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS
- shadcn/ui
- react-hook-form + Zod
- react-big-calendar
- @hello-pangea/dnd

**Backend:**
- Supabase (PostgreSQL + Auth + Realtime + Storage)
- Supabase Edge Functions (Deno)

**Deployment:**
- Vercel (Edge Functions + CDN)
- Cloudflare (DNS + DDoS)

**Tools:**
- GitHub (Version control)
- Supabase Studio (Database management)
- Vercel Dashboard (Deployment)
- Resend/SendGrid (Email)

### 14.2 Key Files Reference

```
📁 Project Structure:
├── bike-booking-frontend/          # Customer-facing
├── bike-booking-admin/             # Admin panel
├── supabase/
│   ├── migrations/                # Database schema
│   └── functions/                 # Edge functions
├── scripts/
│   └── create-shop.sh             # Shop provisioning
└── docs/
    ├── PRODUCT.md
    ├── TECH_STACK.md
    ├── DEVELOPMENT.md
    ├── README.md
    └── MASTER_BLUEPRINT.md        # This file
```

### 14.3 Contact & Resources

**Project Lead:** [Your Name]  
**Email:** [Your Email]  
**LINE:** [Your LINE ID]  

**Important URLs:**
- Production: https://bikebooking.com
- Admin: https://admin.bikebooking.com
- Docs: https://docs.bikebooking.com
- Status: https://status.bikebooking.com

**External Links:**
- Supabase Docs: https://supabase.com/docs
- Next.js Docs: https://nextjs.org/docs
- Vercel Docs: https://vercel.com/docs
- Tailwind Docs: https://tailwindcss.com/docs

---

## 🎯 FINAL CHECKLIST

```
✅ Database schema designed
✅ Frontend architecture planned
✅ Admin panel architecture planned
✅ Multi-tenant strategy defined
✅ Deployment process documented
✅ Security measures outlined
✅ Business operations planned
✅ Scaling roadmap created
✅ Cost analysis completed
✅ Timeline established
✅ Risks identified
✅ KPIs defined

🚀 READY TO BUILD!
```

---

**Document Version:** 1.0  
**Last Updated:** May 1, 2025  
**Status:** Ready for Implementation

---

**นี่คือ Master Blueprint ฉบับสมบูรณ์ครับ!** 
