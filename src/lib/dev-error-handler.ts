/**
 * Development Error Handler
 *
 * Filters out harmless development errors from Next.js/Turbopack HMR
 * to reduce noise in the development console and prevent false alarms.
 *
 * This handler ONLY runs in development mode and does NOT affect production.
 *
 * Suppressed Errors:
 * - HMR WebSocket ping messages (unrecognized HMR message "{"event":"ping"}")
 * - HMR WebSocket connection noise
 *
 * All other errors are passed through normally for proper debugging.
 */

if (process.env.NODE_ENV === "development") {
  // Filter out harmless HMR errors in the browser
  if (typeof window !== "undefined") {
    window.addEventListener("unhandledrejection", (event) => {
      const error = event.reason?.message || String(event.reason);

      // Known harmless HMR errors to suppress in development
      const harmlessPatterns = [
        /unrecognized HMR message.*ping/i,
        /HMR.*websocket/i,
        /HMR.*ping/i,
      ];

      if (harmlessPatterns.some((pattern) => pattern.test(error))) {
        // Suppress the error from the console
        event.preventDefault();

        // Optional: Log a single suppressed message instead of flooding the console
        // Uncomment if you want visibility that errors are being filtered:
        // console.debug('[Dev] Suppressed harmless HMR error:', error);

        return;
      }

      // Let other errors through for normal handling
    });
  }
}

export {};
