"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signup, type FormState } from "@/app/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const ROLE_OPTIONS = [
  { value: "writer", label: "Writer", hint: "Track scripts, scenes, and submissions." },
  { value: "director", label: "Director", hint: "Track projects from development to delivery." },
  { value: "producer", label: "Producer", hint: "Track projects, submissions, and deadlines." },
  { value: "editor", label: "Editor", hint: "Track projects through to delivery." },
  { value: "actor", label: "Actor", hint: "Track auditions, sides, and availability." },
] as const;

export default function SignupPage() {
  const [state, action, pending] = useActionState<FormState, FormData>(signup, undefined);

  return (
    <div className="mx-auto flex max-w-md flex-col gap-6 px-4 py-16">
      <div className="text-center">
        <h1 className="font-display text-3xl">Set up your planner</h1>
        <p className="mt-2 text-muted">Free. Takes less than a minute.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Create your account</CardTitle>
          <CardDescription>Pick whichever apply — you can change this anytime.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={action} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="displayName">Name</Label>
              <Input id="displayName" name="displayName" required maxLength={80} autoComplete="name" />
            </div>
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
                minLength={8}
                autoComplete="new-password"
              />
              <p className="text-xs text-muted">At least 8 characters.</p>
            </div>
            <div className="flex flex-col gap-2">
              <Label>You&rsquo;re planning as a…</Label>
              {ROLE_OPTIONS.map((role) => (
                <label
                  key={role.value}
                  className="flex items-start gap-3 rounded-2xl border border-border p-3 text-sm hover:border-accent"
                >
                  <input type="checkbox" name="roles" value={role.value} className="mt-0.5" />
                  <span>
                    <span className="block font-medium">{role.label}</span>
                    <span className="block text-xs text-muted">{role.hint}</span>
                  </span>
                </label>
              ))}
            </div>
            {state?.error ? (
              <p className="text-sm text-red-700" role="alert">
                {state.error}
              </p>
            ) : null}
            <Button type="submit" disabled={pending} className="mt-2">
              {pending ? "Creating account…" : "Create account"}
            </Button>
          </form>
        </CardContent>
      </Card>
      <p className="text-center text-sm text-muted">
        Already set up?{" "}
        <Link href="/login" className="font-medium text-accent hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
