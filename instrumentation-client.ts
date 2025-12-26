import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Enable logs for structured logging
  enableLogs: true,

  // Performance monitoring
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  // Session replay for debugging (only in production, sample 10%)
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,

  // Console logging integration
  integrations: [
    Sentry.consoleLoggingIntegration({ levels: ["warn", "error"] }),
    Sentry.replayIntegration(),
  ],

  // Only send errors in production
  enabled: process.env.NODE_ENV === "production",
});

// Required for navigation instrumentation in Next.js App Router
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
