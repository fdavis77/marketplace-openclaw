import { subDays } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/dal";
import { upsertGoal, logSession, deleteSession } from "@/app/actions/goals";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "@/components/field";
import { formatDate } from "@/lib/format";

export default async function GoalsPage() {
  const user = await requireUser();
  const supabase = await createClient();

  const [{ data: goal }, { data: sessions }, { data: projects }] = await Promise.all([
    supabase.from("writing_goals").select("*").eq("owner_id", user.id).maybeSingle(),
    supabase
      .from("writing_sessions")
      .select("*, project:projects(title)")
      .eq("owner_id", user.id)
      .order("session_date", { ascending: false })
      .limit(30),
    supabase.from("projects").select("id, title").eq("owner_id", user.id),
  ]);

  const weekAgo = subDays(new Date(), 7);
  const totalThisWeek = (sessions ?? [])
    .filter((s) => new Date(s.session_date) >= weekAgo)
    .reduce((sum, s) => sum + s.amount, 0);

  const streak = computeStreak((sessions ?? []).map((s) => s.session_date));

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="font-display text-3xl font-extrabold">Writing goals</h1>
      <p className="mt-2 text-muted">Set a target, log your sessions, keep the streak alive.</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardDescription>Current streak</CardDescription>
            <CardTitle className="text-2xl">{streak} {streak === 1 ? "day" : "days"}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Last 7 days</CardDescription>
            <CardTitle className="text-2xl">{totalThisWeek}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Target</CardDescription>
            <CardTitle className="text-2xl">
              {goal ? `${goal.target_amount} ${goal.unit}/${goal.cadence === "daily" ? "day" : "week"}` : "Not set"}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <details className="mt-8 rounded-card border border-border bg-surface p-4">
        <summary className="cursor-pointer font-display font-semibold">Set your target</summary>
        <form action={upsertGoal} className="mt-4 grid gap-3 sm:grid-cols-3">
          <Field label="Cadence">
            <select name="cadence" defaultValue={goal?.cadence ?? "daily"} className="rounded-lg border border-border bg-surface px-3 py-2 text-sm">
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
            </select>
          </Field>
          <Field label="Unit">
            <select name="unit" defaultValue={goal?.unit ?? "pages"} className="rounded-lg border border-border bg-surface px-3 py-2 text-sm">
              <option value="pages">Pages</option>
              <option value="words">Words</option>
            </select>
          </Field>
          <Field label="Target amount">
            <Input name="targetAmount" type="number" min={1} required defaultValue={goal?.target_amount ?? 1} />
          </Field>
          <Button type="submit" size="sm" className="sm:col-span-3 self-start">Save target</Button>
        </form>
      </details>

      <details className="mt-4 rounded-card border border-border bg-surface p-4">
        <summary className="cursor-pointer font-display font-semibold">+ Log a session</summary>
        <form action={logSession} className="mt-4 grid gap-3 sm:grid-cols-2">
          <Field label="Date">
            <Input name="sessionDate" type="date" required defaultValue={new Date().toISOString().slice(0, 10)} />
          </Field>
          <Field label="Project (optional)">
            <select name="projectId" className="rounded-lg border border-border bg-surface px-3 py-2 text-sm">
              <option value="">—</option>
              {projects?.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
            </select>
          </Field>
          <Field label="Unit">
            <select name="unit" defaultValue={goal?.unit ?? "pages"} className="rounded-lg border border-border bg-surface px-3 py-2 text-sm">
              <option value="pages">Pages</option>
              <option value="words">Words</option>
            </select>
          </Field>
          <Field label="Amount"><Input name="amount" type="number" min={1} required /></Field>
          <Field label="Notes" full><Textarea name="notes" maxLength={500} /></Field>
          <Button type="submit" size="sm" className="sm:col-span-2 self-start">Log session</Button>
        </form>
      </details>

      <div className="mt-8 flex flex-col gap-2">
        {sessions?.length ? (
          sessions.map((s) => (
            <div key={s.id} className="flex items-center justify-between rounded-card border border-border bg-surface p-3 text-sm">
              <div>
                <span className="font-medium">{formatDate(s.session_date)}</span>{" "}
                <span className="text-muted">
                  — {s.amount} {s.unit}
                  {s.project ? ` · ${s.project.title}` : ""}
                </span>
                {s.notes ? <p className="text-muted">{s.notes}</p> : null}
              </div>
              <form action={deleteSession}>
                <input type="hidden" name="id" value={s.id} />
                <Button type="submit" size="sm" variant="ghost">Delete</Button>
              </form>
            </div>
          ))
        ) : (
          <p className="text-muted">No sessions logged yet.</p>
        )}
      </div>
    </div>
  );
}

function computeStreak(dates: string[]): number {
  const daySet = new Set(dates.map((d) => d.slice(0, 10)));
  let streak = 0;
  const cursor = new Date();
  for (;;) {
    const key = cursor.toISOString().slice(0, 10);
    if (!daySet.has(key)) break;
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}
