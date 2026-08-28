import { Plus, Trash2, ArrowUpRight, Image as ImageIcon, Video, FileText } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/dal";
import { deleteMaterial } from "@/app/actions/materials";
import { MaterialForm } from "@/components/material-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const TYPE_ICONS: Record<string, typeof ImageIcon> = {
  headshot: ImageIcon,
  reel: Video,
  resume: FileText,
};

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
      <h1 className="font-display text-3xl">Materials</h1>
      <p className="mt-2 text-muted">Headshots, reels, and resume versions — linkable to any audition.</p>

      <details className="mt-8 rounded-card bg-surface p-4">
        <summary className="flex cursor-pointer items-center gap-1.5 font-display">
          <Plus className="h-4 w-4" /> Add material
        </summary>
        <MaterialForm />
      </details>

      {groups.map((type) => {
        const items = (materials ?? []).filter((m) => m.type === type);
        if (!items.length) return null;
        const TypeIcon = TYPE_ICONS[type];
        return (
          <section key={type} className="mt-8">
            <h2 className="flex items-center gap-2 font-display text-xl">
              {TypeIcon ? <TypeIcon className="h-5 w-5 text-accent" /> : null} {TYPE_LABELS[type]}
            </h2>
            <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((m) => (
                <Card key={m.id}>
                  <CardHeader>
                    <Badge variant="outline">{TYPE_LABELS[m.type]}</Badge>
                    <CardTitle className="text-base">{m.label}</CardTitle>
                  </CardHeader>
                  <CardContent className="flex items-center justify-between">
                    <a
                      href={m.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-sm font-medium text-accent hover:underline"
                    >
                      View <ArrowUpRight className="h-4 w-4" />
                    </a>
                    <form action={deleteMaterial}>
                      <input type="hidden" name="id" value={m.id} />
                      <Button type="submit" size="sm" variant="ghost">
                        <Trash2 className="h-4 w-4" /> Delete
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        );
      })}

      {!materials?.length ? (
        <div className="mt-8 flex flex-col items-center gap-3 py-8 text-center text-muted">
          <ImageIcon className="h-10 w-10 text-[var(--color-neutral-400)]" />
          <p>Nothing uploaded yet.</p>
        </div>
      ) : null}
    </div>
  );
}
