import { sql } from "drizzle-orm";
import {
  boolean,
  date,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import {
  ASSIGNMENT_STATUSES,
  BUDGET_CATEGORIES,
  COUNTRIES,
  FEE_STRUCTURES,
  MEDIA_CONSENT,
  OWNERS,
  PAYMENT_METHODS,
  PAYMENT_TYPES,
  PEOPLE,
  PORTFOLIO_STATUSES,
  STAGES,
  TASK_STATUSES,
  TIERS,
  VENDOR_CATEGORIES,
  VENDOR_STATUSES,
} from "@/lib/domain";

/*
 * Conventions:
 *  - money is integer pence (column names end in `_pence`)
 *  - calendar dates are `date` columns read as "YYYY-MM-DD" strings
 *  - everything hanging off a client cascades on delete, so erasing a
 *    client (GDPR) removes every trace in one statement
 */

export const ownerEnum = pgEnum("owner", OWNERS);
export const personEnum = pgEnum("person", PEOPLE);
export const countryEnum = pgEnum("country", COUNTRIES);
export const tierEnum = pgEnum("tier", TIERS);
export const feeStructureEnum = pgEnum("fee_structure", FEE_STRUCTURES);
export const stageEnum = pgEnum("stage", STAGES);
export const vendorCategoryEnum = pgEnum("vendor_category", VENDOR_CATEGORIES);
export const vendorStatusEnum = pgEnum("vendor_status", VENDOR_STATUSES);
export const assignmentStatusEnum = pgEnum("assignment_status", ASSIGNMENT_STATUSES);
export const budgetCategoryEnum = pgEnum("budget_category", BUDGET_CATEGORIES);
export const taskStatusEnum = pgEnum("task_status", TASK_STATUSES);
export const paymentTypeEnum = pgEnum("payment_type", PAYMENT_TYPES);
export const paymentMethodEnum = pgEnum("payment_method", PAYMENT_METHODS);
export const portfolioStatusEnum = pgEnum("portfolio_status", PORTFOLIO_STATUSES);
export const mediaConsentEnum = pgEnum("media_consent", MEDIA_CONSENT);

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
};

// ── Staff ────────────────────────────────────────────────────────────────

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  /** Which side of the business this login represents, for "mine" filters. */
  person: personEnum("person").notNull().unique(),
  ...timestamps,
});

/** Failed sign-in attempts, for throttling brute-force guesses. */
export const loginAttempts = pgTable(
  "login_attempts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: text("email").notNull(),
    attemptedAt: timestamp("attempted_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("login_attempts_email_idx").on(t.email, t.attemptedAt)],
);

// ── Clients (bookings) ───────────────────────────────────────────────────

export const clients = pgTable(
  "clients",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    partnerOneName: text("partner_one_name").notNull(),
    partnerTwoName: text("partner_two_name").notNull(),
    email: text("email"),
    phone: text("phone"),
    secondaryEmail: text("secondary_email"),
    secondaryPhone: text("secondary_phone"),

    weddingDate: date("wedding_date", { mode: "string" }).notNull(),
    bookedOn: date("booked_on", { mode: "string" }).notNull(),
    venueName: text("venue_name"),
    country: countryEnum("country").notNull(),
    guestCount: integer("guest_count"),

    tier: tierEnum("tier").notNull(),
    addonFoodWine: boolean("addon_food_wine").notNull().default(false),

    feeStructure: feeStructureEnum("fee_structure").notNull().default("flat"),
    /** Couple's overall wedding budget. Drives the 10% fee and budget target. */
    weddingBudgetPence: integer("wedding_budget_pence"),
    /** Flat fee as agreed, or the calculated 10%/minimum fee. */
    baseFeePence: integer("base_fee_pence").notNull(),
    destinationSurchargePence: integer("destination_surcharge_pence").notNull().default(0),
    totalFeePence: integer("total_fee_pence").notNull(),

    stage: stageEnum("stage").notNull().default("booked"),
    lead: ownerEnum("lead").notNull().default("joint"),
    notes: text("notes"),
    deliveredAt: timestamp("delivered_at", { withTimezone: true }),
    ...timestamps,
  },
  (t) => [
    index("clients_wedding_date_idx").on(t.weddingDate),
    index("clients_stage_idx").on(t.stage),
  ],
);

// ── Vendors ──────────────────────────────────────────────────────────────

export const vendors = pgTable(
  "vendors",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    category: vendorCategoryEnum("category").notNull(),
    country: countryEnum("country").notNull(),
    region: text("region"),
    contactName: text("contact_name"),
    email: text("email"),
    phone: text("phone"),
    website: text("website"),
    status: vendorStatusEnum("status").notNull().default("prospective"),
    pricingTerms: text("pricing_terms"),
    /** Vetting checklist — each item is complete when dated. */
    publicLiabilityConfirmedOn: date("public_liability_confirmed_on", { mode: "string" }),
    tastingAttendedOn: date("tasting_attended_on", { mode: "string" }),
    referencesCheckedOn: date("references_checked_on", { mode: "string" }),
    responseTimeTestedOn: date("response_time_tested_on", { mode: "string" }),
    notes: text("notes"),
    ...timestamps,
  },
  (t) => [index("vendors_country_category_idx").on(t.country, t.category)],
);

