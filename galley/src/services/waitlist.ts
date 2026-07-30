import { supabase } from "../lib/supabase";
import type { Region, WaitlistRole } from "../types/database";

export async function joinWaitlist(input: {
  email: string;
  region: Region;
  role?: WaitlistRole;
}) {
  const { error } = await supabase.from("waitlist_signups").insert({
    email: input.email,
    region: input.region,
    role: input.role ?? null,
  });

  if (error) throw error;
}
