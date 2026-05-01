export type WeekdayKey = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

export type WorkingDay = {
  enabled: boolean;
  start: string;
  end: string;
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
};

export type ServiceItem = {
  id: string;
  shop_id: string;
  name: string;
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
  booking_time_start: string;
  booking_time_end: string;
  bike_model: string;
  bike_year: number | null;
  service_items: string[];
  additional_notes: string | null;
  status: BookingStatus;
  created_at: string;
};

export type BookingSlot = Pick<
  Booking,
  "id" | "shop_id" | "booking_date" | "booking_time_start" | "booking_time_end" | "status"
>;
