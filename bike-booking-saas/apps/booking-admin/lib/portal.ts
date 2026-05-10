export type PortalMode = "shop" | "control";

export function getPortalModeFromHost(host: string | null): PortalMode {
  const normalizedHost = host?.split(":")[0].toLowerCase() ?? "";

  if (normalizedHost === "control.craftbikelab.com" || normalizedHost.startsWith("control.")) {
    return "control";
  }

  return "shop";
}

export function getPortalLoginCopy(mode: PortalMode) {
  if (mode === "control") {
    return {
      badge: "เข้าสู่ระบบเจ้าของระบบ",
      title: "CraftBike Control Center",
      description: "ใช้บัญชี Supabase Auth ที่ผูกกับ platform_users เพื่อคุมทุกร้านจาก control.craftbikelab.com",
      button: "เข้าสู่ระบบ Control Center",
      signupHint: "ถ้ายังไม่มีร้านในระบบ ให้สมัครร้านใหม่ก่อน",
      successPath: "/platform"
    };
  }

  return {
      badge: "เข้าสู่ระบบร้าน",
      title: "เข้าสู่ระบบร้าน",
      description: "ใช้บัญชี Supabase Auth ที่ผูกกับร้านในตาราง shop_users",
      button: "เข้าสู่ระบบร้าน",
      signupHint: "ร้านใหม่ต้องสมัครผ่าน control.craftbikelab.com/signup",
      successPath: "/"
    };
}

export function getPortalSignupCopy(mode: PortalMode) {
  if (mode === "control") {
    return {
      badge: "สมัครร้านใหม่",
      title: "สมัครร้านเข้าระบบ",
      description: "กรอกอีเมล ตั้งรหัสผ่าน และรออนุมัติจากเจ้าของระบบ จากนั้นจะได้ลิงก์ร้าน 2 อันอัตโนมัติ",
      button: "ส่งคำขอสมัครร้าน",
      successPath: "/platform"
    };
  }

  return {
    badge: "สมัครร้านใหม่",
    title: "สมัครร้านต้องทำที่ Control",
    description: "การสมัครร้านใหม่ควรเปิดผ่าน control.craftbikelab.com/signup เพื่อให้เจ้าของระบบอนุมัติและสร้างร้านได้ถูกตัว",
    button: "ไปที่ Control Signup",
    successPath: "/signup"
  };
}
