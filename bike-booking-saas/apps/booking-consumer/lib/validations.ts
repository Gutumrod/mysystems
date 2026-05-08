import { z } from "zod";

export const bookingSchema = z.object({
  customer_name: z.string().min(2, "กรุณากรอกชื่ออย่างน้อย 2 ตัวอักษร"),
  customer_phone: z
    .string()
    .min(1, "กรุณากรอกเบอร์โทร")
    .transform((v) => v.replace(/\D/g, ""))
    .pipe(z.string().regex(/^0[0-9]{9}$/, "เบอร์โทรต้องเป็นเลข 10 หลัก ขึ้นต้นด้วย 0")),
  customer_fb: z.string().optional(),
  customer_line_id: z.string().optional(),
  bike_model: z.string().min(2, "กรุณาเลือกรุ่นรถ"),
  bike_year: z.coerce.number().int().min(1990, "ปีต้องไม่ต่ำกว่า 1990").max(new Date().getFullYear() + 1).optional().or(z.literal("")),
  booking_date: z.string().min(1, "กรุณาเลือกวันที่"),
  booking_end_date: z.string().optional().or(z.literal("")),
  booking_kind: z.enum(["hourly", "daily"]),
  booking_time_start: z.string().optional().or(z.literal("")),
  booking_time_end: z.string().optional().or(z.literal("")),
  service_items: z.array(z.string().uuid()).min(1, "กรุณาเลือกบริการอย่างน้อย 1 รายการ").max(10, "เลือกบริการได้สูงสุด 10 รายการ"),
  additional_notes: z.string().max(500, "หมายเหตุต้องไม่เกิน 500 ตัวอักษร").optional()
}).superRefine((values, ctx) => {
  if (values.booking_kind === "hourly") {
    if (!values.booking_time_start) {
      ctx.addIssue({ code: "custom", path: ["booking_time_start"], message: "กรุณาเลือกเวลา" });
    }
  }

  if (values.booking_kind === "daily") {
    if (!values.booking_end_date) {
      ctx.addIssue({ code: "custom", path: ["booking_end_date"], message: "กรุณาเลือกวันสิ้นสุด" });
    }
    if (values.booking_end_date && values.booking_end_date < values.booking_date) {
      ctx.addIssue({ code: "custom", path: ["booking_end_date"], message: "วันสิ้นสุดต้องไม่ก่อนวันเริ่ม" });
    }
  }
});

export type BookingFormValues = z.infer<typeof bookingSchema>;
