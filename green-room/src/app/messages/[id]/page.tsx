import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/dal";
import { MessageComposer } from "@/components/message-composer";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/format";

export default async function ConversationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  const supabase = await createClient();

  const { data: conversation } = await supabase.from("conversations").select("*").eq("id", id).maybeSingle();
  if (!conversation) notFound();

  const [{ data: participants }, { data: messages }] = await Promise.all([
    supabase
      .from("conversation_participants")
      .select("profile:profiles(id, display_name, meeting_url)")
      .eq("conversation_id", id),
    supabase.from("messages").select("*").eq("conversation_id", id).order("created_at", { ascending: true }),
  ]);

  const other = participants?.map((p) => p.profile).find((p) => p?.id !== user.id);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4 px-4 py-12 sm:px-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <Link href="/messages" className="text-xs font-semibold text-muted">← Messages</Link>
          <h1 className="font-display text-2xl">{other?.display_name ?? "Conversation"}</h1>
        </div>
        {other?.meeting_url ? (
          <Button asChild size="sm" variant="outline">
            <a href={other.meeting_url} target="_blank" rel="noopener noreferrer">Join call</a>
          </Button>
        ) : null}
      </div>

      <div className="flex flex-col gap-2">
        {messages?.map((m) => {
          const mine = m.sender_id === user.id;
          return (
            <div key={m.id} className={`flex flex-col ${mine ? "items-end" : "items-start"}`}>
              <div className={`max-w-[80%] rounded-card px-4 py-2.5 text-sm ${mine ? "bg-accent text-accent-foreground" : "bg-surface"}`}>
                {m.body}
              </div>
              <span className="mt-1 text-[10px] text-muted">{formatDateTime(m.created_at)}</span>
            </div>
          );
        })}
        {!messages?.length ? <p className="text-muted">Say hello.</p> : null}
      </div>

      <MessageComposer conversationId={id} />
    </div>
  );
}
