import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1.0,
  // sendDefaultPii stays off (the SDK default) -- this app handles minor
  // students' data, and Sentry's default-PII mode would attach IP
  // addresses and request headers to every error by default. Error
  // reports here should have enough to debug from without also becoming
  // another place student data ends up.
});
