import Link from "next/link";
import { getCurrentUser } from "@/lib/dal";
import { signOut } from "@/app/auth/actions";
import { Button } from "@/components/ui/button";

const navLinks = [
  { href: "/events", label: "Events" },
  { href: "/opportunities", label: "Opportunities" },
  { href: "/resources", label: "Resources" },
  { href: "/spotlight", label: "Spotlight" },
  { href: "/community", label: "Community" },
];

export async function SiteHeader() {
  const profile = await getCurrentUser();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <Link href="/" className="font-display text-lg font-extrabold tracking-tight">
          The Green Room
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-medium md:flex">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-accent">
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {profile ? (
            <details className="group relative">
              <summary className="flex cursor-pointer list-none items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5 text-sm font-medium">
                {profile.photo_url ? (
                  <img
                    src={profile.photo_url}
                    alt=""
                    className="h-6 w-6 rounded-full"
                  />
                ) : null}
                {profile.display_name}
              </summary>
              <div className="absolute right-0 z-50 mt-2 w-48 rounded-xl border border-border bg-surface p-1 shadow-lg">
                <Link
                  href={`/profile/${profile.id}`}
                  className="block rounded-lg px-3 py-2 text-sm hover:bg-muted-surface"
                >
                  My profile
                </Link>
                {profile.role === "admin" ? (
                  <Link
                    href="/admin"
                    className="block rounded-lg px-3 py-2 text-sm hover:bg-muted-surface"
                  >
                    Admin dashboard
                  </Link>
                ) : null}
                <form action={signOut}>
                  <button
                    type="submit"
                    className="block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-muted-surface"
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
                <Link href="/signup">Join free</Link>
              </Button>
            </>
          )}
        </div>
      </div>
      <nav className="flex gap-4 overflow-x-auto border-t border-border px-4 py-2 text-sm font-medium md:hidden">
        {navLinks.map((link) => (
          <Link key={link.href} href={link.href} className="whitespace-nowrap hover:text-accent">
            {link.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
