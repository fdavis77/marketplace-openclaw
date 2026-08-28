"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { login, sendMagicLink, type FormState } from "@/app/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function LoginPage() {
  const [mode, setMode] = useState<"password" | "magic">("password");
  const [passwordState, passwordAction, passwordPending] = useActionState<FormState, FormData>(
    login,
    undefined
  );
  const [magicState, magicAction, magicPending] = useActionState<FormState, FormData>(
    sendMagicLink,
    undefined
  );

  return (
    <div className="mx-auto flex max-w-md flex-col gap-6 px-4 py-16">
      <div className="text-center">
        <h1 className="font-display text-3xl">Welcome back</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Sign in</CardTitle>
          <CardDescription>
            {mode === "password" ? "Use your email and password." : "We'll email you a sign-in link."}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {mode === "password" ? (
            <form action={passwordAction} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" required autoComplete="email" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                  autoComplete="current-password"
                />
              </div>
              {passwordState?.error ? (
                <p className="text-sm text-red-700" role="alert">
                  {passwordState.error}
                </p>
              ) : null}
              <Button type="submit" disabled={passwordPending}>
                {passwordPending ? "Signing in…" : "Sign in"}
              </Button>
            </form>
          ) : (
            <form action={magicAction} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="magic-email">Email</Label>
                <Input id="magic-email" name="email" type="email" required autoComplete="email" />
              </div>
              {magicState?.error ? (
                <p className="text-sm text-red-700" role="alert">
                  {magicState.error}
                </p>
              ) : null}
              {magicState?.sent ? (
                <p className="text-sm text-green-700" role="status">
                  Check your inbox for a sign-in link.
                </p>
              ) : null}
              <Button type="submit" disabled={magicPending}>
                {magicPending ? "Sending…" : "Send magic link"}
              </Button>
            </form>
          )}

          <button
            type="button"
            onClick={() => setMode(mode === "password" ? "magic" : "password")}
            className="text-sm font-medium text-accent hover:underline"
          >
            {mode === "password" ? "Sign in with a magic link instead" : "Sign in with a password instead"}
          </button>
        </CardContent>
      </Card>
      <p className="text-center text-sm text-muted">
        New here?{" "}
        <Link href="/signup" className="font-medium text-accent hover:underline">
          Join free
        </Link>
      </p>
    </div>
  );
}
