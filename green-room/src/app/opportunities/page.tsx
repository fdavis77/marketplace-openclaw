import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/dal";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SaveButton } from "@/components/save-button";
import { formatDeadline, isPastDeadline } from "@/lib/format";
import type { Tables } from "@/lib/supabase/database.types";

function OpportunityCard({
  opp,
  profileId,
  saved,
}: {
  opp: Tables<"opportunities">;
  profileId: string | null;
  saved: boolean;
}) {
  return (
    <Card className="flex flex-col">
      <CardHeader>
        <div className="flex items-center justify-between">
          <Badge variant="outline">{opp.category}</Badge>
          <Badge variant={isPastDeadline(opp.deadline_at) ? "warning" : "default"}>
            {formatDeadline(opp.deadline_at)}
          </Badge>
        </div>
        <CardTitle>{opp.title}</CardTitle>
        <CardDescription>{opp.organizer}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1">
        <p className="text-sm">{opp.description}</p>
      </CardContent>
      <CardFooter className="flex items-center justify-between gap-2">
        {opp.external_url ? (
          <Button variant="link" size="sm" asChild className="px-0">
            <a href={opp.external_url} target="_blank" rel="noopener noreferrer">
              View listing →
            </a>
          </Button>
        ) : <span />}
        {profileId ? (
          <SaveButton itemType="opportunity" itemId={opp.id} path="/opportunities" saved={saved} />
        ) : null}
      </CardFooter>
    </Card>
  );
}

export default async function OpportunitiesPage() {
  const supabase = await createClient();
  const [profile, { data: opportunities }] = await Promise.all([
    getCurrentUser(),
    supabase
      .from("opportunities")
      .select("*")
      .eq("is_published", true)
      .order("deadline_at", { ascending: true }),
  ]);

  const savedIds = new Set<string>();
  if (profile) {
    const { data: saved } = await supabase
      .from("saved_items")
      .select("item_id")
      .eq("user_id", profile.id)
      .eq("item_type", "opportunity");
    saved?.forEach((s) => savedIds.add(s.item_id));
  }

  const open = (opportunities ?? []).filter((o) => !isPastDeadline(o.deadline_at));
  const closed = (opportunities ?? []).filter((o) => isPastDeadline(o.deadline_at));

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <h1 className="font-display text-3xl font-extrabold">Opportunities</h1>
      <p className="mt-2 text-muted">Open calls, submissions, competitions, and funding — soonest deadline first.</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {open.length ? (
          open.map((opp) => (
            <OpportunityCard
              key={opp.id}
              opp={opp}
              profileId={profile?.id ?? null}
              saved={savedIds.has(opp.id)}
            />
          ))
        ) : (
          <p className="text-muted">No open opportunities right now — check back soon.</p>
        )}
      </div>

      {closed.length ? (
        <details className="mt-12 rounded-card border border-border bg-muted-surface p-4">
          <summary className="cursor-pointer font-display text-lg font-semibold">
            Closed ({closed.length})
          </summary>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {closed.map((opp) => (
              <OpportunityCard
                key={opp.id}
                opp={opp}
                profileId={profile?.id ?? null}
                saved={savedIds.has(opp.id)}
              />
            ))}
          </div>
        </details>
      ) : null}
    </div>
  );
}
