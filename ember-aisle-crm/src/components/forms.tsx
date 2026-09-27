"use client";

import { startTransition, useActionState, useEffect, useRef, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import type { ActionResult } from "@/lib/validation";
import { Button, cx } from "./ui";

export function SubmitButton({
  children,
  pendingLabel = "Saving…",
  variant = "primary",
  className,
  pending: pendingProp,
}: {
  children: ReactNode;
  pendingLabel?: string;
  variant?: "primary" | "secondary" | "danger";
  className?: string;
  /** Pass when the form is submitted via ActionForm (which doesn't use a form action). */
  pending?: boolean;
}) {
  const status = useFormStatus();
  const pending = pendingProp ?? status.pending;
  return (
    <Button type="submit" variant={variant} disabled={pending} aria-busy={pending} className={className}>
      {pending ? pendingLabel : children}
    </Button>
  );
}

export function FormMessage({ state }: { state: ActionResult }) {
  if (!state) return null;
  if (state.ok) {
    return state.message ? (
      <p role="status" className="rounded-lg bg-good-wash px-3 py-2 text-sm text-good">
        {state.message}
      </p>
    ) : null;
  }
  return (
    <p role="alert" className="rounded-lg bg-over-wash px-3 py-2 text-sm text-over">
      {state.error}
    </p>
  );
}

type BoundAction = (prev: ActionResult, fd: FormData) => Promise<ActionResult>;

/**
 * A form wired to a server action, with inline errors and an onSuccess hook
 * (used to close inline editors). Children get field errors and pending state.
 *
 * Submits via a transition rather than <form action>, because React resets
 * uncontrolled inputs after a form action — which would wipe what someone
 * typed whenever validation fails.
 */
export function ActionForm({
  action,
  onSuccess,
  resetOnSuccess = false,
  className,
  children,
}: {
  action: BoundAction;
  onSuccess?: () => void;
  resetOnSuccess?: boolean;
  className?: string;
  children: (fieldErrors: Record<string, string>, pending: boolean) => ReactNode;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const formRef = useRef<HTMLFormElement>(null);
  const onSuccessRef = useRef(onSuccess);
  useEffect(() => {
    onSuccessRef.current = onSuccess;
  });

  useEffect(() => {
    if (state?.ok) {
      if (resetOnSuccess) formRef.current?.reset();
      onSuccessRef.current?.();
    } else if (state && !state.ok) {
      // On a phone the problem field is often off-screen: take them to it.
      const bad = formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]');
      bad?.scrollIntoView({ block: "center", behavior: "smooth" });
      bad?.focus({ preventScroll: true });
    }
  }, [state, resetOnSuccess]);

  const fieldErrors = state && !state.ok ? (state.fieldErrors ?? {}) : {};
  return (
    <form
      ref={formRef}
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        startTransition(() => formAction(fd));
      }}
      className={cx("flex flex-col gap-4", className)}
      noValidate
    >
      {children(fieldErrors, pending)}
      <FormMessage state={state} />
    </form>
  );
}
