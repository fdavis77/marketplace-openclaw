"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { assertUser } from "@/lib/dal";

export async function startConversation(formData: FormData) {
  await assertUser();
  const otherUserId = z.uuid().parse(formData.get("otherUserId"));
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("start_conversation", { other_user_id: otherUserId });
  if (error || !data) throw new Error("Could not start a conversation.");
  redirect(`/messages/${data}`);
}

const messageSchema = z.object({
  conversationId: z.uuid(),
  body: z.string().trim().min(1, "Write a message first.").max(4000),
});

export async function sendMessage(formData: FormData) {
  const user = await assertUser();
  const data = messageSchema.parse({
    conversationId: formData.get("conversationId"),
    body: formData.get("body"),
  });
  const supabase = await createClient();
  const { error } = await supabase.from("messages").insert({
    conversation_id: data.conversationId,
    sender_id: user.id,
    body: data.body,
  });
  if (error) throw new Error("Could not send message.");
  revalidatePath(`/messages/${data.conversationId}`);
  revalidatePath("/messages");
}
