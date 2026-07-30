import { Link, Outlet } from "react-router-dom";
import { APP_NAME } from "../config";

export function Layout() {
  return (
    <div className="flex min-h-screen flex-col bg-linen">
      <header className="border-b border-navy/10 bg-linen">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <Link to="/" className="font-display text-lg font-semibold tracking-wide text-navy">
            {APP_NAME}
          </Link>
          <nav className="flex items-center gap-6 text-sm font-medium text-navy/70">
            <Link to="/owners" className="hover:text-navy">
              For Owners
            </Link>
            <Link to="/chefs/apply" className="hover:text-navy">
              For Chefs
            </Link>
          </nav>
        </div>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-navy/10 bg-navy py-10 text-linen/60">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-6 text-sm">
        <p className="font-display text-linen">{APP_NAME}</p>
        <p>Concierge introductions between private yacht owners and vetted private chefs.</p>
        <p className="text-xs">
          {APP_NAME} arranges introductions only. Placement fees are agreed directly between owner
          and chef, off-platform.
        </p>
      </div>
    </footer>
  );
}
