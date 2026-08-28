"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { assertUser } from "@/lib/dal";

export type AccountState = { error?: string; success?: boolean } | undefined;

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const roleEnum = z.enum(["writer", "director", "actor"]);

const schema = z.object({
  displayName: z.string().trim().min(2, "Name must be at least 2 characters.").max(80),
  bio: z.string().trim().max(500).optional(),
  location: z.string().trim().max(120).optional(),
  roles: z.array(roleEnum),
  imdb: z.union([z.url(), z.literal("")]).optional(),
  instagram: z.union([z.url(), z.literal("")]).optional(),
  site: z.union([z.url(), z.literal("")]).optional(),
});

export async function updateAccount(_prevState: AccountState, formData: FormData): Promise<AccountState> {
  const user = await assertUser();

  const parsed = schema.safeParse({
    displayName: formData.get("displayName"),
    bio: formData.get("bio") || undefined,
    location: formData.get("location") || undefined,
    roles: formData.getAll("roles"),
    imdb: formData.get("imdb") || "",
    instagram: formData.get("instagram") || "",
    site: formData.get("site") || "",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check your details." };
  }

  const supabase = await createClient();
  const file = formData.get("photo");
  let photoUrl: string | undefined;

  if (file instanceof File && file.size > 0) {
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      return { error: "Photos must be JPEG, PNG, or WebP." };
    }
    if (file.size > MAX_IMAGE_BYTES) {
      return { error: "Photos must be under 5MB." };
    }
    const ext = file.type.split("/")[1];
    const path = `${user.id}/avatar.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("media")
      .upload(path, file, { contentType: file.type, upsert: true });
    if (uploadError) return { error: "Could not upload photo. Please try again." };
    photoUrl = supabase.storage.from("media").getPublicUrl(path).data.publicUrl;
  }

  const links = {
    ...(parsed.data.imdb ? { imdb: parsed.data.imdb } : {}),
    ...(parsed.data.instagram ? { instagram: parsed.data.instagram } : {}),
    ...(parsed.data.site ? { site: parsed.data.site } : {}),
  };

  const { error } = await supabase
    .from("profiles")
    .update({
      display_name: parsed.data.displayName,
      bio: parsed.data.bio ?? null,
      location: parsed.data.location ?? null,
      creative_roles: parsed.data.roles,
      links,
      ...(photoUrl ? { photo_url: photoUrl } : {}),
    })
    .eq("id", user.id);

  if (error) return { error: "Something went wrong saving your account." };

  revalidatePath("/account");
  revalidatePath("/");
  return { success: true };
}
