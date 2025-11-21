import * as Sentry from "@sentry/nextjs";
import { env, isDevelopment } from "@/lib/env";

Sentry.init({
  dsn: env.NEXT_PUBLIC_SENTRY_DSN,

  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: 0.1,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,

  // Environment
  environment: env.NODE_ENV,

  // Only send events in production
  beforeSend(event) {
    // Don't send events in development
    if (isDevelopment()) {
      return null;
    }
    return event;
  },
});
