"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import { vendorAssignments, vendors } from "@/db/schema";
import { requireUser } from "@/lib/auth/dal";
import {
  ASSIGNMENT_STATUSES,
  COUNTRIES,
  OWNERS,
  VENDOR_CATEGORIES,
  VENDOR_STATUSES,
  VETTING_CHECKS,
  type VettingKey,
} from "@/lib/domain";
import { todayISO } from "@/lib/dates";
import {
  fromForm,
  invalid,
  optionalDate,
  optionalEmail,
  optionalText,
  requiredText,
  uuid,
  type ActionResult,
} from "@/lib/validation";

const VendorSchema = z.object({
  name: requiredText("Vendor name", 200),
  category: z.enum(VENDOR_CATEGORIES, { error: "Choose a category." }),
  country: z.enum(COUNTRIES, { error: "Choose a country." }),
  region: optionalText(120),
  contactName: optionalText(120),
  email: optionalEmail,
  phone: optionalText(40),
  website: z.preprocess(
    (v) => {
      if (typeof v !== "string" || v.trim() === "") return null;
      const t = v.trim();
      return /^https?:\/\//i.test(t) ? t : `https://${t}`;
    },
    z.url({ protocol: /^https?$/, error: "Enter a valid website." }).max(300).nullable(),
  ),
  status: z.enum(VENDOR_STATUSES),
  pricingTerms: optionalText(5000),
  publicLiabilityConfirmedOn: optionalDate,
  tastingAttendedOn: optionalDate,
  referencesCheckedOn: optionalDate,
  responseTimeTestedOn: optionalDate,
  notes: optionalText(10000),
});

export async function createVendor(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  await requireUser();
  const parsed = VendorSchema.safeParse(fromForm(fd));
  if (!parsed.success) return invalid(parsed.error);
  const [row] = await db.insert(vendors).values(parsed.data).returning({ id: vendors.id });
  revalidatePath("/", "layout");
  redirect(`/vendors/${row.id}`);
}

export async function updateVendor(vendorId: string, _prev: ActionResult, fd: FormData): Promise<ActionResult> {
  await requireUser();
  if (!uuid.safeParse(vendorId).success) return { ok: false, error: "Unknown vendor." };
  const parsed = VendorSchema.safeParse(fromForm(fd));
  if (!parsed.success) return invalid(parsed.error);
  const updated = await db
    .update(vendors)
    .set(parsed.data)
    .where(eq(vendors.id, vendorId))
    .returning({ id: vendors.id });
  if (!updated.length) return { ok: false, error: "That vendor no longer exists." };
  revalidatePath("/", "layout");
  redirect(`/vendors/${vendorId}`);
}

/** One-tap "done today" / "undo" for a vetting checklist item. */
export async function setVettingCheck(
  vendorId: string,
  key: VettingKey,
  done: boolean,
): Promise<ActionResult> {
  await requireUser();
  if (!uuid.safeParse(vendorId).success || !VETTING_CHECKS.some((c) => c.key === key)) {
    return { ok: false, error: "Invalid checklist item." };
  }
  await db
    .update(vendors)
    .set({ [key]: done ? todayISO() : null })
    .where(eq(vendors.id, vendorId));
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function deleteVendor(vendorId: string): Promise<ActionResult> {
  await requireUser();
  if (!uuid.safeParse(vendorId).success) return { ok: false, error: "Unknown vendor." };
  const inUse = await db
    .select({ id: vendorAssignments.id })
    .from(vendorAssignments)
    .where(eq(vendorAssignments.vendorId, vendorId))
    .limit(1);
  if (inUse.length) {
    return {
      ok: false,
      error: "This vendor is assigned to a booking. Remove it from those bookings first, or mark it “Do not use”.",
    };
  }
  await db.delete(vendors).where(eq(vendors.id, vendorId));
  revalidatePath("/", "layout");
  redirect("/vendors?deleted=1");
}

// ── Assignments ──────────────────────────────────────────────────────────

const AssignmentSchema = z.object({
  vendorId: uuid,
  category: z.enum(VENDOR_CATEGORIES),
  status: z.enum(ASSIGNMENT_STATUSES),
  owner: z.enum(OWNERS),
  contractRef: optionalText(200),
  depositRef: optionalText(200),
  notes: optionalText(5000),
});

export async function createAssignment(
  clientId: string,
  _prev: ActionResult,
  fd: FormData,
): Promise<ActionResult> {
  await requireUser();
  if (!uuid.safeParse(clientId).success) return { ok: false, error: "Unknown client." };
  const parsed = AssignmentSchema.safeParse(fromForm(fd));
  if (!parsed.success) return invalid(parsed.error);

  const [vendor] = await db
    .select({ category: vendors.category, status: vendors.status })
    .from(vendors)
    .where(eq(vendors.id, parsed.data.vendorId))
    .limit(1);
  if (!vendor) return { ok: false, error: "That vendor no longer exists." };
  if (vendor.status === "do_not_use") {
    return { ok: false, error: "That vendor is marked “Do not use” and can't be assigned." };
  }
  if (vendor.category !== parsed.data.category) {
    return { ok: false, error: "That vendor is in a different category." };
  }

  const dupe = await db
    .select({ id: vendorAssignments.id })
    .from(vendorAssignments)
    .where(
      and(
        eq(vendorAssignments.clientId, clientId),
        eq(vendorAssignments.vendorId, parsed.data.vendorId),
        eq(vendorAssignments.category, parsed.data.category),
      ),
    )
    .limit(1);
  if (dupe.length) return { ok: false, error: "That vendor is already on this booking for this category." };

  await db.insert(vendorAssignments).values({ clientId, ...parsed.data });
  revalidatePath("/", "layout");
  return { ok: true };
}

const AssignmentUpdateSchema = AssignmentSchema.omit({ vendorId: true, category: true });

export async function updateAssignment(
  assignmentId: string,
  _prev: ActionResult,
  fd: FormData,
): Promise<ActionResult> {
  await requireUser();
  if (!uuid.safeParse(assignmentId).success) return { ok: false, error: "Unknown assignment." };
  const parsed = AssignmentUpdateSchema.safeParse(fromForm(fd));
  if (!parsed.success) return invalid(parsed.error);
  await db.update(vendorAssignments).set(parsed.data).where(eq(vendorAssignments.id, assignmentId));
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function deleteAssignment(assignmentId: string): Promise<ActionResult> {
  await requireUser();
  if (!uuid.safeParse(assignmentId).success) return { ok: false, error: "Unknown assignment." };
  await db.delete(vendorAssignments).where(eq(vendorAssignments.id, assignmentId));
  revalidatePath("/", "layout");
  return { ok: true };
}
