import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/dal";
import {
  updateProject,
  deleteProject,
  createScene,
  updateScene,
  deleteScene,
  createSubmission,
  updateSubmission,
  deleteSubmission,
} from "@/app/actions/projects";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Field } from "@/components/field";
import { formatDate, toDateInput, relativeDays } from "@/lib/format";

const STAGES = ["idea", "outline", "drafting", "revision", "polish", "locked", "in_production", "delivered"] as const;
const SCENE_STATUSES = ["needs_work", "drafted", "revised", "locked"] as const;
const SUBMISSION_STATUSES = ["submitted", "pending", "rejected", "accepted"] as const;
const SUBMISSION_TYPES = ["competition", "festival", "agent", "producer", "other"] as const;

const sceneBadge: Record<string, "outline" | "default" | "solid" | "warning"> = {
  needs_work: "warning",
  drafted: "outline",
  revised: "default",
  locked: "solid",
};

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  const supabase = await createClient();

  const { data: project } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .eq("owner_id", user.id)
    .maybeSingle();
  if (!project) notFound();

  const [{ data: scenes }, { data: submissions }] = await Promise.all([
    supabase.from("scenes").select("*").eq("project_id", id).order("scene_number", { ascending: true }),
    supabase.from("submissions").select("*").eq("project_id", id).order("submitted_at", { ascending: false }),
  ]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-extrabold">{project.title}</h1>
          {project.logline ? <p className="mt-2 max-w-xl text-muted">{project.logline}</p> : null}
        </div>
        <form action={deleteProject}>
          <input type="hidden" name="id" value={project.id} />
          <Button type="submit" variant="ghost" size="sm">Delete project</Button>
        </form>
      </div>

      <details className="mt-6 rounded-card border border-border bg-surface p-4">
        <summary className="cursor-pointer text-sm font-medium text-accent">Edit project details</summary>
        <form action={updateProject} className="mt-4 grid gap-3 sm:grid-cols-2">
          <input type="hidden" name="id" value={project.id} />
          <Field label="Title"><Input name="title" required defaultValue={project.title} maxLength={200} /></Field>
          <Field label="Format">
            <select name="format" defaultValue={project.format} className="rounded-lg border border-border bg-surface px-3 py-2 text-sm">
              <option value="short">Short</option>
              <option value="feature">Feature</option>
              <option value="pilot">Pilot</option>
              <option value="tv_movie">TV movie</option>
              <option value="other">Other</option>
            </select>
          </Field>
          <Field label="Stage">
            <select name="stage" defaultValue={project.stage} className="rounded-lg border border-border bg-surface px-3 py-2 text-sm">
              {STAGES.map((s) => (
                <option key={s} value={s}>{s.replace("_", " ")}</option>
              ))}
            </select>
          </Field>
          <Field label="Target deadline">
            <Input name="targetDeadline" type="date" defaultValue={project.target_deadline ? toDateInput(project.target_deadline) : ""} />
          </Field>
          <Field label="Logline" full><Textarea name="logline" defaultValue={project.logline ?? ""} maxLength={500} /></Field>
          <Button type="submit" size="sm" className="sm:col-span-2 self-start">Save changes</Button>
        </form>
      </details>

      <section className="mt-10">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-bold">Scenes</h2>
          <Badge variant="outline">{scenes?.length ?? 0}</Badge>
        </div>
        <details className="mt-3 rounded-card border border-border bg-surface p-4">
          <summary className="cursor-pointer text-sm font-medium text-accent">+ Add scene</summary>
          <form action={createScene} className="mt-3 grid gap-3 sm:grid-cols-[80px_1fr_140px]">
            <input type="hidden" name="projectId" value={project.id} />
            <Field label="#"><Input name="sceneNumber" type="number" min={1} required defaultValue={(scenes?.length ?? 0) + 1} /></Field>
            <Field label="Heading"><Input name="heading" placeholder="INT. LOCATION - DAY" maxLength={200} /></Field>
            <Field label="Status">
              <select name="status" defaultValue="needs_work" className="rounded-lg border border-border bg-surface px-3 py-2 text-sm">
                {SCENE_STATUSES.map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
              </select>
            </Field>
            <Field label="Notes" full><Textarea name="notes" maxLength={2000} /></Field>
            <Button type="submit" size="sm" className="sm:col-span-3 self-start">Add scene</Button>
          </form>
        </details>

        <div className="mt-4 flex flex-col gap-2">
          {scenes?.map((scene) => (
            <details key={scene.id} className="rounded-card border border-border bg-surface p-3">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-2">
                <span className="text-sm">
                  <span className="font-mono text-muted">#{scene.scene_number}</span>{" "}
                  <span className="font-medium">{scene.heading || "Untitled scene"}</span>
                </span>
                <Badge variant={sceneBadge[scene.status]}>{scene.status.replace("_", " ")}</Badge>
              </summary>
              {scene.notes ? <p className="mt-2 text-sm text-muted">{scene.notes}</p> : null}
              <form action={updateScene} className="mt-3 grid gap-2 sm:grid-cols-[80px_1fr_140px]">
                <input type="hidden" name="id" value={scene.id} />
                <input type="hidden" name="projectId" value={project.id} />
                <Input name="sceneNumber" type="number" min={1} required defaultValue={scene.scene_number} />
                <Input name="heading" defaultValue={scene.heading} maxLength={200} />
                <select name="status" defaultValue={scene.status} className="rounded-lg border border-border bg-surface px-3 py-2 text-sm">
                  {SCENE_STATUSES.map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
                </select>
                <Textarea name="notes" defaultValue={scene.notes ?? ""} maxLength={2000} className="sm:col-span-3" />
                <div className="flex gap-2 sm:col-span-3">
                  <Button type="submit" size="sm">Save</Button>
                </div>
              </form>
              <form action={deleteScene} className="mt-2">
                <input type="hidden" name="id" value={scene.id} />
                <input type="hidden" name="projectId" value={project.id} />
                <Button type="submit" size="sm" variant="ghost">Delete scene</Button>
              </form>
            </details>
          ))}
        </div>
      </section>

      <section className="mt-10">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-bold">Submissions</h2>
          <Badge variant="outline">{submissions?.length ?? 0}</Badge>
        </div>
        <details className="mt-3 rounded-card border border-border bg-surface p-4">
          <summary className="cursor-pointer text-sm font-medium text-accent">+ Add submission</summary>
          <form action={createSubmission} className="mt-3 grid gap-3 sm:grid-cols-2">
            <input type="hidden" name="projectId" value={project.id} />
            <Field label="Where"><Input name="targetName" required maxLength={200} placeholder="Competition, agent, or producer" /></Field>
            <Field label="Type">
              <select name="targetType" defaultValue="other" className="rounded-lg border border-border bg-surface px-3 py-2 text-sm">
                {SUBMISSION_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </Field>
            <Field label="Submitted"><Input name="submittedAt" type="date" required defaultValue={new Date().toISOString().slice(0, 10)} /></Field>
            <Field label="Response due (optional)"><Input name="responseDueAt" type="date" /></Field>
            <Field label="Status">
              <select name="status" defaultValue="submitted" className="rounded-lg border border-border bg-surface px-3 py-2 text-sm">
                {SUBMISSION_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>
            <Field label="Notes" full><Textarea name="notes" maxLength={2000} /></Field>
            <Button type="submit" size="sm" className="sm:col-span-2 self-start">Add submission</Button>
          </form>
        </details>

        <div className="mt-4 flex flex-col gap-2">
          {submissions?.map((sub) => (
            <details key={sub.id} className="rounded-card border border-border bg-surface p-3">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-2">
                <span className="text-sm font-medium">{sub.target_name}</span>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{sub.target_type}</Badge>
                  <Badge variant={sub.status === "accepted" ? "default" : sub.status === "rejected" ? "warning" : "outline"}>
                    {sub.status}
                  </Badge>
                </div>
              </summary>
              <p className="mt-2 text-xs text-muted">
                Submitted {formatDate(sub.submitted_at)}
                {sub.response_due_at ? ` · Response due ${formatDate(sub.response_due_at)} (${relativeDays(sub.response_due_at)})` : ""}
              </p>
              {sub.notes ? <p className="mt-1 text-sm">{sub.notes}</p> : null}
              <form action={updateSubmission} className="mt-3 grid gap-2 sm:grid-cols-2">
                <input type="hidden" name="id" value={sub.id} />
                <input type="hidden" name="projectId" value={project.id} />
                <Input name="targetName" required defaultValue={sub.target_name} maxLength={200} />
                <select name="targetType" defaultValue={sub.target_type} className="rounded-lg border border-border bg-surface px-3 py-2 text-sm">
                  {SUBMISSION_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
                <Input name="submittedAt" type="date" required defaultValue={toDateInput(sub.submitted_at)} />
                <Input name="responseDueAt" type="date" defaultValue={sub.response_due_at ? toDateInput(sub.response_due_at) : ""} />
                <select name="status" defaultValue={sub.status} className="rounded-lg border border-border bg-surface px-3 py-2 text-sm">
                  {SUBMISSION_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                <Textarea name="notes" defaultValue={sub.notes ?? ""} maxLength={2000} className="sm:col-span-2" />
                <Button type="submit" size="sm" className="sm:col-span-2 self-start">Save</Button>
              </form>
              <form action={deleteSubmission} className="mt-2">
                <input type="hidden" name="id" value={sub.id} />
                <input type="hidden" name="projectId" value={project.id} />
                <Button type="submit" size="sm" variant="ghost">Delete submission</Button>
              </form>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}
