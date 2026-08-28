import Link from "next/link";
import { differenceInHours } from "date-fns";
import { Plus, CalendarDays } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/dal";
import { createAudition } from "@/app/actions/auditions";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, selectClass } from "@/components/field";
import { relativeDays } from "@/lib/format";
import type { Tables } from "@/lib/supabase/database.types";

const COLUMNS = [
  { key: "submitted", label: "Submitted" },
  { key: "callback", label: "Callback" },
  { key: "booked", label: "Booked" },
  { key: "passed", label: "Passed" },
  { key: "declined", label: "Declined" },
] as const;

function AuditionCard({ audition, now }: { audition: Tables<"auditions">; now: Date }) {
  const nextDate = audition.self_tape_deadline ?? audition.callback_date ?? audition.audition_date;
  const urgent = Boolean(audition.self_tape_deadline) && differenceInHours(new Date(audition.self_tape_deadline!), now) < 24;
  const booked = audition.status === "booked";

  return (
    <Link href={`/auditions/${audition.id}`}>
      <Card
        className={`gap-2 p-4 transition-shadow hover:shadow-md ${
          urgent ? "bg-[var(--color-neutral-900)] text-background" : booked ? "bg-accent-2 text-accent-2-foreground" : ""
        }`}
      >
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-base font-semibold">{audition.project_name}</span>
          {urgent ? <Badge variant="solid" className="animate-pulse">Today</Badge> : null}
        </div>
        <p className={`text-xs ${urgent || booked ? "opacity-80" : "text-muted"}`}>{audition.role_name}</p>
        {nextDate ? (
          <>
            <div className={`h-px ${urgent || booked ? "bg-white/20" : "bg-border"}`} />
            <p className={`flex items-center gap-1.5 text-xs ${urgent || booked ? "opacity-70" : "text-muted"}`}>
              <CalendarDays className="h-4 w-4" />
              {audition.self_tape_deadline ? "Self-tape due" : audition.callback_date ? "Callback" : "Audition"}
              {" · "}
              {relativeDays(nextDate)}
            </p>
          </>
        ) : null}
      </Card>
    </Link>
  );
}

export default async function AuditionsPage() {
  const user = await requireUser();
  const supabase = await createClient();
  const { data: auditions } = await supabase
    .from("auditions")
    .select("*")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });
  const now = new Date();

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <h1 className="font-display text-3xl">Auditions</h1>
      <p className="mt-2 text-muted">Your pipeline, submitted to booked.</p>

      <details className="mt-8 rounded-card bg-surface p-4">
        <summary className="flex cursor-pointer items-center gap-1.5 font-display">
          <Plus className="h-4 w-4" /> New audition
        </summary>
        <form action={createAudition} className="mt-4 grid gap-3 sm:grid-cols-2">
          <Field label="Project / show"><Input name="projectName" required maxLength={200} /></Field>
          <Field label="Role"><Input name="roleName" required maxLength={200} /></Field>
          <Field label="Casting office"><Input name="castingOffice" maxLength={200} /></Field>
          <Field label="Status">
            <select name="status" defaultValue="submitted" className={selectClass}>
              {COLUMNS.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
            </select>
          </Field>
          <Field label="Audition date"><Input name="auditionDate" type="datetime-local" /></Field>
          <Field label="Callback date"><Input name="callbackDate" type="datetime-local" /></Field>
          <Field label="Sides URL"><Input name="sidesUrl" type="url" /></Field>
          <Field label="Self-tape deadline"><Input name="selfTapeDeadline" type="datetime-local" /></Field>
          <Field label="Notes" full><Textarea name="notes" maxLength={1000} /></Field>
          <Button type="submit" className="sm:col-span-2 self-start">Create audition</Button>
        </form>
      </details>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {COLUMNS.map((col) => {
          const items = (auditions ?? []).filter((a) => a.status === col.key);
          return (
            <div key={col.key}>
              <div className="mb-2 flex items-center justify-between">
                <h2 className="text-sm font-semibold">{col.label}</h2>
                <Badge variant="outline">{items.length}</Badge>
              </div>
              <div className="flex flex-col gap-2">
                {items.map((a) => <AuditionCard key={a.id} audition={a} now={now} />)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
