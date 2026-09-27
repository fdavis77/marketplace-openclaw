"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { budgetLines, payments, postWeddingRecords } from "@/db/schema";
import { requireUser } from "@/lib/auth/dal";
import {
  BUDGET_CATEGORIES,
  MEDIA_CONSENT,
  PAYMENT_METHODS,
  PAYMENT_TYPES,
  PORTFOLIO_STATUSES,
  type PaymentMethod,
} from "@/lib/domain";
import { todayISO } from "@/lib/dates";
import {
  checkbox,
  fromForm,
  invalid,
  optionalDate,
  optionalPounds,
  optionalText,
  requiredDate,
  requiredPounds,
  uuid,
  type ActionResult,
} from "@/lib/validation";

// ── Budget lines ─────────────────────────────────────────────────────────

const BudgetSchema = z.object({
  category: z.enum(BUDGET_CATEGORIES, { error: "Choose a category." }),
  description: optionalText(200),
  committed: requiredPounds("Committed amount"),
  actual: optionalPounds("Actual amount"),
  vendorId: z.preprocess((v) => (v === "" || v == null ? null : v), uuid.nullable()),
  notes: optionalText(5000),
});

function budgetRow(v: z.infer<typeof BudgetSchema>) {
  return {
    category: v.category,
    description: v.description,
    committedPence: v.committed,
    actualPence: v.actual,
    vendorId: v.vendorId,
    notes: v.notes,
  };
}

export async function createBudgetLine(clientId: string, _prev: ActionResult, fd: FormData): Promise<ActionResult> {
  await requireUser();
  if (!uuid.safeParse(clientId).success) return { ok: false, error: "Unknown client." };
  const parsed = BudgetSchema.safeParse(fromForm(fd));
  if (!parsed.success) return invalid(parsed.error);
  await db.insert(budgetLines).values({ clientId, ...budgetRow(parsed.data) });
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function updateBudgetLine(lineId: string, _prev: ActionResult, fd: FormData): Promise<ActionResult> {
  await requireUser();
  if (!uuid.safeParse(lineId).success) return { ok: false, error: "Unknown budget line." };
  const parsed = BudgetSchema.safeParse(fromForm(fd));
  if (!parsed.success) return invalid(parsed.error);
  await db.update(budgetLines).set(budgetRow(parsed.data)).where(eq(budgetLines.id, lineId));
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function deleteBudgetLine(lineId: string): Promise<ActionResult> {
  await requireUser();
  if (!uuid.safeParse(lineId).success) return { ok: false, error: "Unknown budget line." };
  await db.delete(budgetLines).where(eq(budgetLines.id, lineId));
  revalidatePath("/", "layout");
  return { ok: true };
}

// ── Payments ─────────────────────────────────────────────────────────────

const PaymentSchema = z
  .object({
    type: z.enum(PAYMENT_TYPES),
    label: optionalText(120),
    amount: requiredPounds("Amount"),
    dueDate: requiredDate("Due date"),
    paidDate: optionalDate,
    method: z.preprocess((v) => (v === "" || v == null ? null : v), z.enum(PAYMENT_METHODS).nullable()),
    notes: optionalText(5000),
  })
  .refine((v) => v.amount > 0, { path: ["amount"], message: "Amount must be more than £0." });

function paymentRow(v: z.infer<typeof PaymentSchema>) {
  return {
    type: v.type,
    label: v.label,
    amountPence: v.amount,
    dueDate: v.dueDate,
    paidDate: v.paidDate,
    method: v.method,
    notes: v.notes,
  };
}

export async function createPayment(clientId: string, _prev: ActionResult, fd: FormData): Promise<ActionResult> {
  await requireUser();
  if (!uuid.safeParse(clientId).success) return { ok: false, error: "Unknown client." };
  const parsed = PaymentSchema.safeParse(fromForm(fd));
  if (!parsed.success) return invalid(parsed.error);
  await db.insert(payments).values({ clientId, ...paymentRow(parsed.data) });
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function updatePayment(paymentId: string, _prev: ActionResult, fd: FormData): Promise<ActionResult> {
  await requireUser();
  if (!uuid.safeParse(paymentId).success) return { ok: false, error: "Unknown payment." };
  const parsed = PaymentSchema.safeParse(fromForm(fd));
  if (!parsed.success) return invalid(parsed.error);
  await db.update(payments).set(paymentRow(parsed.data)).where(eq(payments.id, paymentId));
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function markPaymentPaid(paymentId: string, method: PaymentMethod | null): Promise<ActionResult> {
  await requireUser();
  if (!uuid.safeParse(paymentId).success) return { ok: false, error: "Unknown payment." };
  if (method !== null && !PAYMENT_METHODS.includes(method)) return { ok: false, error: "Invalid method." };
  await db
    .update(payments)
    .set({ paidDate: todayISO(), ...(method ? { method } : {}) })
    .where(eq(payments.id, paymentId));
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function deletePayment(paymentId: string): Promise<ActionResult> {
  await requireUser();
  if (!uuid.safeParse(paymentId).success) return { ok: false, error: "Unknown payment." };
  await db.delete(payments).where(eq(payments.id, paymentId));
  revalidatePath("/", "layout");
  return { ok: true };
}

// ── Post-wedding record ──────────────────────────────────────────────────

const WrapUpSchema = z.object({
  testimonialReceived: checkbox,
  testimonialText: optionalText(10000),
  mediaConsent: z.enum(MEDIA_CONSENT),
  portfolioStatus: z.enum(PORTFOLIO_STATUSES),
  debriefNotes: optionalText(20000),
});

export async function saveWrapUp(clientId: string, _prev: ActionResult, fd: FormData): Promise<ActionResult> {
  await requireUser();
  if (!uuid.safeParse(clientId).success) return { ok: false, error: "Unknown client." };
  const parsed = WrapUpSchema.safeParse(fromForm(fd));
  if (!parsed.success) return invalid(parsed.error);
  const v = parsed.data;
  // Photos can't go in the portfolio if the couple opted out.
  if (v.mediaConsent === "opted_out" && v.portfolioStatus === "published") {
    return {
      ok: false,
      error: "The couple opted out of photo/video use, so this wedding can't be published in the portfolio.",
      fieldErrors: { portfolioStatus: "Not allowed — couple opted out." },
    };
  }
  await db
    .insert(postWeddingRecords)
    .values({ clientId, ...v })
    .onConflictDoUpdate({ target: postWeddingRecords.clientId, set: v });
  revalidatePath("/", "layout");
  return { ok: true, message: "Wrap-up saved." };
}
