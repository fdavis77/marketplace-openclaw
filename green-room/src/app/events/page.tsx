import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/dal";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SaveButton } from "@/components/save-button";
import { formatEventRange } from "@/lib/format";

type SearchParams = { from?: string; to?: string; mode?: string; price?: string };

export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const mode = params.mode ?? "all";
  const price = params.price ?? "all";

  const supabase = await createClient();
  const [profile, eventsQuery] = await Promise.all([
    getCurrentUser(),
    (async () => {
      let query = supabase.from("events").select("*").eq("is_published", true);
      query = query.gte("start_at", params.from ? new Date(params.from).toISOString() : new Date(0).toISOString());
      if (params.to) query = query.lte("start_at", new Date(params.to).toISOString());
      if (mode === "online") query = query.eq("is_online", true);
      if (mode === "in_person") query = query.eq("is_online", false);
      return query.order("start_at", { ascending: true });
    })(),
  ]);

  let events = eventsQuery.data ?? [];
  if (price === "free") {
    events = events.filter((e) => /free|pay what you can/i.test(e.price_note));
  } else if (price === "paid") {
    events = events.filter((e) => !/free|pay what you can/i.test(e.price_note));
  }

  const savedIds = new Set<string>();
  if (profile) {
    const { data: saved } = await supabase
      .from("saved_items")
      .select("item_id")
      .eq("user_id", profile.id)
      .eq("item_type", "event");
    saved?.forEach((s) => savedIds.add(s.item_id));
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <h1 className="font-display text-3xl font-extrabold">Events</h1>
      <p className="mt-2 text-muted">Screenings, workshops, and meetups for the community.</p>

      <form className="mt-8 flex flex-wrap items-end gap-4 rounded-card border border-border bg-surface p-4">
        <div className="flex flex-col gap-1">
          <label htmlFor="from" className="text-xs font-medium text-muted">From</label>
          <input
            id="from"
            type="date"
            name="from"
            defaultValue={params.from}
            className="rounded-lg border border-border bg-surface px-3 py-1.5 text-sm"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="to" className="text-xs font-medium text-muted">To</label>
          <input
            id="to"
            type="date"
            name="to"
            defaultValue={params.to}
            className="rounded-lg border border-border bg-surface px-3 py-1.5 text-sm"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="mode" className="text-xs font-medium text-muted">Format</label>
          <select
            id="mode"
            name="mode"
            defaultValue={mode}
            className="rounded-lg border border-border bg-surface px-3 py-1.5 text-sm"
          >
            <option value="all">All</option>
            <option value="online">Online</option>
            <option value="in_person">In person</option>
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="price" className="text-xs font-medium text-muted">Price</label>
          <select
            id="price"
            name="price"
            defaultValue={price}
            className="rounded-lg border border-border bg-surface px-3 py-1.5 text-sm"
          >
            <option value="all">All</option>
            <option value="free">Free / PWYC</option>
            <option value="paid">Paid</option>
          </select>
        </div>
        <Button type="submit" variant="outline">Apply filters</Button>
      </form>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {events.length ? (
          events.map((event) => (
            <Card key={event.id} className="flex flex-col">
              <CardHeader>
                <Badge>{event.is_online ? "Online" : event.location ?? "In person"}</Badge>
                <CardTitle>{event.title}</CardTitle>
                <CardDescription>{formatEventRange(event.start_at, event.end_at)}</CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                <p className="text-sm">{event.description}</p>
                <p className="mt-3 text-sm font-medium text-accent">{event.price_note}</p>
              </CardContent>
              <CardFooter className="flex items-center justify-between gap-2">
                {event.external_url ? (
                  <Button variant="link" size="sm" asChild className="px-0">
                    <a href={event.external_url} target="_blank" rel="noopener noreferrer">
                      Learn more →
                    </a>
                  </Button>
                ) : <span />}
                {profile ? (
                  <SaveButton
                    itemType="event"
                    itemId={event.id}
                    path="/events"
                    saved={savedIds.has(event.id)}
                  />
                ) : null}
              </CardFooter>
            </Card>
          ))
        ) : (
          <p className="text-muted">No events match those filters yet.</p>
        )}
      </div>
    </div>
  );
}
