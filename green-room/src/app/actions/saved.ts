"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { assertUser } from "@/lib/dal";

const schema = z.object({
  itemType: z.enum(["event", "opportunity"]),
  itemId: z.uuid(),
  path: z.string().startsWith("/"),
});

export async function toggleSaved(formData: FormData) {
  const user = await assertUser();
  const parsed = schema.parse({
    itemType: formData.get("itemType"),
    itemId: formData.get("itemId"),
    path: formData.get("path"),
  });

  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("saved_items")
    .select("id")
    .eq("user_id", user.id)
    .eq("item_type", parsed.itemType)
    .eq("item_id", parsed.itemId)
    .maybeSingle();

  if (existing) {
    await supabase.from("saved_items").delete().eq("id", existing.id);
  } else {
    await supabase
      .from("saved_items")
      .insert({ user_id: user.id, item_type: parsed.itemType, item_id: parsed.itemId });
  }

  revalidatePath(parsed.path);
}
