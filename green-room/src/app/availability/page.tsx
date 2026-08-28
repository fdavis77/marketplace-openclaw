import { Plus, Trash2, ChevronDown, CalendarDays, CalendarOff } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/dal";
import { addAvailabilityBlock, deleteAvailabilityBlock } from "@/app/actions/availability";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/field";
import { formatDate, isPast } from "@/lib/format";

export default async function AvailabilityPage() {
  const user = await requireUser();
  const supabase = await createClient();
  const { data: blocks } = await supabase
    .from("availability_blocks")
    .select("*")
    .eq("owner_id", user.id)
    .order("start_date", { ascending: true });

  const upcoming = (blocks ?? []).filter((b) => !isPast(b.end_date));
  const past = (blocks ?? []).filter((b) => isPast(b.end_date));

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="flex items-center gap-2 font-display text-3xl">
        <CalendarDays className="h-5 w-5 text-accent" />
        Availability
      </h1>
      <p className="mt-2 text-muted">
        You&rsquo;re assumed available by default — mark the date ranges you&rsquo;re not.
      </p>

      <details className="group mt-8 rounded-card bg-surface p-4">
        <summary className="flex cursor-pointer items-center gap-1.5 font-display">
          <Plus className="h-4 w-4" />
          Block dates
          <ChevronDown className="ml-auto h-4 w-4 text-muted transition-transform group-open:rotate-180" />
        </summary>
        <form action={addAvailabilityBlock} className="mt-4 grid gap-3 sm:grid-cols-3">
          <Field label="From"><Input name="startDate" type="date" required /></Field>
          <Field label="To"><Input name="endDate" type="date" required /></Field>
          <Field label="Reason (optional)"><Input name="reason" maxLength={200} placeholder="Booked, unavailable, etc." /></Field>
          <Button type="submit" className="sm:col-span-3 self-start">Block dates</Button>
        </form>
      </details>

      <section className="mt-8">
        <h2 className="font-display text-xl">Upcoming</h2>
        <div className="mt-3 flex flex-col gap-2">
          {upcoming.length ? (
            upcoming.map((b) => (
              <div key={b.id} className="flex items-center justify-between rounded-card bg-surface p-3 text-sm">
                <div className="flex items-center gap-1.5">
                  <CalendarDays className="h-4 w-4 flex-none text-muted" />
                  <span className="font-medium">{formatDate(b.start_date)} – {formatDate(b.end_date)}</span>
                  {b.reason ? <span className="text-muted"> — {b.reason}</span> : null}
                </div>
                <form action={deleteAvailabilityBlock}>
                  <input type="hidden" name="id" value={b.id} />
                  <Button type="submit" size="sm" variant="ghost">
                    <Trash2 className="h-4 w-4" />
                    Remove
                  </Button>
                </form>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center gap-2 py-6 text-center">
              <CalendarOff className="h-8 w-8 text-muted" />
              <p className="text-muted">No blocked dates coming up — you&rsquo;re open.</p>
            </div>
          )}
        </div>
      </section>

      {past.length ? (
        <details className="group mt-8">
          <summary className="flex cursor-pointer items-center gap-1.5 text-sm text-muted">
            Past ({past.length})
            <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
          </summary>
          <div className="mt-3 flex flex-col gap-2">
            {past.map((b) => (
              <div key={b.id} className="flex items-center justify-between rounded-card bg-muted-surface p-3 text-sm text-muted">
                <span className="flex items-center gap-1.5">
                  <CalendarDays className="h-4 w-4 flex-none" />
                  {formatDate(b.start_date)} – {formatDate(b.end_date)}{b.reason ? ` — ${b.reason}` : ""}
                </span>
                <form action={deleteAvailabilityBlock}>
                  <input type="hidden" name="id" value={b.id} />
                  <Button type="submit" size="sm" variant="ghost">
                    <Trash2 className="h-4 w-4" />
                    Remove
                  </Button>
                </form>
              </div>
            ))}
          </div>
        </details>
      ) : null}
    </div>
  );
}
