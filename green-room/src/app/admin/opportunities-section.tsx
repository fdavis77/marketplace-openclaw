import { createClient } from "@/lib/supabase/server";
import {
  createOpportunity,
  updateOpportunity,
  toggleOpportunityPublished,
  deleteOpportunity,
} from "@/app/actions/admin-content";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Field } from "@/app/admin/field";
import { toLocalInput } from "@/lib/format";
import { format } from "date-fns";

export async function OpportunitiesSection() {
  const supabase = await createClient();
  const { data: opportunities } = await supabase
    .from("opportunities")
    .select("*")
    .order("deadline_at", { ascending: false });

  return (
    <div className="flex flex-col gap-6">
      <details className="rounded-card border border-border bg-surface p-4">
        <summary className="cursor-pointer font-display font-semibold">+ Add opportunity</summary>
        <form action={createOpportunity} className="mt-4 grid gap-3 sm:grid-cols-2">
          <Field label="Title"><Input name="title" required maxLength={200} /></Field>
          <Field label="Organizer"><Input name="organizer" required maxLength={200} /></Field>
          <Field label="Category"><Input name="category" required maxLength={80} /></Field>
          <Field label="Deadline"><Input name="deadlineAt" type="datetime-local" required /></Field>
          <Field label="External URL" full><Input name="externalUrl" type="url" /></Field>
          <Field label="Description" full><Textarea name="description" maxLength={4000} /></Field>
          <Button type="submit" className="sm:col-span-2 self-start">Create opportunity</Button>
        </form>
      </details>

      <div className="flex flex-col gap-3">
        {opportunities?.map((opp) => (
          <div key={opp.id} className="rounded-card border border-border bg-surface p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-medium">{opp.title}</p>
                <p className="text-xs text-muted">
                  {opp.organizer} · deadline {format(new Date(opp.deadline_at), "d MMM yyyy HH:mm")}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={opp.is_published ? "default" : "outline"}>
                  {opp.is_published ? "Published" : "Draft"}
                </Badge>
                <form action={toggleOpportunityPublished}>
                  <input type="hidden" name="id" value={opp.id} />
                  <input type="hidden" name="published" value={(!opp.is_published).toString()} />
                  <Button type="submit" size="sm" variant="outline">
                    {opp.is_published ? "Unpublish" : "Publish"}
                  </Button>
                </form>
                <form action={deleteOpportunity}>
                  <input type="hidden" name="id" value={opp.id} />
                  <Button type="submit" size="sm" variant="ghost">Delete</Button>
                </form>
              </div>
            </div>
            <details className="mt-3">
              <summary className="cursor-pointer text-sm text-accent">Edit</summary>
              <form action={updateOpportunity} className="mt-3 grid gap-3 sm:grid-cols-2">
                <input type="hidden" name="id" value={opp.id} />
                <Field label="Title"><Input name="title" required defaultValue={opp.title} maxLength={200} /></Field>
                <Field label="Organizer"><Input name="organizer" required defaultValue={opp.organizer} maxLength={200} /></Field>
                <Field label="Category"><Input name="category" required defaultValue={opp.category} maxLength={80} /></Field>
                <Field label="Deadline">
                  <Input name="deadlineAt" type="datetime-local" required defaultValue={toLocalInput(opp.deadline_at)} />
                </Field>
                <Field label="External URL" full><Input name="externalUrl" type="url" defaultValue={opp.external_url ?? ""} /></Field>
                <Field label="Description" full><Textarea name="description" defaultValue={opp.description} maxLength={4000} /></Field>
                <Button type="submit" size="sm" className="sm:col-span-2 self-start">Save changes</Button>
              </form>
            </details>
          </div>
        ))}
      </div>
    </div>
  );
}
