import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/dal";
import { createProject } from "@/app/actions/projects";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "@/components/field";
import { formatDate } from "@/lib/format";

const STAGE_LABELS: Record<string, string> = {
  idea: "Idea",
  outline: "Outline",
  drafting: "Drafting",
  revision: "Revision",
  polish: "Polish",
  locked: "Locked",
  in_production: "In production",
  delivered: "Delivered",
};

export default async function ProjectsPage() {
  const user = await requireUser();
  const supabase = await createClient();
  const { data: projects } = await supabase
    .from("projects")
    .select("*")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <h1 className="font-display text-3xl font-extrabold">Projects</h1>
      <p className="mt-2 text-muted">Every script, from idea to delivered.</p>

      <details className="mt-8 rounded-card border border-border bg-surface p-4">
        <summary className="cursor-pointer font-display font-semibold">+ New project</summary>
        <form action={createProject} className="mt-4 grid gap-3 sm:grid-cols-2">
          <Field label="Title"><Input name="title" required maxLength={200} /></Field>
          <Field label="Format">
            <select name="format" defaultValue="feature" className="rounded-lg border border-border bg-surface px-3 py-2 text-sm">
              <option value="short">Short</option>
              <option value="feature">Feature</option>
              <option value="pilot">Pilot</option>
              <option value="tv_movie">TV movie</option>
              <option value="other">Other</option>
            </select>
          </Field>
          <Field label="Stage">
            <select name="stage" defaultValue="idea" className="rounded-lg border border-border bg-surface px-3 py-2 text-sm">
              {Object.entries(STAGE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </Field>
          <Field label="Target deadline (optional)"><Input name="targetDeadline" type="date" /></Field>
          <Field label="Logline" full><Textarea name="logline" maxLength={500} /></Field>
          <Button type="submit" className="sm:col-span-2 self-start">Create project</Button>
        </form>
      </details>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {projects?.length ? (
          projects.map((project) => (
            <Link key={project.id} href={`/projects/${project.id}`}>
              <Card className="h-full transition-shadow hover:shadow-md">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <Badge variant="outline">{project.format.replace("_", " ")}</Badge>
                    <Badge>{STAGE_LABELS[project.stage]}</Badge>
                  </div>
                  <CardTitle className="text-base">{project.title}</CardTitle>
                  {project.logline ? <CardDescription>{project.logline}</CardDescription> : null}
                </CardHeader>
                {project.target_deadline ? (
                  <CardContent className="text-sm text-muted">
                    Target: {formatDate(project.target_deadline)}
                  </CardContent>
                ) : null}
              </Card>
            </Link>
          ))
        ) : (
          <p className="text-muted">No projects yet — add your first one above.</p>
        )}
      </div>
    </div>
  );
}
