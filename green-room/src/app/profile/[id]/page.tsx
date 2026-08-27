import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/dal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProfileEditForm } from "@/components/profile-edit-form";
import { formatEventRange, formatDeadline } from "@/lib/format";
import type { Tables } from "@/lib/supabase/database.types";

const LINK_LABELS: Record<string, string> = {
  reel: "Reel",
  instagram: "Instagram",
  imdb: "IMDb",
  site: "Website",
};

export default async function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const [viewer, { data: profile }] = await Promise.all([
    getCurrentUser(),
    supabase.from("profiles").select("*").eq("id", id).maybeSingle(),
  ]);

  if (!profile) notFound();

  const isOwner = viewer?.id === profile.id;

  const { data: posts } = await supabase
    .from("posts")
    .select("*")
    .eq("author_id", profile.id)
    .order("created_at", { ascending: false })
    .limit(10);

  let savedEvents: Tables<"events">[] | null = null;
  let savedOpportunities: Tables<"opportunities">[] | null = null;

  if (isOwner) {
    const { data: savedItems } = await supabase
      .from("saved_items")
      .select("item_type, item_id")
      .eq("user_id", profile.id);

    const eventIds = (savedItems ?? []).filter((s) => s.item_type === "event").map((s) => s.item_id);
    const oppIds = (savedItems ?? []).filter((s) => s.item_type === "opportunity").map((s) => s.item_id);

    if (eventIds.length) {
      const { data } = await supabase.from("events").select("*").in("id", eventIds);
      savedEvents = data;
    }
    if (oppIds.length) {
      const { data } = await supabase.from("opportunities").select("*").in("id", oppIds);
      savedOpportunities = data;
    }
  }

  const links = (profile.links ?? {}) as Record<string, string>;

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
        {profile.photo_url ? (
          <img src={profile.photo_url} alt="" className="h-24 w-24 rounded-full border border-border" />
        ) : (
          <div className="h-24 w-24 rounded-full bg-muted-surface" />
        )}
        <div>
          <h1 className="font-display text-3xl font-extrabold">{profile.display_name}</h1>
          {profile.location ? <p className="text-muted">{profile.location}</p> : null}
          <div className="mt-2 flex flex-wrap justify-center gap-2 sm:justify-start">
            {profile.creative_roles?.map((role) => (
              <Badge key={role} variant="outline">{role}</Badge>
            ))}
          </div>
        </div>
      </div>

      {profile.bio ? <p className="mt-6 whitespace-pre-line">{profile.bio}</p> : null}

      {Object.keys(links).length ? (
        <div className="mt-4 flex flex-wrap gap-4 text-sm font-medium text-accent">
          {Object.entries(links).map(([key, url]) =>
            url ? (
              <a key={key} href={url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                {LINK_LABELS[key] ?? key} →
              </a>
            ) : null
          )}
        </div>
      ) : null}

      {isOwner ? (
        <Card className="mt-10">
          <CardHeader>
            <CardTitle>Edit your profile</CardTitle>
          </CardHeader>
          <CardContent>
            <ProfileEditForm profile={profile} />
          </CardContent>
        </Card>
      ) : null}

      {isOwner ? (
        <div className="mt-10">
          <h2 className="font-display text-xl font-bold">Saved for you</h2>
          <p className="text-sm text-muted">Only visible to you.</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {savedEvents?.map((event) => (
              <Card key={event.id}>
                <CardHeader>
                  <Badge>Event</Badge>
                  <CardTitle className="text-base">{event.title}</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted">
                  {formatEventRange(event.start_at, event.end_at)}
                </CardContent>
              </Card>
            ))}
            {savedOpportunities?.map((opp) => (
              <Card key={opp.id}>
                <CardHeader>
                  <Badge variant="outline">Opportunity</Badge>
                  <CardTitle className="text-base">{opp.title}</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted">{formatDeadline(opp.deadline_at)}</CardContent>
              </Card>
            ))}
            {!savedEvents?.length && !savedOpportunities?.length ? (
              <p className="text-sm text-muted">Nothing saved yet — browse Events or Opportunities.</p>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="mt-10">
        <h2 className="font-display text-xl font-bold">Community posts</h2>
        <div className="mt-4 flex flex-col gap-3">
          {posts?.length ? (
            posts.map((post) => (
              <Link
                key={post.id}
                href="/community"
                className="block rounded-card border border-border bg-surface p-4 text-sm hover:border-accent"
              >
                {post.body}
              </Link>
            ))
          ) : (
            <p className="text-sm text-muted">No posts yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
