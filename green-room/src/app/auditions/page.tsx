import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/dal";
import { createAudition } from "@/app/actions/auditions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "@/components/field";
import { relativeDays } from "@/lib/format";
import type { Tables } from "@/lib/supabase/database.types";

const COLUMNS = [
  { key: "submitted", label: "Submitted" },
  { key: "callback", label: "Callback" },
  { key: "booked", label: "Booked" },
  { key: "passed", label: "Passed" },
  { key: "declined", label: "Declined" },
] as const;

function AuditionCard({ audition }: { audition: Tables<"auditions"> }) {
  const nextDate = audition.self_tape_deadline ?? audition.callback_date ?? audition.audition_date;
  return (
    <Link href={`/auditions/${audition.id}`}>
      <Card className="transition-shadow hover:shadow-md">
        <CardHeader>
          <CardTitle className="text-sm">{audition.project_name}</CardTitle>
          <p className="text-xs text-muted">{audition.role_name}</p>
        </CardHeader>
        {nextDate ? (
          <CardContent className="text-xs text-muted">
            {audition.self_tape_deadline ? "Self-tape due" : audition.callback_date ? "Callback" : "Audition"}
            {" · "}
            {relativeDays(nextDate)}
          </CardContent>
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

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <h1 className="font-display text-3xl font-extrabold">Auditions</h1>
      <p className="mt-2 text-muted">Your pipeline, submitted to booked.</p>

      <details className="mt-8 rounded-card border border-border bg-surface p-4">
        <summary className="cursor-pointer font-display font-semibold">+ New audition</summary>
        <form action={createAudition} className="mt-4 grid gap-3 sm:grid-cols-2">
          <Field label="Project / show"><Input name="projectName" required maxLength={200} /></Field>
          <Field label="Role"><Input name="roleName" required maxLength={200} /></Field>
          <Field label="Casting office"><Input name="castingOffice" maxLength={200} /></Field>
          <Field label="Status">
            <select name="status" defaultValue="submitted" className="rounded-lg border border-border bg-surface px-3 py-2 text-sm">
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
                {items.map((a) => <AuditionCard key={a.id} audition={a} />)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
