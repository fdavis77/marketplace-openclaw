"use client";

import { useActionState } from "react";
import { updateAccount, type AccountState } from "@/app/actions/account";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "@/components/field";
import type { Profile } from "@/lib/dal";
import { ROLE_OPTIONS } from "@/lib/roles";

export function AccountForm({ profile }: { profile: Profile }) {
  const [state, action, pending] = useActionState<AccountState, FormData>(updateAccount, undefined);
  const links = (profile.links ?? {}) as Record<string, string>;

  return (
    <form action={action} className="flex flex-col gap-4">
      <Field label="Name"><Input name="displayName" defaultValue={profile.display_name} required maxLength={80} /></Field>
      <Field label="Photo">
        <input type="file" name="photo" accept="image/png,image/jpeg,image/webp" className="text-sm" />
      </Field>
      <Field label="Bio"><Textarea name="bio" defaultValue={profile.bio ?? ""} maxLength={500} /></Field>
      <Field label="Location"><Input name="location" defaultValue={profile.location ?? ""} maxLength={120} /></Field>

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium">You&rsquo;re planning as a…</span>
        {ROLE_OPTIONS.map((role) => (
          <label key={role.value} className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="roles"
              value={role.value}
              defaultChecked={profile.creative_roles?.includes(role.value)}
            />
            {role.label}
          </label>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="IMDb URL"><Input name="imdb" type="url" defaultValue={links.imdb ?? ""} /></Field>
        <Field label="Instagram URL"><Input name="instagram" type="url" defaultValue={links.instagram ?? ""} /></Field>
        <Field label="Website URL"><Input name="site" type="url" defaultValue={links.site ?? ""} /></Field>
      </div>

      <div className="flex flex-col gap-3 rounded-card bg-surface p-4">
        <label className="flex items-center gap-2 text-sm font-medium">
          <input type="checkbox" name="isPublic" defaultChecked={profile.is_public} />
          List me in the industry network directory
        </label>
        <p className="text-xs text-muted">
          Other members can find you by role and message you. Your projects, goals, and auditions
          always stay private either way.
        </p>
        <Field label="Meeting link (Zoom, Google Meet, etc.)">
          <Input name="meetingUrl" type="url" defaultValue={profile.meeting_url ?? ""} placeholder="https://zoom.us/j/…" />
        </Field>
      </div>

      {state?.error ? (
        <p className="text-sm text-red-700" role="alert">{state.error}</p>
      ) : null}
      {state?.success ? <p className="text-sm text-accent">Saved.</p> : null}
      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Saving…" : "Save account"}
      </Button>
    </form>
  );
}
