import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/dal";
import { deleteMaterial } from "@/app/actions/materials";
import { MaterialForm } from "@/components/material-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const TYPE_LABELS: Record<string, string> = {
  headshot: "Headshots",
  reel: "Reels",
  resume: "Resumes",
  other: "Other",
};

export default async function MaterialsPage() {
  const user = await requireUser();
  const supabase = await createClient();
  const { data: materials } = await supabase
    .from("materials")
    .select("*")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });

  const groups = ["headshot", "reel", "resume", "other"] as const;

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <h1 className="font-display text-3xl font-extrabold">Materials</h1>
      <p className="mt-2 text-muted">Headshots, reels, and resume versions — linkable to any audition.</p>

      <details className="mt-8 rounded-card border border-border bg-surface p-4">
        <summary className="cursor-pointer font-display font-semibold">+ Add material</summary>
        <MaterialForm />
      </details>

      {groups.map((type) => {
        const items = (materials ?? []).filter((m) => m.type === type);
        if (!items.length) return null;
        return (
          <section key={type} className="mt-8">
            <h2 className="font-display text-xl font-bold">{TYPE_LABELS[type]}</h2>
            <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((m) => (
                <Card key={m.id}>
                  <CardHeader>
                    <Badge variant="outline">{TYPE_LABELS[m.type]}</Badge>
                    <CardTitle className="text-base">{m.label}</CardTitle>
                  </CardHeader>
                  <CardContent className="flex items-center justify-between">
                    <a href={m.url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-accent hover:underline">
                      View →
                    </a>
                    <form action={deleteMaterial}>
                      <input type="hidden" name="id" value={m.id} />
                      <Button type="submit" size="sm" variant="ghost">Delete</Button>
                    </form>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        );
      })}

      {!materials?.length ? <p className="mt-8 text-muted">Nothing uploaded yet.</p> : null}
    </div>
  );
}
