import { getRequestConfig } from "next-intl/server";
import { locales } from "./config";

export default getRequestConfig(async ({ locale }) => {
  // Validate that the incoming `locale` parameter is valid
  const validatedLocale = locales.includes(locale as (typeof locales)[number])
    ? locale
    : "en";

  return {
    locale: validatedLocale as string,
    messages: (await import(`../../messages/${validatedLocale}.json`)).default,
  };
});
