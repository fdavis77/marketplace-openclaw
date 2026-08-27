"use client";

import { useActionState } from "react";
import { subscribe, type SubscribeState } from "@/app/actions/subscribers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function NewsletterForm() {
  const [state, action, pending] = useActionState<SubscribeState, FormData>(subscribe, undefined);

  if (state?.success) {
    return <p className="text-sm font-medium text-accent">You&rsquo;re on the list — thanks!</p>;
  }

  return (
    <form action={action} className="flex flex-col gap-2 sm:flex-row">
      <Input
        type="email"
        name="email"
        required
        placeholder="you@example.com"
        aria-label="Email address"
        className="sm:w-64"
      />
      <Button type="submit" disabled={pending}>
        {pending ? "Joining…" : "Get the newsletter"}
      </Button>
      {state?.error ? <p className="text-sm text-red-700">{state.error}</p> : null}
    </form>
  );
}
