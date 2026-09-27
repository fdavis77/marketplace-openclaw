/**
 * Single source of truth for Ember & Aisle's business vocabulary.
 * The database enums in src/db/schema.ts are built from these arrays, so a
 * value added here flows through to the DB (via a migration), forms and labels.
 */

export const OWNERS = ["fabian", "davinia", "joint"] as const;
export type Owner = (typeof OWNERS)[number];
export const OWNER_LABELS: Record<Owner, string> = {
  fabian: "Fabian",
  davinia: "Davinia",
  joint: "Joint",
};

/** A signed-in person. "joint" is an assignment, never a login. */
export const PEOPLE = ["fabian", "davinia"] as const;
export type Person = (typeof PEOPLE)[number];

export const COUNTRIES = [
  "uk",
  "italy",
  "croatia",
  "spain",
  "montenegro",
  "serbia",
  "albania",
] as const;
export type Country = (typeof COUNTRIES)[number];
export const COUNTRY_LABELS: Record<Country, string> = {
  uk: "United Kingdom",
  italy: "Italy",
  croatia: "Croatia",
  spain: "Spain",
  montenegro: "Montenegro",
  serbia: "Serbia",
  albania: "Albania",
};

export const TIERS = ["full", "partial", "day_of"] as const;
export type Tier = (typeof TIERS)[number];
export const TIER_LABELS: Record<Tier, string> = {
  full: "Full Planning",
  partial: "Partial Planning",
  day_of: "Day-of Coordination",
};
export const TIER_SHORT: Record<Tier, string> = {
  full: "Tier 1",
  partial: "Tier 2",
  day_of: "Tier 3",
};

export const FEE_STRUCTURES = ["flat", "percent_of_budget"] as const;
export type FeeStructure = (typeof FEE_STRUCTURES)[number];
export const FEE_STRUCTURE_LABELS: Record<FeeStructure, string> = {
  flat: "Flat fee",
  percent_of_budget: "10% of budget (min £5,500)",
};

export const STAGES = [
  "enquiry",
  "consultation",
  "proposal",
  "booked",
  "planning",
  "delivered",
  "lost",
] as const;
export type Stage = (typeof STAGES)[number];
export const STAGE_LABELS: Record<Stage, string> = {
  enquiry: "Enquiry",
  consultation: "Consultation",
  proposal: "Proposal sent",
  booked: "Booked",
  planning: "In planning",
  delivered: "Delivered",
  lost: "Lost",
};
/** Stages whose weddings still need work from us. */
export const ACTIVE_STAGES: Stage[] = [
  "enquiry",
  "consultation",
  "proposal",
  "booked",
  "planning",
];

export const VENDOR_CATEGORIES = [
  "venue",
  "catering",
  "photo_video",
  "cake",
  "hair_makeup",
  "suits_dresswear",
  "wine_drinks",
] as const;
export type VendorCategory = (typeof VENDOR_CATEGORIES)[number];
export const VENDOR_CATEGORY_LABELS: Record<VendorCategory, string> = {
  venue: "Venue",
  catering: "Catering",
  photo_video: "Photography / Videography",
  cake: "Cake",
  hair_makeup: "Hair & Makeup",
  suits_dresswear: "Suits / Dresswear",
  wine_drinks: "Wine & Drinks",
};

/**
 * Who leads each category by default, following the business split:
 * Davinia leads bride-side, Fabian groom-side plus all food and wine,
 * venue is joint. Suits/dresswear spans both sides, so it defaults to joint.
 * Every assignment can be overridden per booking.
 */
export const CATEGORY_DEFAULT_OWNER: Record<VendorCategory, Owner> = {
  venue: "joint",
  catering: "fabian",
  photo_video: "joint",
  cake: "fabian",
  hair_makeup: "davinia",
  suits_dresswear: "joint",
  wine_drinks: "fabian",
};

export const VENDOR_STATUSES = ["prospective", "approved", "do_not_use"] as const;
export type VendorStatus = (typeof VENDOR_STATUSES)[number];
export const VENDOR_STATUS_LABELS: Record<VendorStatus, string> = {
  prospective: "Prospective",
  approved: "Approved",
  do_not_use: "Do not use",
};

/** Structured vetting checklist: each item is complete when it has a date. */
export const VETTING_CHECKS = [
  { key: "publicLiabilityConfirmedOn", label: "Public liability confirmed" },
  { key: "tastingAttendedOn", label: "Tasting attended" },
  { key: "referencesCheckedOn", label: "References checked" },
  { key: "responseTimeTestedOn", label: "Response time tested" },
] as const;
export type VettingKey = (typeof VETTING_CHECKS)[number]["key"];

export const ASSIGNMENT_STATUSES = ["shortlisted", "booked", "confirmed"] as const;
export type AssignmentStatus = (typeof ASSIGNMENT_STATUSES)[number];
export const ASSIGNMENT_STATUS_LABELS: Record<AssignmentStatus, string> = {
  shortlisted: "Shortlisted",
  booked: "Booked",
  confirmed: "Confirmed",
};

export const BUDGET_CATEGORIES = [
  ...VENDOR_CATEGORIES,
  "florals_styling",
  "stationery",
  "travel_accommodation",
  "legal_admin",
  "other",
] as const;
export type BudgetCategory = (typeof BUDGET_CATEGORIES)[number];
export const BUDGET_CATEGORY_LABELS: Record<BudgetCategory, string> = {
  ...VENDOR_CATEGORY_LABELS,
  florals_styling: "Florals & Styling",
  stationery: "Stationery",
  travel_accommodation: "Travel & Accommodation",
  legal_admin: "Legal & Admin",
  other: "Other",
};

export const TASK_STATUSES = ["not_started", "in_progress", "done"] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];
export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  not_started: "Not started",
  in_progress: "In progress",
  done: "Done",
};

export const PAYMENT_TYPES = ["deposit", "milestone", "balance"] as const;
export type PaymentType = (typeof PAYMENT_TYPES)[number];
export const PAYMENT_TYPE_LABELS: Record<PaymentType, string> = {
  deposit: "Deposit",
  milestone: "Milestone",
  balance: "Balance",
};

export const PAYMENT_METHODS = ["bank_transfer", "card", "cash", "other"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];
export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  bank_transfer: "Bank transfer",
  card: "Card",
  cash: "Cash",
  other: "Other",
};

/** Derived, never stored — so it can't go stale overnight. */
export type PaymentStatus = "upcoming" | "due" | "overdue" | "paid";
export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  upcoming: "Upcoming",
  due: "Due",
  overdue: "Overdue",
  paid: "Paid",
};

export const PORTFOLIO_STATUSES = [
  "not_started",
  "selecting",
  "published",
  "excluded",
] as const;
export type PortfolioStatus = (typeof PORTFOLIO_STATUSES)[number];
export const PORTFOLIO_STATUS_LABELS: Record<PortfolioStatus, string> = {
  not_started: "Not started",
  selecting: "Selecting images",
  published: "Published",
  excluded: "Excluded",
};

export const MEDIA_CONSENT = ["pending", "granted", "opted_out"] as const;
export type MediaConsent = (typeof MEDIA_CONSENT)[number];
export const MEDIA_CONSENT_LABELS: Record<MediaConsent, string> = {
  pending: "Awaiting answer",
  granted: "Consent given",
  opted_out: "Opted out",
};

/** "Mine" includes joint work — joint means it's on both of your plates. */
export function isMine(owner: Owner, person: Person): boolean {
  return owner === person || owner === "joint";
}
