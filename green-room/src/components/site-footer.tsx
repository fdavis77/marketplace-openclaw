import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-muted-surface">
      <div className="grain-divider" />
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-8 text-sm text-muted sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p>
          <span className="font-display font-semibold text-foreground">The Green Room</span>{" "}
          — a home for independent filmmakers.
        </p>
        <div className="flex gap-4">
          <Link href="/events" className="hover:text-accent">
            Events
          </Link>
          <Link href="/opportunities" className="hover:text-accent">
            Opportunities
          </Link>
          <Link href="/resources" className="hover:text-accent">
            Resources
          </Link>
          <Link href="/community" className="hover:text-accent">
            Community
          </Link>
        </div>
      </div>
    </footer>
  );
}
