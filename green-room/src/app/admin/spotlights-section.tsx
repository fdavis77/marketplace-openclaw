import { createClient } from "@/lib/supabase/server";
import { createSpotlight, updateSpotlight, deleteSpotlight } from "@/app/actions/admin-content";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Field } from "@/app/admin/field";

export async function SpotlightsSection() {
  const supabase = await createClient();
  const [{ data: spotlights }, { data: profiles }] = await Promise.all([
    supabase.from("spotlights").select("*, profile:profiles(*)").order("published_at", { ascending: false }),
    supabase.from("profiles").select("id, display_name").order("display_name", { ascending: true }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <details className="rounded-card border border-border bg-surface p-4">
        <summary className="cursor-pointer font-display font-semibold">+ Add spotlight</summary>
        <form action={createSpotlight} className="mt-4 grid gap-3">
          <Field label="Member">
            <select name="profileId" required className="rounded-lg border border-border bg-surface px-3 py-2 text-sm">
              {profiles?.map((p) => (
                <option key={p.id} value={p.id}>{p.display_name}</option>
              ))}
            </select>
          </Field>
          <Field label="Headline"><input name="headline" required maxLength={200} className="rounded-lg border border-border bg-surface px-3 py-2 text-sm" /></Field>
          <Field label="Story"><Textarea name="story" maxLength={4000} /></Field>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="isCurrent" /> Make this the current spotlight
          </label>
          <Button type="submit" className="self-start">Create spotlight</Button>
        </form>
      </details>

      <div className="flex flex-col gap-3">
        {spotlights?.map((spotlight) => (
          <div key={spotlight.id} className="rounded-card border border-border bg-surface p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-medium">{spotlight.headline}</p>
                <p className="text-xs text-muted">{spotlight.profile?.display_name}</p>
              </div>
              <div className="flex items-center gap-2">
                {spotlight.is_current ? <Badge>Current</Badge> : null}
                <form action={deleteSpotlight}>
                  <input type="hidden" name="id" value={spotlight.id} />
                  <Button type="submit" size="sm" variant="ghost">Delete</Button>
                </form>
              </div>
            </div>
            <details className="mt-3">
              <summary className="cursor-pointer text-sm text-accent">Edit</summary>
              <form action={updateSpotlight} className="mt-3 grid gap-3">
                <input type="hidden" name="id" value={spotlight.id} />
                <Field label="Member">
                  <select
                    name="profileId"
                    required
                    defaultValue={spotlight.profile_id}
                    className="rounded-lg border border-border bg-surface px-3 py-2 text-sm"
                  >
                    {profiles?.map((p) => (
                      <option key={p.id} value={p.id}>{p.display_name}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Headline">
                  <input
                    name="headline"
                    required
                    defaultValue={spotlight.headline}
                    maxLength={200}
                    className="rounded-lg border border-border bg-surface px-3 py-2 text-sm"
                  />
                </Field>
                <Field label="Story"><Textarea name="story" defaultValue={spotlight.story} maxLength={4000} /></Field>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name="isCurrent" defaultChecked={spotlight.is_current} /> Make this the current spotlight
                </label>
                <Button type="submit" size="sm" className="self-start">Save changes</Button>
              </form>
            </details>
          </div>
        ))}
      </div>
    </div>
  );
}
