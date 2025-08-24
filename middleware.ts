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
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
