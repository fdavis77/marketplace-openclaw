CREATE TYPE "public"."assignment_status" AS ENUM('shortlisted', 'booked', 'confirmed');--> statement-breakpoint
CREATE TYPE "public"."budget_category" AS ENUM('venue', 'catering', 'photo_video', 'cake', 'hair_makeup', 'suits_dresswear', 'wine_drinks', 'florals_styling', 'stationery', 'travel_accommodation', 'legal_admin', 'other');--> statement-breakpoint
CREATE TYPE "public"."country" AS ENUM('uk', 'italy', 'croatia', 'spain', 'montenegro', 'serbia', 'albania');--> statement-breakpoint
CREATE TYPE "public"."fee_structure" AS ENUM('flat', 'percent_of_budget');--> statement-breakpoint
CREATE TYPE "public"."media_consent" AS ENUM('pending', 'granted', 'opted_out');--> statement-breakpoint
CREATE TYPE "public"."owner" AS ENUM('fabian', 'davinia', 'joint');--> statement-breakpoint
CREATE TYPE "public"."payment_method" AS ENUM('bank_transfer', 'card', 'cash', 'other');--> statement-breakpoint
CREATE TYPE "public"."payment_type" AS ENUM('deposit', 'milestone', 'balance');--> statement-breakpoint
CREATE TYPE "public"."person" AS ENUM('fabian', 'davinia');--> statement-breakpoint
CREATE TYPE "public"."portfolio_status" AS ENUM('not_started', 'selecting', 'published', 'excluded');--> statement-breakpoint
CREATE TYPE "public"."stage" AS ENUM('enquiry', 'consultation', 'proposal', 'booked', 'planning', 'delivered', 'lost');--> statement-breakpoint
CREATE TYPE "public"."task_status" AS ENUM('not_started', 'in_progress', 'done');--> statement-breakpoint
CREATE TYPE "public"."tier" AS ENUM('full', 'partial', 'day_of');--> statement-breakpoint
CREATE TYPE "public"."vendor_category" AS ENUM('venue', 'catering', 'photo_video', 'cake', 'hair_makeup', 'suits_dresswear', 'wine_drinks');--> statement-breakpoint
CREATE TYPE "public"."vendor_status" AS ENUM('prospective', 'approved', 'do_not_use');--> statement-breakpoint
CREATE TABLE "budget_lines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" uuid NOT NULL,
	"category" "budget_category" NOT NULL,
	"description" text,
	"committed_pence" integer NOT NULL,
	"actual_pence" integer,
	"vendor_id" uuid,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"partner_one_name" text NOT NULL,
	"partner_two_name" text NOT NULL,
	"email" text,
	"phone" text,
	"secondary_email" text,
	"secondary_phone" text,
	"wedding_date" date NOT NULL,
	"booked_on" date NOT NULL,
	"venue_name" text,
	"country" "country" NOT NULL,
	"guest_count" integer,
	"tier" "tier" NOT NULL,
	"addon_food_wine" boolean DEFAULT false NOT NULL,
	"fee_structure" "fee_structure" DEFAULT 'flat' NOT NULL,
	"wedding_budget_pence" integer,
	"base_fee_pence" integer NOT NULL,
	"destination_surcharge_pence" integer DEFAULT 0 NOT NULL,
	"total_fee_pence" integer NOT NULL,
	"stage" "stage" DEFAULT 'booked' NOT NULL,
	"lead" "owner" DEFAULT 'joint' NOT NULL,
	"notes" text,
	"delivered_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "login_attempts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"attempted_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" uuid NOT NULL,
	"type" "payment_type" NOT NULL,
	"label" text,
	"amount_pence" integer NOT NULL,
	"due_date" date NOT NULL,
	"paid_date" date,
	"method" "payment_method",
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "post_wedding_records" (
	"client_id" uuid PRIMARY KEY NOT NULL,
	"testimonial_received" boolean DEFAULT false NOT NULL,
	"testimonial_text" text,
	"media_consent" "media_consent" DEFAULT 'pending' NOT NULL,
	"portfolio_status" "portfolio_status" DEFAULT 'not_started' NOT NULL,
	"debrief_notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "timeline_tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" uuid NOT NULL,
	"name" text NOT NULL,
	"phase" text NOT NULL,
	"phase_order" integer DEFAULT 0 NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"due_date" date NOT NULL,
	"due_date_manual" boolean DEFAULT false NOT NULL,
	"owner" "owner" NOT NULL,
	"status" "task_status" DEFAULT 'not_started' NOT NULL,
	"completed_at" timestamp with time zone,
	"template_key" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"person" "person" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_person_unique" UNIQUE("person")
);
--> statement-breakpoint
CREATE TABLE "vendor_assignments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" uuid NOT NULL,
	"vendor_id" uuid NOT NULL,
	"category" "vendor_category" NOT NULL,
	"status" "assignment_status" DEFAULT 'shortlisted' NOT NULL,
	"owner" "owner" NOT NULL,
	"contract_ref" text,
	"deposit_ref" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vendors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"category" "vendor_category" NOT NULL,
	"country" "country" NOT NULL,
	"region" text,
	"contact_name" text,
	"email" text,
	"phone" text,
	"website" text,
	"status" "vendor_status" DEFAULT 'prospective' NOT NULL,
	"pricing_terms" text,
	"public_liability_confirmed_on" date,
	"tasting_attended_on" date,
	"references_checked_on" date,
	"response_time_tested_on" date,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "budget_lines" ADD CONSTRAINT "budget_lines_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "budget_lines" ADD CONSTRAINT "budget_lines_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_wedding_records" ADD CONSTRAINT "post_wedding_records_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "timeline_tasks" ADD CONSTRAINT "timeline_tasks_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_assignments" ADD CONSTRAINT "vendor_assignments_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_assignments" ADD CONSTRAINT "vendor_assignments_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "budget_lines_client_idx" ON "budget_lines" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "clients_wedding_date_idx" ON "clients" USING btree ("wedding_date");--> statement-breakpoint
CREATE INDEX "clients_stage_idx" ON "clients" USING btree ("stage");--> statement-breakpoint
CREATE INDEX "login_attempts_email_idx" ON "login_attempts" USING btree ("email","attempted_at");--> statement-breakpoint
CREATE INDEX "payments_client_idx" ON "payments" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "payments_unpaid_due_idx" ON "payments" USING btree ("due_date") WHERE paid_date is null;--> statement-breakpoint
CREATE INDEX "timeline_tasks_client_idx" ON "timeline_tasks" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "timeline_tasks_due_idx" ON "timeline_tasks" USING btree ("due_date") WHERE status <> 'done';--> statement-breakpoint
CREATE UNIQUE INDEX "timeline_tasks_template_unique" ON "timeline_tasks" USING btree ("client_id","template_key");--> statement-breakpoint
CREATE INDEX "vendor_assignments_client_idx" ON "vendor_assignments" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "vendor_assignments_vendor_idx" ON "vendor_assignments" USING btree ("vendor_id");--> statement-breakpoint
CREATE UNIQUE INDEX "vendor_assignments_unique" ON "vendor_assignments" USING btree ("client_id","vendor_id","category");--> statement-breakpoint
CREATE INDEX "vendors_country_category_idx" ON "vendors" USING btree ("country","category");