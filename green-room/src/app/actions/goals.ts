"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { assertUser } from "@/lib/dal";

const goalSchema = z.object({
  cadence: z.enum(["daily", "weekly"]),
  unit: z.enum(["words", "pages"]),
  targetAmount: z.coerce.number().int().min(1).max(100000),
});

export async function upsertGoal(formData: FormData) {
  const user = await assertUser();
  const data = goalSchema.parse({
    cadence: formData.get("cadence"),
    unit: formData.get("unit"),
    targetAmount: formData.get("targetAmount"),
  });
  const supabase = await createClient();
  await supabase
    .from("writing_goals")
    .upsert(
      { owner_id: user.id, cadence: data.cadence, unit: data.unit, target_amount: data.targetAmount },
      { onConflict: "owner_id" }
    );
  revalidatePath("/goals");
}

const sessionSchema = z.object({
  projectId: z.uuid().optional(),
  sessionDate: z.string().min(1),
  unit: z.enum(["words", "pages"]),
  amount: z.coerce.number().int().min(1).max(100000),
  notes: z.string().trim().max(500).optional(),
});

export async function logSession(formData: FormData) {
  const user = await assertUser();
  const data = sessionSchema.parse({
    projectId: formData.get("projectId") || undefined,
    sessionDate: formData.get("sessionDate"),
    unit: formData.get("unit"),
    amount: formData.get("amount"),
    notes: formData.get("notes") || undefined,
  });
  const supabase = await createClient();
  await supabase.from("writing_sessions").insert({
    owner_id: user.id,
    project_id: data.projectId ?? null,
    session_date: data.sessionDate,
    unit: data.unit,
    amount: data.amount,
    notes: data.notes ?? null,
  });
  revalidatePath("/goals");
}

export async function deleteSession(formData: FormData) {
  await assertUser();
  const id = z.uuid().parse(formData.get("id"));
  const supabase = await createClient();
  await supabase.from("writing_sessions").delete().eq("id", id);
  revalidatePath("/goals");
}
