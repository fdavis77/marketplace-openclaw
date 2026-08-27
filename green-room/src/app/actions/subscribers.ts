"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export type SubscribeState = { error?: string; success?: boolean } | undefined;

const schema = z.object({ email: z.email() });

export async function subscribe(_prevState: SubscribeState, formData: FormData): Promise<SubscribeState> {
  const parsed = schema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return { error: "Enter a valid email address." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("subscribers").insert({ email: parsed.data.email });

  // Unique violation just means they're already subscribed — treat as success.
  if (error && error.code !== "23505") {
    return { error: "Something went wrong. Please try again." };
  }

  return { success: true };
}
