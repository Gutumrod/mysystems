import { headers } from "next/headers";
import { PortalForgotPasswordForm } from "@/components/auth/PortalForgotPasswordForm";
import { getPortalModeFromHost } from "@/lib/portal";

export const dynamic = "force-dynamic";

export default async function ForgotPasswordPage() {
  const headersList = await headers();
  const mode = getPortalModeFromHost(headersList.get("host"));

  return <PortalForgotPasswordForm mode={mode} />;
}
