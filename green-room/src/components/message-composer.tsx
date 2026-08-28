"use client";

import { useRef } from "react";
import { sendMessage } from "@/app/actions/network";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export function MessageComposer({ conversationId }: { conversationId: string }) {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      action={async (formData) => {
        await sendMessage(formData);
        formRef.current?.reset();
      }}
      className="flex gap-2"
    >
      <input type="hidden" name="conversationId" value={conversationId} />
      <Textarea name="body" required maxLength={4000} placeholder="Write a message…" className="min-h-12 flex-1" />
      <Button type="submit" className="self-end">Send</Button>
    </form>
  );
}
