import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { NewsletterForm } from "@/components/newsletter-form";
import { formatEventRange, formatDeadline } from "@/lib/format";

export default async function HomePage() {
  const supabase = await createClient();

  const [{ data: events }, { data: opportunities }] = await Promise.all([
    supabase
      .from("events")
      .select("*")
      .eq("is_published", true)
      .gte("start_at", new Date().toISOString())
      .order("start_at", { ascending: true })
      .limit(4),
    supabase
      .from("opportunities")
      .select("*")
      .eq("is_published", true)
      .gte("deadline_at", new Date().toISOString())
      .order("deadline_at", { ascending: true })
      .limit(4),
  ]);

  return (
    <div className="flex flex-col gap-20 pb-20">
      <section className="border-b border-border bg-gradient-to-b from-accent-soft/60 to-background">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-20 text-center sm:px-6">
          <h1 className="font-display text-4xl font-extrabold tracking-tight sm:text-5xl">
            A real home for independent filmmakers.
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-muted">
            Events, open calls, resources, and a community that actually talks back — built for
            directors, crew, and cast making work outside the studio system.
          </p>
          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button size="lg" asChild>
              <Link href="/signup">Join free</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/community">See the community</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="font-display text-2xl font-bold">Upcoming events</h2>
          <Link href="/events" className="text-sm font-medium text-accent hover:underline">
            See all events →
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {events?.length ? (
            events.map((event) => (
              <Card key={event.id}>
                <CardHeader>
                  <Badge>{event.is_online ? "Online" : event.location ?? "In person"}</Badge>
                  <CardTitle className="text-base">{event.title}</CardTitle>
                  <CardDescription>{formatEventRange(event.start_at, event.end_at)}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm font-medium text-accent">{event.price_note}</p>
                </CardContent>
              </Card>
            ))
          ) : (
            <p className="text-muted">No upcoming events yet — check back soon.</p>
          )}
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="font-display text-2xl font-bold">Open opportunities</h2>
          <Link href="/opportunities" className="text-sm font-medium text-accent hover:underline">
            See all opportunities →
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {opportunities?.length ? (
            opportunities.map((opp) => (
              <Card key={opp.id}>
                <CardHeader>
                  <Badge variant="outline">{opp.category}</Badge>
                  <CardTitle className="text-base">{opp.title}</CardTitle>
                  <CardDescription>{opp.organizer}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm font-medium text-accent">{formatDeadline(opp.deadline_at)}</p>
                </CardContent>
              </Card>
            ))
          ) : (
            <p className="text-muted">No open opportunities right now — check back soon.</p>
          )}
        </div>
      </section>

      <section className="mx-auto w-full max-w-3xl px-4 text-center sm:px-6">
        <div className="grain-divider mb-10" />
        <h2 className="font-display text-2xl font-bold">Don&rsquo;t miss the next one</h2>
        <p className="mt-2 text-muted">
          A short, occasional email with new events, open calls, and community highlights.
        </p>
        <div className="mt-6 flex justify-center">
          <NewsletterForm />
        </div>
      </section>
    </div>
  );
}
