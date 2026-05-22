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
      successPath: "/platform"
    };
  }

  return {
    badge: "เข้าสู่ระบบร้าน",
    title: "เข้าสู่ระบบร้าน",
    description: "ใช้บัญชี Supabase Auth ที่ผูกกับร้านในตาราง shop_users",
    button: "เข้าสู่ระบบร้าน",
    successPath: "/"
  };
}
