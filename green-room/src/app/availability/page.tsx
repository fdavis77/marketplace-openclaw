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
      <h1 className="font-display text-3xl">Availability</h1>
      <p className="mt-2 text-muted">
        You&rsquo;re assumed available by default — mark the date ranges you&rsquo;re not.
      </p>

      <details className="mt-8 rounded-card bg-surface p-4">
        <summary className="cursor-pointer font-display">+ Block dates</summary>
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
                <div>
                  <span className="font-medium">{formatDate(b.start_date)} – {formatDate(b.end_date)}</span>
                  {b.reason ? <span className="text-muted"> — {b.reason}</span> : null}
                </div>
                <form action={deleteAvailabilityBlock}>
                  <input type="hidden" name="id" value={b.id} />
                  <Button type="submit" size="sm" variant="ghost">Remove</Button>
                </form>
              </div>
            ))
          ) : (
            <p className="text-muted">No blocked dates coming up — you&rsquo;re open.</p>
          )}
        </div>
      </section>

      {past.length ? (
        <details className="mt-8">
          <summary className="cursor-pointer text-sm text-muted">Past ({past.length})</summary>
          <div className="mt-3 flex flex-col gap-2">
            {past.map((b) => (
              <div key={b.id} className="flex items-center justify-between rounded-card bg-muted-surface p-3 text-sm text-muted">
                <span>{formatDate(b.start_date)} – {formatDate(b.end_date)}{b.reason ? ` — ${b.reason}` : ""}</span>
                <form action={deleteAvailabilityBlock}>
                  <input type="hidden" name="id" value={b.id} />
                  <Button type="submit" size="sm" variant="ghost">Remove</Button>
                </form>
              </div>
            ))}
          </div>
        </details>
      ) : null}
    </div>
  );
}
