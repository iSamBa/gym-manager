import createMiddleware from "next-intl/middleware";
import {
  locales,
  defaultLocale,
  pathnames,
  localePrefix,
} from "./src/lib/i18n/config";

export default createMiddleware({
  locales,
  defaultLocale,
  pathnames,
  localePrefix,
});

export const config = {
  // Match only internationalized pathnames
  matcher: ["/", "/(fr|en)/:path*"],
};
