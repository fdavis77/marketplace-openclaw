import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/dal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NominateForm } from "@/components/nominate-form";

export default async function SpotlightPage() {
  const supabase = await createClient();
  const [profile, { data: current }, { data: archive }] = await Promise.all([
    getCurrentUser(),
    supabase
      .from("spotlights")
      .select("*, profile:profiles(*)")
      .eq("is_current", true)
      .maybeSingle(),
    supabase
      .from("spotlights")
      .select("*, profile:profiles(*)")
      .eq("is_current", false)
      .not("published_at", "is", null)
      .order("published_at", { ascending: false }),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-extrabold">Talent Spotlight</h1>
          <p className="mt-2 text-muted">Real stories from members of this community.</p>
        </div>
        {profile ? <NominateForm /> : null}
      </div>

      {current?.profile ? (
        <Card className="mt-8 overflow-hidden">
          <div className="grid gap-6 p-6 sm:grid-cols-[auto_1fr] sm:items-center">
            {current.profile.photo_url ? (
              <img
                src={current.profile.photo_url}
                alt=""
                className="h-28 w-28 rounded-full border border-border bg-muted-surface"
              />
            ) : null}
            <div>
              <p className="text-sm font-medium uppercase tracking-wide text-accent">Current spotlight</p>
              <h2 className="font-display mt-1 text-2xl font-bold">{current.headline}</h2>
              <p className="mt-2 text-sm text-muted">
                <Link href={`/profile/${current.profile.id}`} className="font-medium text-foreground hover:underline">
                  {current.profile.display_name}
                </Link>{" "}
                — {current.profile.location}
              </p>
              <p className="mt-4 whitespace-pre-line text-sm">{current.story}</p>
            </div>
          </div>
        </Card>
      ) : null}

      <h2 className="font-display mt-14 text-2xl font-bold">Archive</h2>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {archive?.length ? (
          archive.map((spotlight) =>
            spotlight.profile ? (
              <Link key={spotlight.id} href={`/profile/${spotlight.profile.id}`}>
                <Card className="h-full transition-shadow hover:shadow-md">
                  <CardHeader>
                    {spotlight.profile.photo_url ? (
                      <img
                        src={spotlight.profile.photo_url}
                        alt=""
                        className="h-14 w-14 rounded-full border border-border bg-muted-surface"
                      />
                    ) : null}
                    <CardTitle className="text-base">{spotlight.headline}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm font-medium">{spotlight.profile.display_name}</p>
                  </CardContent>
                </Card>
              </Link>
            ) : null
          )
        ) : (
          <p className="text-muted">No past spotlights yet.</p>
        )}
      </div>
    </div>
  );
}