// ── Vendor assignments ───────────────────────────────────────────────────

export const vendorAssignments = pgTable(
  "vendor_assignments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    clientId: uuid("client_id")
      .notNull()
      .references(() => clients.id, { onDelete: "cascade" }),
    // Restrict: a vendor in use on a booking can't silently vanish.
    vendorId: uuid("vendor_id")
      .notNull()
      .references(() => vendors.id, { onDelete: "restrict" }),
    category: vendorCategoryEnum("category").notNull(),
    status: assignmentStatusEnum("status").notNull().default("shortlisted"),
    owner: ownerEnum("owner").notNull(),
    contractRef: text("contract_ref"),
    depositRef: text("deposit_ref"),
    notes: text("notes"),
    ...timestamps,
  },
  (t) => [
    index("vendor_assignments_client_idx").on(t.clientId),
    index("vendor_assignments_vendor_idx").on(t.vendorId),
    uniqueIndex("vendor_assignments_unique").on(t.clientId, t.vendorId, t.category),
  ],
);

// ── Budget lines ─────────────────────────────────────────────────────────

export const budgetLines = pgTable(
  "budget_lines",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    clientId: uuid("client_id")
      .notNull()
      .references(() => clients.id, { onDelete: "cascade" }),
    category: budgetCategoryEnum("category").notNull(),
    description: text("description"),
    committedPence: integer("committed_pence").notNull(),
    actualPence: integer("actual_pence"),
    vendorId: uuid("vendor_id").references(() => vendors.id, { onDelete: "set null" }),
    notes: text("notes"),
    ...timestamps,
  },
  (t) => [index("budget_lines_client_idx").on(t.clientId)],
);

// ── Timeline tasks ───────────────────────────────────────────────────────

export const timelineTasks = pgTable(
  "timeline_tasks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    clientId: uuid("client_id")
      .notNull()
      .references(() => clients.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    phase: text("phase").notNull(),
    phaseOrder: integer("phase_order").notNull().default(0),
    sortOrder: integer("sort_order").notNull().default(0),
    dueDate: date("due_date", { mode: "string" }).notNull(),
    /** Set when someone edits the date by hand, so regeneration leaves it alone. */
    dueDateManual: boolean("due_date_manual").notNull().default(false),
    owner: ownerEnum("owner").notNull(),
    status: taskStatusEnum("status").notNull().default("not_started"),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    /** Null for tasks added by hand. */
    templateKey: text("template_key"),
    notes: text("notes"),
    ...timestamps,
  },
  (t) => [
    index("timeline_tasks_client_idx").on(t.clientId),
    index("timeline_tasks_due_idx").on(t.dueDate).where(sql`status <> 'done'`),
    uniqueIndex("timeline_tasks_template_unique").on(t.clientId, t.templateKey),
  ],
);

// ── Payments ─────────────────────────────────────────────────────────────

export const payments = pgTable(
  "payments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    clientId: uuid("client_id")
      .notNull()
      .references(() => clients.id, { onDelete: "cascade" }),
    type: paymentTypeEnum("type").notNull(),
    label: text("label"),
    amountPence: integer("amount_pence").notNull(),
    dueDate: date("due_date", { mode: "string" }).notNull(),
    paidDate: date("paid_date", { mode: "string" }),
    method: paymentMethodEnum("method"),
    notes: text("notes"),
    ...timestamps,
  },
  (t) => [
    index("payments_client_idx").on(t.clientId),
    index("payments_unpaid_due_idx").on(t.dueDate).where(sql`paid_date is null`),
  ],
);

// ── Post-wedding record ──────────────────────────────────────────────────

export const postWeddingRecords = pgTable("post_wedding_records", {
  clientId: uuid("client_id")
    .primaryKey()
    .references(() => clients.id, { onDelete: "cascade" }),
  testimonialReceived: boolean("testimonial_received").notNull().default(false),
  testimonialText: text("testimonial_text"),
  /** Per the client agreement's opt-out clause. */
  mediaConsent: mediaConsentEnum("media_consent").notNull().default("pending"),
  portfolioStatus: portfolioStatusEnum("portfolio_status").notNull().default("not_started"),
  debriefNotes: text("debrief_notes"),
  ...timestamps,
});

export type Client = typeof clients.$inferSelect;
export type Vendor = typeof vendors.$inferSelect;
export type VendorAssignment = typeof vendorAssignments.$inferSelect;
export type BudgetLine = typeof budgetLines.$inferSelect;
export type TimelineTask = typeof timelineTasks.$inferSelect;
export type Payment = typeof payments.$inferSelect;
export type PostWeddingRecord = typeof postWeddingRecords.$inferSelect;
export type User = typeof users.$inferSelect;
