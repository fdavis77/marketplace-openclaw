import Link from "next/link";
import { requireAdmin } from "@/lib/dal";
import { cn } from "@/lib/utils";
import { EventsSection } from "./events-section";
import { OpportunitiesSection } from "./opportunities-section";
import { ResourcesSection } from "./resources-section";
import { SpotlightsSection } from "./spotlights-section";
import { NominationsSection } from "./nominations-section";
import { ModerationSection } from "./moderation-section";

const TABS = [
  { key: "events", label: "Events" },
  { key: "opportunities", label: "Opportunities" },
  { key: "resources", label: "Resources" },
  { key: "spotlights", label: "Spotlights" },
  { key: "nominations", label: "Nominations" },
  { key: "moderation", label: "Community moderation" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  await requireAdmin();
  const params = await searchParams;
  const tab = (TABS.find((t) => t.key === params.tab)?.key ?? "events") as TabKey;

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <h1 className="font-display text-3xl font-extrabold">Admin dashboard</h1>
      <p className="mt-2 text-muted">Publish content and moderate the community.</p>

      <nav className="mt-8 flex flex-wrap gap-2 border-b border-border pb-4">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={`/admin?tab=${t.key}`}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm font-medium",
              tab === t.key ? "bg-accent text-accent-foreground" : "bg-muted-surface hover:bg-accent-soft"
            )}
          >
            {t.label}
          </Link>
        ))}
      </nav>

      <div className="mt-8">
        {tab === "events" ? <EventsSection /> : null}
        {tab === "opportunities" ? <OpportunitiesSection /> : null}
        {tab === "resources" ? <ResourcesSection /> : null}
        {tab === "spotlights" ? <SpotlightsSection /> : null}
        {tab === "nominations" ? <NominationsSection /> : null}
        {tab === "moderation" ? <ModerationSection /> : null}
      </div>
    </div>
  );
}
