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

  // Replays configuration for session recording
  replaysOnErrorSampleRate: 1.0,

  // This sets the sample rate to be 10%. You may want this to be 100% while
  // in development and sample at a lower rate in production
  replaysSessionSampleRate: 0.1,

  // You can remove this option if you're not planning to use the Sentry Session Replay feature:
  integrations: [
    Sentry.replayIntegration({
      // Additional Replay configuration goes in here, for example:
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
});
