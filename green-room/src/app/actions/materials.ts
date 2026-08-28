"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { assertUser } from "@/lib/dal";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
const MAX_BYTES = 10 * 1024 * 1024;

const schema = z.object({
  type: z.enum(["headshot", "reel", "resume", "other"]),
  label: z.string().trim().min(1, "Give it a label.").max(200),
  externalUrl: z.union([z.url(), z.literal("")]).optional(),
});

export type MaterialState = { error?: string } | undefined;

export async function addMaterial(_prevState: MaterialState, formData: FormData): Promise<MaterialState> {
  const user = await assertUser();
  const parsed = schema.safeParse({
    type: formData.get("type"),
    label: formData.get("label"),
    externalUrl: formData.get("externalUrl") || "",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check your details." };
  }

  const supabase = await createClient();
  const file = formData.get("file");
  let url: string | null = parsed.data.externalUrl || null;

  if (file instanceof File && file.size > 0) {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return { error: "Files must be JPEG, PNG, WebP, or PDF." };
    }
    if (file.size > MAX_BYTES) {
      return { error: "Files must be under 10MB." };
    }
    const ext = file.type.split("/")[1];
    const path = `${user.id}/materials/${crypto.randomUUID()}.${ext}`;
    const { error: uploadError } = await supabase.storage.from("media").upload(path, file, {
      contentType: file.type,
    });
    if (uploadError) return { error: "Could not upload file. Please try again." };
    url = supabase.storage.from("media").getPublicUrl(path).data.publicUrl;
  }

  if (!url) return { error: "Attach a file or paste a link (e.g. a Vimeo reel)." };

  const { error } = await supabase.from("materials").insert({
    owner_id: user.id,
    type: parsed.data.type,
    label: parsed.data.label,
    url,
  });
  if (error) return { error: "Something went wrong saving that." };

  revalidatePath("/materials");
}

export async function deleteMaterial(formData: FormData) {
  await assertUser();
  const id = z.uuid().parse(formData.get("id"));
  const supabase = await createClient();
  await supabase.from("materials").delete().eq("id", id);
  revalidatePath("/materials");
}
