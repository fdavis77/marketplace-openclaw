"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { assertUser } from "@/lib/dal";

export type ProfileState = { error?: string; success?: boolean } | undefined;

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

const schema = z.object({
  displayName: z.string().trim().min(2, "Name must be at least 2 characters.").max(80),
  bio: z.string().trim().max(500).optional(),
  location: z.string().trim().max(120).optional(),
  creativeRoles: z.string().trim().max(300).optional(),
  reel: z.union([z.url(), z.literal("")]).optional(),
  instagram: z.union([z.url(), z.literal("")]).optional(),
  imdb: z.union([z.url(), z.literal("")]).optional(),
  site: z.union([z.url(), z.literal("")]).optional(),
});

export async function updateProfile(_prevState: ProfileState, formData: FormData): Promise<ProfileState> {
  // The row to update is always the caller's own — never taken from the form.
  const user = await assertUser();

  const parsed = schema.safeParse({
    displayName: formData.get("displayName"),
    bio: formData.get("bio") || undefined,
    location: formData.get("location") || undefined,
    creativeRoles: formData.get("creativeRoles") || undefined,
    reel: formData.get("reel") || "",
    instagram: formData.get("instagram") || "",
    imdb: formData.get("imdb") || "",
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
    ...(parsed.data.reel ? { reel: parsed.data.reel } : {}),
    ...(parsed.data.instagram ? { instagram: parsed.data.instagram } : {}),
    ...(parsed.data.imdb ? { imdb: parsed.data.imdb } : {}),
    ...(parsed.data.site ? { site: parsed.data.site } : {}),
  };

  const { error } = await supabase
    .from("profiles")
    .update({
      display_name: parsed.data.displayName,
      bio: parsed.data.bio ?? null,
      location: parsed.data.location ?? null,
      creative_roles: parsed.data.creativeRoles
        ? parsed.data.creativeRoles.split(",").map((r) => r.trim()).filter(Boolean)
        : [],
      links,
      ...(photoUrl ? { photo_url: photoUrl } : {}),
    })
    .eq("id", user.id);

  if (error) return { error: "Something went wrong saving your profile." };

  revalidatePath(`/profile/${user.id}`);
  return { success: true };
}
