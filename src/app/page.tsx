import { redirect } from "next/navigation";
import { defaultLocale } from "@/lib/i18n/config";

// Redirect root / to /[locale] for consistency with i18n structure
export default function RootRedirect() {
  redirect(`/${defaultLocale}`);
}
