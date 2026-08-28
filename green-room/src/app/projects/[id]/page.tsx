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
import { startChallenge, toggleMilestone } from "@/app/actions/challenge";
import { generateBeatSheet, toggleBeat } from "@/app/actions/beats";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Field, selectClass } from "@/components/field";
import { formatDate, toDateInput, relativeDays } from "@/lib/format";

const STAGES = ["idea", "outline", "drafting", "revision", "polish", "locked", "in_production", "delivered"] as const;
const SCENE_STATUSES = ["needs_work", "drafted", "revised", "locked"] as const;
const SUBMISSION_STATUSES = ["submitted", "pending", "rejected", "accepted"] as const;
const SUBMISSION_TYPES = ["competition", "festival", "agent", "producer", "other"] as const;

const sceneBadge: Record<string, "outline" | "default" | "accent2" | "solid2"> = {
  needs_work: "default",
  drafted: "outline",
  revised: "accent2",
  locked: "solid2",
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

  const [{ data: scenes }, { data: submissions }, { data: milestones }, { data: beats }] = await Promise.all([
    supabase.from("scenes").select("*").eq("project_id", id).order("scene_number", { ascending: true }),
    supabase.from("submissions").select("*").eq("project_id", id).order("submitted_at", { ascending: false }),
    supabase.from("challenge_milestones").select("*").eq("project_id", id).order("day_number", { ascending: true }),
    supabase.from("story_beats").select("*").eq("project_id", id).order("position", { ascending: true }),
  ]);

  const now = new Date();
  const challengeDay = project.challenge_started_at
    ? Math.min(
        90,
        Math.max(1, Math.floor((now.getTime() - new Date(project.challenge_started_at).getTime()) / 86400000) + 1)
      )
    : null;
  const milestonesDone = (milestones ?? []).filter((m) => m.is_done).length;

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl">{project.title}</h1>
          {project.logline ? <p className="mt-2 max-w-xl text-muted">{project.logline}</p> : null}
        </div>
        <form action={deleteProject}>
          <input type="hidden" name="id" value={project.id} />
          <Button type="submit" variant="ghost" size="sm">Delete project</Button>
        </form>
      </div>

      <details className="mt-6 rounded-card bg-surface p-4">
        <summary className="cursor-pointer text-sm font-medium text-accent">Edit project details</summary>
        <form action={updateProject} className="mt-4 grid gap-3 sm:grid-cols-2">
          <input type="hidden" name="id" value={project.id} />
          <Field label="Title"><Input name="title" required defaultValue={project.title} maxLength={200} /></Field>
          <Field label="Format">
            <select name="format" defaultValue={project.format} className={selectClass}>
              <option value="short">Short</option>
              <option value="feature">Feature</option>
              <option value="pilot">Pilot</option>
              <option value="tv_movie">TV movie</option>
              <option value="other">Other</option>
            </select>
          </Field>
          <Field label="Stage">
            <select name="stage" defaultValue={project.stage} className={selectClass}>
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
          <h2 className="font-display text-xl">90-day challenge</h2>
          {challengeDay ? (
            <Badge variant="accent2">Day {challengeDay} of 90</Badge>
          ) : null}
        </div>

        {!project.challenge_started_at ? (
          <div className="mt-3 flex items-center justify-between gap-4 rounded-card bg-surface p-4">
            <p className="text-sm text-muted">
              Start a guided, phase-by-phase plan to take this project from idea to a finished short
              film in 90 days.
            </p>
            <form action={startChallenge}>
              <input type="hidden" name="projectId" value={project.id} />
              <Button type="submit" size="sm">Start the challenge</Button>
            </form>
          </div>
        ) : (
          <div className="mt-3 flex flex-col gap-4">
            <div className="flex h-2 gap-0.5 overflow-hidden rounded-full bg-[var(--color-neutral-300)]">
              <div
                className="h-full bg-accent-2"
                style={{ width: `${(milestonesDone / Math.max(1, milestones?.length ?? 1)) * 100}%` }}
              />
            </div>
            <div className="flex flex-col gap-2">
              {milestones?.map((m) => (
                <form key={m.id} action={toggleMilestone} className="flex items-center gap-3 rounded-card bg-surface p-3">
                  <input type="hidden" name="id" value={m.id} />
                  <input type="hidden" name="projectId" value={project.id} />
                  <input type="hidden" name="isDone" value={(!m.is_done).toString()} />
                  <button
                    type="submit"
                    aria-label={m.is_done ? "Mark not done" : "Mark done"}
                    className={`grid h-6 w-6 flex-none place-items-center rounded-full text-xs font-bold ${
                      m.is_done ? "bg-accent-2 text-accent-2-foreground" : "border-2 border-dashed border-[var(--color-neutral-400)]"
                    }`}
                  >
                    {m.is_done ? "✓" : ""}
                  </button>
                  <div className="flex flex-1 flex-col">
                    <span className={`text-sm font-medium ${m.is_done ? "text-muted line-through" : ""}`}>{m.title}</span>
                    <span className="text-xs text-muted">Day {m.day_number} · {m.phase}{m.description ? ` — ${m.description}` : ""}</span>
                  </div>
                </form>
              ))}
            </div>
          </div>
        )}
      </section>

      <section className="mt-10">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl">Screenwriting beat sheet</h2>
          <Badge variant="outline">{beats?.length ?? 0}</Badge>
        </div>

        {!beats?.length ? (
          <div className="mt-3 flex items-center justify-between gap-4 rounded-card bg-surface p-4">
            <p className="text-sm text-muted">Generate a starter beat sheet to plan your structure.</p>
            <form action={generateBeatSheet}>
              <input type="hidden" name="projectId" value={project.id} />
              <Button type="submit" size="sm">Generate beat sheet</Button>
            </form>
          </div>
        ) : (
          <div className="mt-3 flex flex-col gap-2">
            {beats.map((beat) => (
              <form key={beat.id} action={toggleBeat} className="flex items-start gap-3 rounded-card bg-surface p-3">
                <input type="hidden" name="id" value={beat.id} />
                <input type="hidden" name="projectId" value={project.id} />
                <input type="hidden" name="isDone" value={(!beat.is_done).toString()} />
                <button
                  type="submit"
                  aria-label={beat.is_done ? "Mark not done" : "Mark done"}
                  className={`mt-0.5 grid h-6 w-6 flex-none place-items-center rounded-full text-xs font-bold ${
                    beat.is_done ? "bg-accent-2 text-accent-2-foreground" : "border-2 border-dashed border-[var(--color-neutral-400)]"
                  }`}
                >
                  {beat.is_done ? "✓" : ""}
                </button>
                <div className="flex flex-1 flex-col">
                  <span className={`text-sm font-medium ${beat.is_done ? "text-muted line-through" : ""}`}>{beat.title}</span>
                  {beat.description ? <span className="text-xs text-muted">{beat.description}</span> : null}
                </div>
              </form>
            ))}
          </div>
        )}
      </section>

      <section className="mt-10">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl">Scenes</h2>
          <Badge variant="outline">{scenes?.length ?? 0}</Badge>
        </div>
        <details className="mt-3 rounded-card bg-surface p-4">
          <summary className="cursor-pointer text-sm font-medium text-accent">+ Add scene</summary>
          <form action={createScene} className="mt-3 grid gap-3 sm:grid-cols-[80px_1fr_140px]">
            <input type="hidden" name="projectId" value={project.id} />
            <Field label="#"><Input name="sceneNumber" type="number" min={1} required defaultValue={(scenes?.length ?? 0) + 1} /></Field>
            <Field label="Heading"><Input name="heading" placeholder="INT. LOCATION - DAY" maxLength={200} /></Field>
            <Field label="Status">
              <select name="status" defaultValue="needs_work" className={selectClass}>
                {SCENE_STATUSES.map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
              </select>
            </Field>
            <Field label="Notes" full><Textarea name="notes" maxLength={2000} /></Field>
            <Button type="submit" size="sm" className="sm:col-span-3 self-start">Add scene</Button>
          </form>
        </details>

        <div className="mt-4 flex flex-col gap-2">
          {scenes?.map((scene) => (
            <details key={scene.id} className="rounded-card bg-surface p-3">
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
                <select name="status" defaultValue={scene.status} className={selectClass}>
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
          <h2 className="font-display text-xl">Submissions</h2>
          <Badge variant="outline">{submissions?.length ?? 0}</Badge>
        </div>
        <details className="mt-3 rounded-card bg-surface p-4">
          <summary className="cursor-pointer text-sm font-medium text-accent">+ Add submission</summary>
          <form action={createSubmission} className="mt-3 grid gap-3 sm:grid-cols-2">
            <input type="hidden" name="projectId" value={project.id} />
            <Field label="Where"><Input name="targetName" required maxLength={200} placeholder="Competition, agent, or producer" /></Field>
            <Field label="Type">
              <select name="targetType" defaultValue="other" className={selectClass}>
                {SUBMISSION_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </Field>
            <Field label="Submitted"><Input name="submittedAt" type="date" required defaultValue={new Date().toISOString().slice(0, 10)} /></Field>
            <Field label="Response due (optional)"><Input name="responseDueAt" type="date" /></Field>
            <Field label="Status">
              <select name="status" defaultValue="submitted" className={selectClass}>
                {SUBMISSION_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>
            <Field label="Notes" full><Textarea name="notes" maxLength={2000} /></Field>
            <Button type="submit" size="sm" className="sm:col-span-2 self-start">Add submission</Button>
          </form>
        </details>

        <div className="mt-4 flex flex-col gap-2">
          {submissions?.map((sub) => (
            <details key={sub.id} className="rounded-card bg-surface p-3">
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
                <select name="targetType" defaultValue={sub.target_type} className={selectClass}>
                  {SUBMISSION_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
                <Input name="submittedAt" type="date" required defaultValue={toDateInput(sub.submitted_at)} />
                <Input name="responseDueAt" type="date" defaultValue={sub.response_due_at ? toDateInput(sub.response_due_at) : ""} />
                <select name="status" defaultValue={sub.status} className={selectClass}>
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
