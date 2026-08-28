import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/dal";
import { updateAudition, deleteAudition } from "@/app/actions/auditions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, selectClass } from "@/components/field";
import { toLocalInput, relativeDays } from "@/lib/format";

const STATUSES = ["submitted", "callback", "booked", "passed", "declined"] as const;

export default async function AuditionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  const supabase = await createClient();

  const [{ data: audition }, { data: materials }] = await Promise.all([
    supabase.from("auditions").select("*").eq("id", id).eq("owner_id", user.id).maybeSingle(),
    supabase.from("materials").select("*").eq("owner_id", user.id).order("created_at", { ascending: false }),
  ]);
  if (!audition) notFound();

  const headshots = (materials ?? []).filter((m) => m.type === "headshot");
  const resumes = (materials ?? []).filter((m) => m.type === "resume");
  const reels = (materials ?? []).filter((m) => m.type === "reel");

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl">{audition.project_name}</h1>
          <p className="mt-1 text-muted">{audition.role_name}</p>
        </div>
        <form action={deleteAudition}>
          <input type="hidden" name="id" value={audition.id} />
          <Button type="submit" variant="ghost" size="sm">Delete</Button>
        </form>
      </div>

      {audition.self_tape_deadline ? (
        <div className="mt-6 flex items-center justify-between rounded-card bg-[var(--color-neutral-900)] p-5 text-background">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-accent-300)]">
              Self-tape due
            </p>
            <p className="font-display text-2xl">{relativeDays(audition.self_tape_deadline)}</p>
          </div>
        </div>
      ) : null}

      <form action={updateAudition} className="mt-8 grid gap-4 sm:grid-cols-2">
        <input type="hidden" name="id" value={audition.id} />
        <Field label="Project / show"><Input name="projectName" required defaultValue={audition.project_name} maxLength={200} /></Field>
        <Field label="Role"><Input name="roleName" required defaultValue={audition.role_name} maxLength={200} /></Field>
        <Field label="Casting office"><Input name="castingOffice" defaultValue={audition.casting_office ?? ""} maxLength={200} /></Field>
        <Field label="Status">
          <select name="status" defaultValue={audition.status} className={selectClass}>
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </Field>
        <Field label="Audition date">
          <Input name="auditionDate" type="datetime-local" defaultValue={audition.audition_date ? toLocalInput(audition.audition_date) : ""} />
        </Field>
        <Field label="Callback date">
          <Input name="callbackDate" type="datetime-local" defaultValue={audition.callback_date ? toLocalInput(audition.callback_date) : ""} />
        </Field>

        <Field label="Sides URL" full>
          <Input name="sidesUrl" type="url" defaultValue={audition.sides_url ?? ""} placeholder="Link to the sides PDF" />
        </Field>
        <Field label="Self-tape deadline">
          <Input name="selfTapeDeadline" type="datetime-local" defaultValue={audition.self_tape_deadline ? toLocalInput(audition.self_tape_deadline) : ""} />
        </Field>
        <Field label="Self-tape URL">
          <Input name="selfTapeUrl" type="url" defaultValue={audition.self_tape_url ?? ""} placeholder="Link to the recorded take" />
        </Field>
        <Field label="Take notes" full>
          <Textarea name="takeNotes" defaultValue={audition.take_notes ?? ""} maxLength={1000} placeholder="Which take you sent, what to try differently next time…" />
        </Field>

        <Field label="Headshot sent">
          <select name="headshotId" defaultValue={audition.headshot_id ?? ""} className={selectClass}>
            <option value="">—</option>
            {headshots.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
          </select>
        </Field>
        <Field label="Resume sent">
          <select name="resumeId" defaultValue={audition.resume_id ?? ""} className={selectClass}>
            <option value="">—</option>
            {resumes.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
          </select>
        </Field>
        <Field label="Reel sent">
          <select name="reelId" defaultValue={audition.reel_id ?? ""} className={selectClass}>
            <option value="">—</option>
            {reels.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
          </select>
        </Field>

        <Field label="Notes" full>
          <Textarea name="notes" defaultValue={audition.notes ?? ""} maxLength={1000} />
        </Field>

        <Button type="submit" className="sm:col-span-2 self-start">Save changes</Button>
      </form>
    </div>
  );
}
