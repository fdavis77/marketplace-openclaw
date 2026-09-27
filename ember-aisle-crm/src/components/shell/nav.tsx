"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cx } from "@/components/ui";

const items = [
  { href: "/", label: "Today", icon: SunIcon },
  { href: "/clients", label: "Clients", icon: RingsIcon },
  { href: "/vendors", label: "Vendors", icon: BookIcon },
];

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export function TopNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Main" className="hidden items-center gap-1 sm:flex">
      {items.map((i) => (
        <Link
          key={i.href}
          href={i.href}
          aria-current={isActive(pathname, i.href) ? "page" : undefined}
          className={cx(
            "rounded-full px-3.5 py-2 text-sm font-medium transition-brand",
            isActive(pathname, i.href) ? "bg-ink text-ivory" : "text-ink-soft hover:text-ink",
          )}
        >
          {i.label}
        </Link>
      ))}
    </nav>
  );
}

/** Thumb-reach navigation on phones. */
export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur sm:hidden"
    >
      <ul className="grid grid-cols-3">
        {items.map((i) => {
          const active = isActive(pathname, i.href);
          const Icon = i.icon;
          return (
            <li key={i.href}>
              <Link
                href={i.href}
                aria-current={active ? "page" : undefined}
                className={cx(
                  "flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium transition-brand",
                  active ? "text-ember" : "text-ink-soft",
                )}
              >
                <Icon />
                {i.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function SunIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  );
}
function RingsIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
      <circle cx="9" cy="14" r="5.5" />
      <circle cx="15" cy="14" r="5.5" />
      <path d="M10 4.5l2 2.5 2-2.5" />
    </svg>
  );
}
function BookIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
      <path d="M5 4h11a3 3 0 013 3v13H8a3 3 0 01-3-3V4z" />
      <path d="M5 17a3 3 0 013-3h11" />
    </svg>
  );
}
