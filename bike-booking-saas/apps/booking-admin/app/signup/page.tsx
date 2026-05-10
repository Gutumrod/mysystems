import { headers } from "next/headers";
import { PortalSignupForm } from "@/components/auth/PortalSignupForm";
import { getPortalModeFromHost } from "@/lib/portal";

export const dynamic = "force-dynamic";

export default async function SignupPage() {
  const headersList = await headers();
  const mode = getPortalModeFromHost(headersList.get("host"));

  return <PortalSignupForm mode={mode} />;
}
