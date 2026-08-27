"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { assertUser, assertAdmin } from "@/lib/dal";

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

const postSchema = z.object({
  body: z.string().trim().min(1, "Say something first.").max(2000),
});

export type PostState = { error?: string } | undefined;

export async function createPost(_prevState: PostState, formData: FormData): Promise<PostState> {
  const user = await assertUser();

  const parsed = postSchema.safeParse({ body: formData.get("body") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check your post." };
  }

  const supabase = await createClient();
  const file = formData.get("image");
  let imageUrl: string | null = null;

  if (file instanceof File && file.size > 0) {
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      return { error: "Images must be JPEG, PNG, WebP, or GIF." };
    }
    if (file.size > MAX_IMAGE_BYTES) {
      return { error: "Images must be under 5MB." };
    }

    const ext = file.type.split("/")[1];
    const path = `${user.id}/posts/${crypto.randomUUID()}.${ext}`;
    const { error: uploadError } = await supabase.storage.from("media").upload(path, file, {
      contentType: file.type,
    });
    if (uploadError) return { error: "Could not upload image. Please try again." };

    imageUrl = supabase.storage.from("media").getPublicUrl(path).data.publicUrl;
  }

  const { error } = await supabase.from("posts").insert({
    author_id: user.id,
    body: parsed.data.body,
    image_url: imageUrl,
  });
  if (error) return { error: "Something went wrong posting that." };

  revalidatePath("/community");
}

export async function deletePost(formData: FormData) {
  await assertUser();
  const postId = z.uuid().parse(formData.get("postId"));

  const supabase = await createClient();
  // RLS allows delete when author_id = auth.uid() OR the actor is an admin.
  await supabase.from("posts").delete().eq("id", postId);
  revalidatePath("/community");
  revalidatePath("/admin");
}

export async function toggleHidePost(formData: FormData) {
  await assertAdmin();
  const postId = z.uuid().parse(formData.get("postId"));
  const hide = formData.get("hide") === "true";

  const supabase = await createClient();
  await supabase.from("posts").update({ is_hidden: hide }).eq("id", postId);
  revalidatePath("/community");
  revalidatePath("/admin");
}

const commentSchema = z.object({
  body: z.string().trim().min(1, "Write a comment first.").max(1000),
});

export async function createComment(formData: FormData) {
  const user = await assertUser();
  const postId = z.uuid().parse(formData.get("postId"));
  const parsed = commentSchema.parse({ body: formData.get("body") });

  const supabase = await createClient();
  await supabase.from("comments").insert({
    post_id: postId,
    author_id: user.id,
    body: parsed.body,
  });
  revalidatePath("/community");
}

export async function deleteComment(formData: FormData) {
  await assertUser();
  const commentId = z.uuid().parse(formData.get("commentId"));

  const supabase = await createClient();
  await supabase.from("comments").delete().eq("id", commentId);
  revalidatePath("/community");
  revalidatePath("/admin");
}

export async function toggleHideComment(formData: FormData) {
  await assertAdmin();
  const commentId = z.uuid().parse(formData.get("commentId"));
  const hide = formData.get("hide") === "true";

  const supabase = await createClient();
  await supabase.from("comments").update({ is_hidden: hide }).eq("id", commentId);
  revalidatePath("/community");
  revalidatePath("/admin");
}

export async function toggleLike(formData: FormData) {
  const user = await assertUser();
  const postId = z.uuid().parse(formData.get("postId"));

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("post_likes")
    .select("post_id")
    .eq("post_id", postId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    await supabase.from("post_likes").delete().eq("post_id", postId).eq("user_id", user.id);
  } else {
    await supabase.from("post_likes").insert({ post_id: postId, user_id: user.id });
  }
  revalidatePath("/community");
}
