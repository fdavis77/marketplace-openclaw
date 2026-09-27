import type { Metadata } from "next";
import { LoginForm } from "./login-form";
import { Wordmark } from "@/components/shell/wordmark";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center px-4">
      <div className="w-full max-w-sm animate-page-in">
        <div className="mb-8 text-center">
          <Wordmark className="text-4xl" />
          <span aria-hidden className="mx-auto mt-4 block h-px w-12 bg-gold" />
          <p className="mt-4 text-sm text-ink-soft">Wedding planning, UK &amp; Mediterranean</p>
        </div>
        <div className="rounded-2xl border border-line bg-card p-6 shadow-sm">
          <LoginForm />
        </div>
      </div>
    </main>
  );
}
