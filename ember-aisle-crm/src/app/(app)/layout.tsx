import Link from "next/link";
import { logout } from "@/actions/auth";
import { BottomNav, TopNav } from "@/components/shell/nav";
import { Wordmark } from "@/components/shell/wordmark";
import { requireUser } from "@/lib/auth/dal";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  return (
    <div className="min-h-dvh pb-20 sm:pb-10">
      <header className="sticky top-0 z-30 border-b border-line bg-ivory/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:h-16 sm:px-6">
          <Link href="/" className="text-ink" aria-label="Ember & Aisle — today">
            <Wordmark />
          </Link>
          <TopNav />
          <div className="flex items-center gap-2 text-sm">
            <span className="hidden text-ink-soft md:inline">{user.name}</span>
            <form action={logout}>
              <button className="rounded-full px-3 py-1.5 text-ink-soft transition-brand hover:bg-ember-wash hover:text-ink">
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl animate-page-in px-4 pt-6 sm:px-6 sm:pt-8">{children}</main>
      <BottomNav />
    </div>
  );
}
