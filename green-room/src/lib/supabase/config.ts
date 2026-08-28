// Fallback values point at this project's own Supabase instance. These are
// not secrets — the publishable/anon key is meant to be shipped in client
// bundles; Row Level Security (see supabase/schema.sql) is what actually
// protects the data. Override via env vars to point at a different project.
export const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://bzojafypkqqsbpjiiwzr.supabase.co";

export const SUPABASE_PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ6b2phZnlwa3Fxc2Jwamlpd3pyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc4NTgwNjAsImV4cCI6MjEwMzQzNDA2MH0.LruIi8hxN28LX_2wYkw5pKG94VVZkCwnkUwQ0l3t6oQ";
