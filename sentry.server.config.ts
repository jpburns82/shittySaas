import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://af8f2df5c8fe94029eb88a6b8381af61@o4510591677169664.ingest.us.sentry.io/4510591699648512",

  // Enable logs for structured logging
  enableLogs: true,

  // Performance monitoring - sample 10% of transactions in production
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  // Console logging integration for server-side
  integrations: [
    Sentry.consoleLoggingIntegration({ levels: ["warn", "error"] }),
  ],

  // Only send errors in production
  enabled: process.env.NODE_ENV === "production",
});
