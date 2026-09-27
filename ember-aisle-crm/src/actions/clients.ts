"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import { clients, postWeddingRecords } from "@/db/schema";
import { requireUser } from "@/lib/auth/dal";
import { COUNTRIES, FEE_STRUCTURES, OWNERS, STAGES, TIERS, type Stage } from "@/lib/domain";
import { calculateFee } from "@/lib/fees";
import {
  checkbox,
  fromForm,
  invalid,
  optionalEmail,
  optionalInt,
  optionalPounds,
  optionalText,
  requiredDate,
  requiredText,
  uuid,
  type ActionResult,
} from "@/lib/validation";
import { syncTimeline } from "@/server/timeline";

const ClientSchema = z
  .object({
    partnerOneName: requiredText("First partner's name", 120),
    partnerTwoName: requiredText("Second partner's name", 120),
    email: optionalEmail,
    phone: optionalText(40),
    secondaryEmail: optionalEmail,
    secondaryPhone: optionalText(40),
    weddingDate: requiredDate("Wedding date"),
    bookedOn: requiredDate("Booking date"),
    venueName: optionalText(200),
    country: z.enum(COUNTRIES, { error: "Choose a country." }),
    guestCount: optionalInt("Guest count", 5000),
    tier: z.enum(TIERS, { error: "Choose a service tier." }),
    addonFoodWine: checkbox,
    feeStructure: z.enum(FEE_STRUCTURES),
    weddingBudget: optionalPounds("Wedding budget"),
    flatFee: optionalPounds("Fee"),
    destinationSurcharge: optionalPounds("Destination surcharge"),
    stage: z.enum(STAGES),
    lead: z.enum(OWNERS),
    notes: optionalText(5000),
  })
  .refine((v) => v.weddingDate >= v.bookedOn, {
    path: ["weddingDate"],
    message: "The wedding date can't be before the booking date.",
  });

function toRow(v: z.infer<typeof ClientSchema>) {
  const fee = calculateFee({
    tier: v.tier,
    feeStructure: v.feeStructure,
    flatFee: v.flatFee,
    weddingBudget: v.weddingBudget,
    destinationSurcharge: v.destinationSurcharge,
  });
  if (!fee.ok) return { error: fee.error } as const;
  return {
    row: {
      partnerOneName: v.partnerOneName,
      partnerTwoName: v.partnerTwoName,
      email: v.email,
      phone: v.phone,
      secondaryEmail: v.secondaryEmail,
      secondaryPhone: v.secondaryPhone,
      weddingDate: v.weddingDate,
      bookedOn: v.bookedOn,
      venueName: v.venueName,
      country: v.country,
      guestCount: v.guestCount,
      tier: v.tier,
      addonFoodWine: v.addonFoodWine,
      feeStructure: v.feeStructure,
      weddingBudgetPence: v.weddingBudget,
      baseFeePence: fee.baseFee,
      destinationSurchargePence: fee.surcharge,
      totalFeePence: fee.totalFee,
      stage: v.stage,
      lead: v.lead,
      notes: v.notes,
    },
  } as const;
}

export async function createClient(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  await requireUser();
  const parsed = ClientSchema.safeParse(fromForm(fd));
  if (!parsed.success) return invalid(parsed.error);
  const built = toRow(parsed.data);
  if ("error" in built) return { ok: false, error: built.error!, fieldErrors: { flatFee: built.error! } };

  const id = await db.transaction(async (tx) => {
    const [row] = await tx.insert(clients).values(built.row).returning({ id: clients.id });
    await syncTimeline(tx, row.id);
    if (built.row.stage === "delivered") await markDeliveredTx(tx, row.id);
    return row.id;
  });

  revalidatePath("/", "layout");
  redirect(`/clients/${id}?created=1`);
}

export async function updateClient(
  clientId: string,
  _prev: ActionResult,
  fd: FormData,
): Promise<ActionResult> {
  await requireUser();
  if (!uuid.safeParse(clientId).success) return { ok: false, error: "Unknown client." };
  const parsed = ClientSchema.safeParse(fromForm(fd));
  if (!parsed.success) return invalid(parsed.error);
  const built = toRow(parsed.data);
  if ("error" in built) return { ok: false, error: built.error!, fieldErrors: { flatFee: built.error! } };

  const found = await db.transaction(async (tx) => {
    const updated = await tx
      .update(clients)
      .set(built.row)
      .where(eq(clients.id, clientId))
      .returning({ id: clients.id });
    if (!updated.length) return false;
    await syncTimeline(tx, clientId);
    if (built.row.stage === "delivered") await markDeliveredTx(tx, clientId);
    return true;
  });
  if (!found) return { ok: false, error: "That client no longer exists." };

  revalidatePath("/", "layout");
  redirect(`/clients/${clientId}`);
}

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

async function markDeliveredTx(tx: Tx, clientId: string) {
  const [c] = await tx
    .select({ deliveredAt: clients.deliveredAt })
    .from(clients)
    .where(eq(clients.id, clientId));
  if (c && !c.deliveredAt) {
    await tx.update(clients).set({ deliveredAt: new Date() }).where(eq(clients.id, clientId));
  }
  await tx.insert(postWeddingRecords).values({ clientId }).onConflictDoNothing();
}

export async function setStage(clientId: string, stage: Stage): Promise<ActionResult> {
  await requireUser();
  if (!uuid.safeParse(clientId).success || !STAGES.includes(stage)) {
    return { ok: false, error: "Invalid stage." };
  }
  await db.transaction(async (tx) => {
    await tx.update(clients).set({ stage }).where(eq(clients.id, clientId));
    if (stage === "delivered") await markDeliveredTx(tx, clientId);
  });
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function regenerateTimeline(clientId: string): Promise<ActionResult> {
  await requireUser();
  if (!uuid.safeParse(clientId).success) return { ok: false, error: "Unknown client." };
  const r = await db.transaction((tx) => syncTimeline(tx, clientId));
  revalidatePath("/", "layout");
  return {
    ok: true,
    message: `Timeline rebuilt: ${r.inserted} added, ${r.updated} re-dated, ${r.deleted} removed.`,
  };
}

/**
 * GDPR erasure: removes the client and, by cascade, every task, budget line,
 * payment, vendor assignment and post-wedding record attached to them.
 */
export async function deleteClient(clientId: string, _prev: ActionResult, fd: FormData): Promise<ActionResult> {
  await requireUser();
  if (!uuid.safeParse(clientId).success) return { ok: false, error: "Unknown client." };
  const [c] = await db
    .select({ a: clients.partnerOneName, b: clients.partnerTwoName })
    .from(clients)
    .where(eq(clients.id, clientId));
  if (!c) return { ok: false, error: "That client no longer exists." };

  const typed = String(fd.get("confirm") ?? "").trim().toLowerCase();
  if (typed !== c.a.trim().toLowerCase()) {
    return { ok: false, error: `Type "${c.a}" to confirm permanent deletion.` };
  }
  await db.delete(clients).where(eq(clients.id, clientId));
  revalidatePath("/", "layout");
  redirect("/clients?deleted=1");
}
