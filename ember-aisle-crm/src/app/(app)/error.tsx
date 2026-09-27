"use client";

import { Button } from "@/components/ui";

// Deliberately shows no error details: messages can contain client data.
export default function AppError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <h1 className="text-3xl">Something went wrong</h1>
      <p className="mt-2 text-sm text-ink-soft">
        That didn&rsquo;t load. If you&rsquo;re on patchy signal, try again in a moment.
      </p>
      <Button className="mt-6" onClick={reset}>
        Try again
      </Button>
    </div>
  );
}
