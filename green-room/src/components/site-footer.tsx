import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-muted-surface">
      <div className="grain-divider"></div>
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-8 text-sm text-muted sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p>
          <span className="font-display font-semibold text-foreground">Filmmaking Planner</span>{" "}
          — a production and career planner for screen creatives, by Aysha Scott.
        </p>
        <Link href="/about" className="hover:text-accent">About the founder</Link>
      </div>
    </footer>
  );
}
