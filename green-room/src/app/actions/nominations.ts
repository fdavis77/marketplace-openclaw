"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { assertUser } from "@/lib/dal";

export type NominateState = { error?: string; success?: boolean } | undefined;

const schema = z.object({
  nomineeName: z.string().trim().min(2, "Enter a name.").max(120),
  nomineeContact: z.string().trim().max(200).optional(),
  reason: z.string().trim().min(10, "Say a little more about why.").max(1000),
});

export async function submitNomination(_prevState: NominateState, formData: FormData): Promise<NominateState> {
  const user = await assertUser();

  const parsed = schema.safeParse({
    nomineeName: formData.get("nomineeName"),
    nomineeContact: formData.get("nomineeContact") || undefined,
    reason: formData.get("reason"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check your details." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("nominations").insert({
    nominator_id: user.id,
    nominee_name: parsed.data.nomineeName,
    nominee_contact: parsed.data.nomineeContact ?? null,
    reason: parsed.data.reason,
  });

  if (error) return { error: "Something went wrong. Please try again." };

  return { success: true };
}
