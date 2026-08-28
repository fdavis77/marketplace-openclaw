import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/dal";
import { startConversation } from "@/app/actions/network";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ROLE_OPTIONS, ROLE_LABELS } from "@/lib/roles";
import { COURSE_URL, SHOP_URL } from "@/lib/external-links";

export default async function NetworkPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string }>;
}) {
  const user = await requireUser();
  const { role } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("profiles")
    .select("id, display_name, bio, location, creative_roles")
    .eq("is_public", true)
    .neq("id", user.id);
  if (role) query = query.contains("creative_roles", [role]);

  const { data: people } = await query.order("display_name", { ascending: true });

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <h1 className="font-display text-3xl">Network</h1>
      <p className="mt-2 text-muted">
        Find writers, directors, actors, and crew across the industry — gaffers, sound, composers,
        and more. Your projects, goals, and auditions stay private; only what you opt in on your{" "}
        <Link href="/account" className="font-medium text-accent hover:underline">account</Link> shows here.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <a href={COURSE_URL} target="_blank" rel="noopener noreferrer">
          <Card className="hover:shadow-md">
            <CardHeader>
              <Badge variant="accent2">Learn</Badge>
              <CardTitle className="text-base">Aysha&rsquo;s filmmaking course →</CardTitle>
              <CardDescription>Go deeper on the craft and the business side.</CardDescription>
            </CardHeader>
          </Card>
        </a>
        <a href={SHOP_URL} target="_blank" rel="noopener noreferrer">
          <Card className="hover:shadow-md">
            <CardHeader>
              <Badge variant="outline">Shop</Badge>
              <CardTitle className="text-base">Filmmaking Planner store →</CardTitle>
              <CardDescription>Paper planners and stationery for the set.</CardDescription>
            </CardHeader>
          </Card>
        </a>
      </div>

      <div className="mt-8 flex flex-wrap gap-2">
        <Link href="/network">
          <Badge variant={!role ? "solid" : "outline"}>All</Badge>
        </Link>
        {ROLE_OPTIONS.map((r) => (
          <Link key={r.value} href={`/network?role=${r.value}`}>
            <Badge variant={role === r.value ? "solid" : "outline"}>{r.label}</Badge>
          </Link>
        ))}
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {people?.map((person) => (
          <Card key={person.id}>
            <CardHeader>
              <div className="flex flex-wrap gap-1">
                {(person.creative_roles ?? []).map((r) => (
                  <Badge key={r} variant="outline">{ROLE_LABELS[r] ?? r}</Badge>
                ))}
              </div>
              <CardTitle className="text-base">{person.display_name}</CardTitle>
              {person.location ? <CardDescription>{person.location}</CardDescription> : null}
              {person.bio ? <p className="mt-1 text-sm text-muted">{person.bio}</p> : null}
            </CardHeader>
            <form action={startConversation} className="px-6 pb-6">
              <input type="hidden" name="otherUserId" value={person.id} />
              <Button type="submit" size="sm" variant="outline">Message</Button>
            </form>
          </Card>
        ))}
        {!people?.length ? (
          <p className="text-muted sm:col-span-2 lg:col-span-3">
            {role ? "Nobody in the directory has that role yet." : "Nobody has joined the directory yet — be the first from your account page."}
          </p>
        ) : null}
      </div>
    </div>
  );
}
