import { headers } from "next/headers";
import { PortalResetPasswordForm } from "@/components/auth/PortalResetPasswordForm";
import { getPortalModeFromHost } from "@/lib/portal";

export const dynamic = "force-dynamic";

export default async function ResetPasswordPage() {
  const headersList = await headers();
  const mode = getPortalModeFromHost(headersList.get("host"));

  return <PortalResetPasswordForm mode={mode} />;
}
