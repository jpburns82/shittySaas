import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,

  // Enable logs for structured logging
  enableLogs: true,

  // Performance monitoring for edge functions
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  // Only send errors in production
  enabled: process.env.NODE_ENV === "production",
});
