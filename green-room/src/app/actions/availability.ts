"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { assertUser } from "@/lib/dal";

const schema = z
  .object({
    startDate: z.string().min(1),
    endDate: z.string().min(1),
    reason: z.string().trim().max(200).optional(),
  })
  .refine((d) => d.endDate >= d.startDate, { message: "End date must be on or after the start date." });

export async function addAvailabilityBlock(formData: FormData) {
  const user = await assertUser();
  const data = schema.parse({
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
    reason: formData.get("reason") || undefined,
  });
  const supabase = await createClient();
  await supabase.from("availability_blocks").insert({
    owner_id: user.id,
    start_date: data.startDate,
    end_date: data.endDate,
    reason: data.reason ?? null,
  });
  revalidatePath("/availability");
}

export async function deleteAvailabilityBlock(formData: FormData) {
  await assertUser();
  const id = z.uuid().parse(formData.get("id"));
  const supabase = await createClient();
  await supabase.from("availability_blocks").delete().eq("id", id);
  revalidatePath("/availability");
}
