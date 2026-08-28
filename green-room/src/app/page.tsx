import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/dal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { relativeDays, formatDate, formatDateTime } from "@/lib/format";

type UpcomingItem = {
  id: string;
  when: string;
  label: string;
  detail: string;
  href: string;
  kind: "deadline" | "submission" | "audition";
};

export default async function HomePage() {
  const profile = await getCurrentUser();

  if (!profile) {
    return (
      <div className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-24 text-center sm:px-6">
        <h1 className="font-display text-4xl sm:text-5xl">
          The planner that knows the work.
        </h1>
        <p className="mx-auto max-w-xl text-lg text-muted">
          Deadlines, drafts, self-tapes, and submissions — every role you play, in one private
          notebook. Track scripts from idea to submission, log your writing pages, and run your
          audition pipeline, all in one place.
        </p>
        <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button size="lg" asChild>
            <Link href="/signup">Get started free</Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/login">Sign in</Link>
          </Button>
        </div>
        <p className="text-sm text-muted">
          Built by <Link href="/about" className="font-medium text-accent hover:underline">Aysha Scott</Link>,
          independent filmmaker and founder of Filmmaking Planner.
        </p>
        <div className="mx-auto mt-6 grid max-w-2xl gap-4 text-left sm:grid-cols-2">
          <Card>
            <CardHeader>
              <Badge variant="outline">Writers & directors</Badge>
              <CardTitle className="text-base">Projects, scenes, submissions, goals</CardTitle>
              <CardDescription>
                Every script as a project with a stage pipeline, a scene-by-scene revision tracker, where
                it&rsquo;s been submitted, and a daily or weekly writing target.
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <Badge variant="outline">Actors</Badge>
              <CardTitle className="text-base">Auditions, sides, availability, materials</CardTitle>
              <CardDescription>
                A pipeline from submitted to booked, sides and self-tape deadlines attached to each
                audition, an availability calendar, and a library of headshots, reels, and resumes.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    );
  }

  const supabase = await createClient();
  const roles = profile.creative_roles ?? [];
  const isWriter =
    roles.includes("writer") ||
    roles.includes("director") ||
    roles.includes("producer") ||
    roles.includes("editor");
  const isActor = roles.includes("actor");

  const [{ data: projects }, { data: auditions }] = await Promise.all([
    supabase.from("projects").select("*").eq("owner_id", profile.id),
    isActor
      ? supabase
          .from("auditions")
          .select("*")
          .eq("owner_id", profile.id)
          .in("status", ["submitted", "callback"])
      : Promise.resolve({ data: [] as never[] }),
  ]);

  const projectIds = (projects ?? []).map((p) => p.id);
  const { data: submissions } = projectIds.length
    ? await supabase
        .from("submissions")
        .select("*, project:projects(title)")
        .in("project_id", projectIds)
        .in("status", ["submitted", "pending"])
    : { data: [] as never[] };

  const upcoming: UpcomingItem[] = [];

  for (const p of projects ?? []) {
    if (p.target_deadline) {
      upcoming.push({
        id: `proj-${p.id}`,
        when: p.target_deadline,
        label: p.title,
        detail: `Target deadline — ${p.stage.replace("_", " ")}`,
        href: `/projects/${p.id}`,
        kind: "deadline",
      });
    }
  }
  for (const s of submissions ?? []) {
    if (s.response_due_at) {
      upcoming.push({
        id: `sub-${s.id}`,
        when: s.response_due_at,
        label: s.target_name,
        detail: `Response due — ${s.project?.title ?? "project"}`,
        href: `/projects/${s.project_id}`,
        kind: "submission",
      });
    }
  }
  for (const a of auditions ?? []) {
    if (a.self_tape_deadline) {
      upcoming.push({
        id: `tape-${a.id}`,
        when: a.self_tape_deadline,
        label: a.project_name,
        detail: `Self-tape due — ${a.role_name}`,
        href: `/auditions/${a.id}`,
        kind: "audition",
      });
    }
    if (a.callback_date) {
      upcoming.push({
        id: `cb-${a.id}`,
        when: a.callback_date,
        label: a.project_name,
        detail: `Callback — ${a.role_name}`,
        href: `/auditions/${a.id}`,
        kind: "audition",
      });
    } else if (a.audition_date) {
      upcoming.push({
        id: `aud-${a.id}`,
        when: a.audition_date,
        label: a.project_name,
        detail: `Audition — ${a.role_name}`,
        href: `/auditions/${a.id}`,
        kind: "audition",
      });
    }
  }

  upcoming.sort((a, b) => new Date(a.when).getTime() - new Date(b.when).getTime());

  const roleLabels: Record<string, string> = {
    writer: "Writer",
    director: "Director",
    producer: "Producer",
    editor: "Editor",
    actor: "Actor",
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <h1 className="font-display text-3xl">Morning, {profile.display_name.split(" ")[0]}.</h1>
      <p className="mt-2 text-muted">Here&rsquo;s what needs your attention.</p>

      {roles.length ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {roles.map((r) => (
            <Badge key={r} variant="solid">{roleLabels[r] ?? r}</Badge>
          ))}
        </div>
      ) : null}

      <section className="mt-8">
        <h2 className="font-display text-xl">Coming up · next 14 days</h2>
        <div className="mt-4 flex flex-col gap-3">
          {upcoming.length ? (
            upcoming.slice(0, 8).map((item) => {
              const past = isPastDeadlineBadge(item.when) === "warning";
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={`flex items-start gap-4 rounded-card p-4 transition-colors ${
                    past ? "bg-[var(--color-neutral-900)] text-background" : "bg-surface hover:bg-[var(--color-neutral-200)]"
                  }`}
                >
                  <div className="flex w-14 flex-none flex-col items-center">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider ${
                        past ? "text-[var(--color-accent-300)]" : "text-muted"
                      }`}
                    >
                      {item.when.length > 10 ? formatDateTime(item.when).split(",")[0] : formatDate(item.when)}
                    </span>
                  </div>
                  <div className={`w-px self-stretch ${past ? "bg-white/15" : "bg-border"}`} />
                  <div className="flex flex-1 flex-col gap-0.5">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider ${
                        past ? "text-[var(--color-accent-300)]" : "text-accent"
                      }`}
                    >
                      {item.detail}
                    </span>
                    <span className="text-base font-semibold">{item.label}</span>
                    <span className={`text-xs ${past ? "text-[var(--color-neutral-400)]" : "text-muted"}`}>
                      {relativeDays(item.when)}
                    </span>
                  </div>
                </Link>
              );
            })
          ) : (
            <p className="rounded-card border border-dashed border-[var(--color-neutral-400)] p-8 text-center text-muted">
              Nothing on the horizon — that&rsquo;s either great, or a sign to add a deadline.
            </p>
          )}
        </div>
      </section>

      <div className="sprocket-divider my-10">
        <div className="holes"><span className="hole" /><span className="hole" /><span className="hole" /></div>
        <div className="line" />
      </div>

      {!roles.length ? (
        <div className="rounded-card bg-accent-soft p-6">
          <p className="font-medium">You haven&rsquo;t picked a role yet.</p>
          <p className="mt-1 text-sm text-muted">
            Head to your account to choose writer, director, producer, editor, and/or actor — that&rsquo;s what turns on the
            sections below.
          </p>
          <Button asChild size="sm" className="mt-3">
            <Link href="/account">Go to account</Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {isWriter ? (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Projects</CardTitle>
                  <CardDescription>{projects?.length ?? 0} in progress</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button asChild size="sm" variant="outline">
                    <Link href="/projects">Open projects →</Link>
                  </Button>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Writing goals</CardTitle>
                  <CardDescription>Targets, streaks, and your session log</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button asChild size="sm" variant="outline">
                    <Link href="/goals">Open goals →</Link>
                  </Button>
                </CardContent>
              </Card>
            </>
          ) : null}
          {isActor ? (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Auditions</CardTitle>
                  <CardDescription>{auditions?.length ?? 0} active</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button asChild size="sm" variant="outline">
                    <Link href="/auditions">Open pipeline →</Link>
                  </Button>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Availability & materials</CardTitle>
                  <CardDescription>Blocked dates, headshots, reels, resumes</CardDescription>
                </CardHeader>
                <CardContent className="flex gap-2">
                  <Button asChild size="sm" variant="outline">
                    <Link href="/availability">Availability →</Link>
                  </Button>
                  <Button asChild size="sm" variant="outline">
                    <Link href="/materials">Materials →</Link>
                  </Button>
                </CardContent>
              </Card>
            </>
          ) : null}
        </div>
      )}
    </div>
  );
}

function isPastDeadlineBadge(when: string): "warning" | "default" {
  return new Date(when).getTime() < Date.now() ? "warning" : "default";
}
