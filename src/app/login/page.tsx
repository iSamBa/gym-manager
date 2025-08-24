import { redirect } from "next/navigation";
import { defaultLocale } from "@/lib/i18n/config";

// Redirect /login to /[locale]/login for consistency with i18n structure
export default function LoginRedirect() {
  redirect(`/${defaultLocale}/login`);
}
