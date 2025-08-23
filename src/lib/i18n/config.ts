import { Pathnames } from "next-intl/routing";

export type Locale = "en" | "fr";

export const locales: Locale[] = ["en", "fr"];
export const defaultLocale: Locale = "en";

export const pathnames: Pathnames<typeof locales> = {
  "/": "/",
  "/members": {
    en: "/members",
    fr: "/membres",
  },
  "/memberships": {
    en: "/memberships",
    fr: "/abonnements",
  },
  "/payments": {
    en: "/payments",
    fr: "/paiements",
  },
  "/analytics": {
    en: "/analytics",
    fr: "/analyses",
  },
};

export const localePrefix = "as-needed";

// Port configuration for development
export const port = process.env.PORT || 3000;
export const host = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : `http://localhost:${port}`;
