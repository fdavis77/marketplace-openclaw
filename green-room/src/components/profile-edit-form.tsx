"use client";

import { useActionState } from "react";
import { updateProfile, type ProfileState } from "@/app/actions/profiles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Profile } from "@/lib/dal";

export function ProfileEditForm({ profile }: { profile: Profile }) {
  const [state, action, pending] = useActionState<ProfileState, FormData>(updateProfile, undefined);
  const links = (profile.links ?? {}) as Record<string, string>;

  return (
    <form action={action} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="displayName">Name</Label>
        <Input id="displayName" name="displayName" defaultValue={profile.display_name} required maxLength={80} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="photo">Photo</Label>
        <input id="photo" name="photo" type="file" accept="image/png,image/jpeg,image/webp" className="text-sm" />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="bio">Bio</Label>
        <Textarea id="bio" name="bio" defaultValue={profile.bio ?? ""} maxLength={500} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="location">Location</Label>
        <Input id="location" name="location" defaultValue={profile.location ?? ""} maxLength={120} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="creativeRoles">Creative roles (comma separated)</Label>
        <Input
          id="creativeRoles"
          name="creativeRoles"
          defaultValue={profile.creative_roles?.join(", ") ?? ""}
          placeholder="director, editor, sound"
          maxLength={300}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="reel">Reel URL</Label>
          <Input id="reel" name="reel" type="url" defaultValue={links.reel ?? ""} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="instagram">Instagram URL</Label>
          <Input id="instagram" name="instagram" type="url" defaultValue={links.instagram ?? ""} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="imdb">IMDb URL</Label>
          <Input id="imdb" name="imdb" type="url" defaultValue={links.imdb ?? ""} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="site">Website URL</Label>
          <Input id="site" name="site" type="url" defaultValue={links.site ?? ""} />
        </div>
      </div>
      {state?.error ? (
        <p className="text-sm text-red-700" role="alert">
          {state.error}
        </p>
      ) : null}
      {state?.success ? <p className="text-sm text-accent">Saved.</p> : null}
      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Saving…" : "Save profile"}
      </Button>
    </form>
  );
}
