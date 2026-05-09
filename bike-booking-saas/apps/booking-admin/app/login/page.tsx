import { headers } from "next/headers";
import { PortalLoginForm } from "@/components/auth/PortalLoginForm";
import { getPortalModeFromHost } from "@/lib/portal";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const headersList = await headers();
  const mode = getPortalModeFromHost(headersList.get("host"));

  return <PortalLoginForm mode={mode} />;
}
