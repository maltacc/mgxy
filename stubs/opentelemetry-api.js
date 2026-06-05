// Stub for @opentelemetry/api
// This is used to prevent Metro bundler errors when @supabase/supabase-js
// tries to dynamically import @opentelemetry/api for optional telemetry.

module.exports = {
  trace: {
    getTracer: () => ({
      startSpan: () => {},
    }),
  },
  context: {
    active: () => ({}),
  },
};
