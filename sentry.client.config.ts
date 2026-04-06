import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Only send in production
  enabled: process.env.NODE_ENV === "production",

  // 100% trace sampling in production
  tracesSampleRate: 1.0,

  // Capture replay for 20% of sessions
  replaysSessionSampleRate: 0.2,
  replaysOnErrorSampleRate: 1.0,

  // Ignore common noise
  ignoreErrors: [
    // Browser extensions
    "ResizeObserver loop limit exceeded",
    // Random network errors
    "Network Error",
    "Failed to fetch",
    "Load failed",
    // Ad blockers
    /adblock/i,
  ],

  // Don't track these URLs
  denyUrls: [
    /extensions\//i,
    /localhost/i,
  ],
});
