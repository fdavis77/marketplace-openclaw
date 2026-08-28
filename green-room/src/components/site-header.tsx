import Link from "next/link";
import { getCurrentUser } from "@/lib/dal";
import { signOut } from "@/app/auth/actions";
import { Button } from "@/components/ui/button";

const memberLinks = [
  { href: "/", label: "Dashboard" },
  { href: "/projects", label: "Projects" },
  { href: "/goals", label: "Goals" },
  { href: "/auditions", label: "Auditions" },
  { href: "/availability", label: "Availability" },
  { href: "/materials", label: "Materials" },
  { href: "/network", label: "Network" },
  { href: "/messages", label: "Messages" },
];

function Wordmark() {
  return (
    <span className="inline-flex items-center gap-2.5">
      <span className="flex h-7 w-7 flex-none flex-col justify-evenly rounded-lg bg-accent py-1.5 pl-1.5">
        <span className="h-[3px] w-1.5 rounded-sm bg-accent-foreground" />
        <span className="h-[3px] w-1.5 rounded-sm bg-accent-foreground" />
        <span className="h-[3px] w-1.5 rounded-sm bg-accent-foreground" />
      </span>
      <span className="font-display text-base">Filmmaking Planner</span>
    </span>
  );
}

export async function SiteHeader() {
  const profile = await getCurrentUser();

  return (
    <header className="sticky top-0 z-40 bg-background/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <Link href="/">
          <Wordmark />
        </Link>

        {profile ? (
          <nav className="hidden items-center gap-5 text-sm font-medium md:flex">
            {memberLinks.map((link) => (
              <Link key={link.href} href={link.href} className="hover:text-accent">
                {link.label}
              </Link>
            ))}
          </nav>
        ) : (
          <nav className="hidden items-center gap-5 text-sm font-medium md:flex">
            <Link href="/about" className="hover:text-accent">About</Link>
          </nav>
        )}

        <div className="flex items-center gap-2">
          {profile ? (
            <details className="group relative">
              <summary className="flex cursor-pointer list-none items-center gap-2 rounded-full bg-surface px-3 py-1.5 text-sm font-medium">
                {profile.photo_url ? (
                  <img src={profile.photo_url} alt="" className="h-6 w-6 rounded-full" />
                ) : null}
                {profile.display_name}
              </summary>
              <div className="absolute right-0 z-50 mt-2 w-48 rounded-2xl bg-surface p-1 shadow-lg">
                <Link href="/account" className="block rounded-xl px-3 py-2 text-sm hover:bg-muted-surface">
                  Account
                </Link>
                <form action={signOut}>
                  <button
                    type="submit"
                    className="block w-full rounded-xl px-3 py-2 text-left text-sm hover:bg-muted-surface"
                  >
                    Sign out
                  </button>
                </form>
              </div>
            </details>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/login">Sign in</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/signup">Get started</Link>
              </Button>
            </>
          )}
        </div>
      </div>
      {profile ? (
        <nav className="flex gap-4 overflow-x-auto border-t border-[var(--border)] px-4 py-2 text-sm font-medium md:hidden">
          {memberLinks.map((link) => (
            <Link key={link.href} href={link.href} className="whitespace-nowrap hover:text-accent">
              {link.label}
            </Link>
          ))}
        </nav>
      ) : null}
    </header>
  );
}
