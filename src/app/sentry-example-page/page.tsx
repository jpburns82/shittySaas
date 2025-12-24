"use client";

import * as Sentry from "@sentry/nextjs";

export default function SentryExamplePage() {
  return (
    <div className="container py-16 text-center">
      <h1 className="font-display text-4xl mb-8">Sentry Test Page</h1>
      <p className="text-text-secondary mb-8">
        Click the button below to trigger a test error that will be sent to Sentry.
      </p>
      <button
        type="button"
        className="btn btn-primary"
        onClick={() => {
          Sentry.startSpan(
            {
              name: "Example Frontend Span",
              op: "test",
            },
            async () => {
              const res = await fetch("/api/sentry-example-api");
              if (!res.ok) {
                throw new Error("Sentry Example Frontend Error");
              }
            }
          );
        }}
      >
        Trigger Test Error
      </button>
      <p className="text-text-muted text-sm mt-8">
        After clicking, check your Sentry dashboard for the error.
      </p>
    </div>
  );
}
