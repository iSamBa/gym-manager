import { createNavigation } from "next-intl/navigation";
import { locales, defaultLocale, pathnames, localePrefix } from "./config";

export const { Link, redirect, usePathname, useRouter } = createNavigation({
  locales,
  defaultLocale,
  pathnames,
  localePrefix,
});
