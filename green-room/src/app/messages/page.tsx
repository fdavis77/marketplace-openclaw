import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/dal";
import { relativeDays } from "@/lib/format";

export default async function MessagesPage() {
  const user = await requireUser();
  const supabase = await createClient();

  const { data: myParticipants } = await supabase
    .from("conversation_participants")
    .select("conversation_id")
    .eq("profile_id", user.id);
  const conversationIds = (myParticipants ?? []).map((p) => p.conversation_id);

  if (!conversationIds.length) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
        <h1 className="flex items-center gap-2 font-display text-3xl">
          <MessageCircle className="h-5 w-5 text-accent" />
          Messages
        </h1>
        <div className="mt-8 flex flex-col items-center gap-2 py-6 text-center">
          <MessageCircle className="h-10 w-10 text-muted" />
          <p className="text-muted">
            No conversations yet. Find someone in the{" "}
            <Link href="/network" className="font-medium text-accent hover:underline">network directory</Link> to start one.
          </p>
        </div>
      </div>
    );
  }

  const [{ data: conversations }, { data: otherParticipants }, { data: allMessages }] = await Promise.all([
    supabase.from("conversations").select("*").in("id", conversationIds).order("last_message_at", { ascending: false }),
    supabase
      .from("conversation_participants")
      .select("conversation_id, profile:profiles(id, display_name, photo_url)")
      .in("conversation_id", conversationIds)
      .neq("profile_id", user.id),
    supabase
      .from("messages")
      .select("conversation_id, body, created_at, sender_id")
      .in("conversation_id", conversationIds)
      .order("created_at", { ascending: false }),
  ]);

  const otherByConversation = new Map((otherParticipants ?? []).map((p) => [p.conversation_id, p.profile]));
  const lastMessageByConversation = new Map<string, { body: string; created_at: string; sender_id: string }>();
  for (const m of allMessages ?? []) {
    if (!lastMessageByConversation.has(m.conversation_id)) lastMessageByConversation.set(m.conversation_id, m);
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <h1 className="flex items-center gap-2 font-display text-3xl">
        <MessageCircle className="h-5 w-5 text-accent" />
        Messages
      </h1>
      <div className="mt-6 flex flex-col gap-2">
        {conversations?.map((c) => {
          const other = otherByConversation.get(c.id);
          const last = lastMessageByConversation.get(c.id);
          return (
            <Link
              key={c.id}
              href={`/messages/${c.id}`}
              className="flex items-center justify-between gap-4 rounded-card bg-surface p-4 hover:bg-[var(--color-neutral-200)]"
            >
              <div>
                <p className="font-medium">{other?.display_name ?? "Unknown"}</p>
                {last ? (
                  <p className="line-clamp-1 text-sm text-muted">
                    {last.sender_id === user.id ? "You: " : ""}
                    {last.body}
                  </p>
                ) : null}
              </div>
              <span className="flex-none text-xs text-muted">{relativeDays(c.last_message_at)}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
