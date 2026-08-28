"use client";

import { useActionState, useRef } from "react";
import { addMaterial, type MaterialState } from "@/app/actions/materials";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/field";

export function MaterialForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, action, pending] = useActionState<MaterialState, FormData>(
    async (prevState, formData) => {
      const result = await addMaterial(prevState, formData);
      if (!result?.error) formRef.current?.reset();
      return result;
    },
    undefined
  );

  return (
    <form ref={formRef} action={action} className="mt-4 grid gap-3 sm:grid-cols-2">
      <Field label="Type">
        <select name="type" defaultValue="headshot" className="rounded-lg border border-border bg-surface px-3 py-2 text-sm">
          <option value="headshot">Headshot</option>
          <option value="reel">Reel</option>
          <option value="resume">Resume</option>
          <option value="other">Other</option>
        </select>
      </Field>
      <Field label="Label"><Input name="label" required maxLength={200} placeholder="e.g. Headshot v3 — commercial look" /></Field>
      <Field label="Upload a file"><input type="file" name="file" accept="image/png,image/jpeg,image/webp,application/pdf" className="text-sm" /></Field>
      <Field label="…or paste a link (e.g. Vimeo reel)"><Input name="externalUrl" type="url" /></Field>
      {state?.error ? (
        <p className="text-sm text-red-700 sm:col-span-2" role="alert">{state.error}</p>
      ) : null}
      <Button type="submit" disabled={pending} className="sm:col-span-2 self-start">
        {pending ? "Saving…" : "Add material"}
      </Button>
    </form>
  );
}
