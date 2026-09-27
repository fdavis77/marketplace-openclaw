"use client";

import { useActionState } from "react";
import { login } from "@/actions/auth";
import { SubmitButton } from "@/components/forms";
import { TextField } from "@/components/ui";

export function LoginForm() {
  const [state, action] = useActionState(login, undefined);
  return (
    <form action={action} className="flex flex-col gap-4">
      <TextField label="Email" name="email" type="email" autoComplete="username" required autoFocus />
      <TextField label="Password" name="password" type="password" autoComplete="current-password" required />
      {state?.error && (
        <p role="alert" className="rounded-lg bg-over-wash px-3 py-2 text-sm text-over">
          {state.error}
        </p>
      )}
      <SubmitButton pendingLabel="Signing in…" className="w-full">
        Sign in
      </SubmitButton>
    </form>
  );
}
