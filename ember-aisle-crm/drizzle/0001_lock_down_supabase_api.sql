-- Supabase exposes the public schema through its REST/GraphQL API using the
-- public anon key. Enabling RLS with NO policies denies that API all access.
-- The app connects as the database owner (postgres), which bypasses RLS,
-- so this changes nothing for the CRM itself. Harmless on plain Postgres.
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "login_attempts" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "clients" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "vendors" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "vendor_assignments" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "budget_lines" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "timeline_tasks" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "payments" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "post_wedding_records" ENABLE ROW LEVEL SECURITY;
