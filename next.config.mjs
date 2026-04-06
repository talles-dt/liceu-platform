import { withSentryConfig } from "@sentry/nextjs";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typedRoutes: true,
};

const sentryConfig = {
  // Enable source maps in production
  sourcemaps: {
    disable: false,
  },

  // Don't fail the build if Sentry upload fails
  telemetry: false,

  // Hide Sentry debug output
  silent: true,

  // Org + Project — set via env vars
  org: process.env.SENTRY_ORG ?? "liceu",
  project: process.env.SENTRY_PROJECT ?? "liceu-platform",
  authToken: process.env.SENTRY_AUTH_TOKEN,
};

export default withSentryConfig(nextConfig, sentryConfig);
