"use client";

import { useState, useTransition } from "react";
import type { ActionResult } from "@/lib/validation";

/** Runs a server action from a button, tracking pending state and errors. */
export function useAction() {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<ActionResult>(undefined);
  const run = (fn: () => Promise<ActionResult>, opts?: { confirm?: string }) => {
    if (opts?.confirm && !window.confirm(opts.confirm)) return;
    setResult(undefined);
    startTransition(async () => {
      setResult(await fn());
    });
  };
  const error = result && !result.ok ? result.error : null;
  const message = result && result.ok ? result.message : null;
  return { run, pending, error, message };
}
