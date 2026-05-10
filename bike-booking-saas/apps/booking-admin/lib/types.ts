export type WeekdayKey = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";
export type ServiceDurationUnit = "hour" | "day";
export type BookingKind = "hourly" | "daily";
export type PlatformActivityAction = "status_change" | "billing_update" | "shop_deleted";
export type BillingEventType = "renewal" | "manual_update" | "payment_marked";
export type SignupRequestStatus = "pending" | "approved" | "rejected";

export type WorkingDay = {
  enabled: boolean;
  start: string;
  end: string;
  slot_capacity: number;
  daily_limit: number;
};

export type WorkingHours = Record<WeekdayKey, WorkingDay>;

export type Shop = {
  id: string;
  slug: string;
  name: string;
  phone: string | null;
  line_id: string | null;
  facebook_url: string | null;
  working_hours: WorkingHours;
  regular_holidays: WeekdayKey[];
  subscription_status: "trial" | "active" | "suspended" | "cancelled";
  billing_plan?: string | null;
  billing_due_date?: string | null;
  expires_at?: string | null;
  billing_note?: string | null;
};

export type PlatformActivityLog = {
  id: string;
  actor_user_id: string | null;
  actor_email: string;
  action: PlatformActivityAction;
  target_shop_id: string | null;
  target_shop_slug: string;
  target_shop_name: string;
  before_status: Shop["subscription_status"] | null;
  after_status: Shop["subscription_status"] | null;
  note: string | null;
  created_at: string;
};

export type ShopBillingEvent = {
  id: string;
  shop_id: string;
  actor_user_id: string | null;
  actor_email: string;
  event_type: BillingEventType;
  billing_plan: string | null;
  billing_due_date: string | null;
  expires_at: string | null;
  note: string | null;
  created_at: string;
};

export type SignupRequest = {
  id: string;
  requested_email: string;
  requested_shop_name: string;
  requested_slug: string;
  requested_phone: string | null;
  requested_note: string | null;
  auth_user_id: string | null;
  status: SignupRequestStatus;
  reviewed_by: string | null;
  reviewed_note: string | null;
  approved_shop_id: string | null;
  created_at: string;
  reviewed_at: string | null;
  updated_at: string;
};

export type ServiceItem = {
  id: string;
  shop_id: string;
  name: string;
  duration_unit: ServiceDurationUnit;
  duration_value: number;
  duration_hours: number;
  is_active: boolean;
  sort_order: number;
};

export type ShopHoliday = {
  id: string;
  shop_id: string;
  holiday_date: string;
  reason: string | null;
};

export type BookingStatus = "confirmed" | "in_progress" | "completed" | "cancelled" | "no_show";

export type Booking = {
  id: string;
  shop_id: string;
  customer_name: string;
  customer_phone: string;
  customer_fb: string | null;
  customer_line_id: string | null;
  booking_date: string;
  booking_end_date: string | null;
  booking_kind: BookingKind;
  booking_time_start: string | null;
  booking_time_end: string | null;
  bike_model: string;
  bike_year: number | null;
  service_items: string[];
  additional_notes: string | null;
  status: BookingStatus;
  customer_showed_up: boolean | null;
  created_at: string;
};
