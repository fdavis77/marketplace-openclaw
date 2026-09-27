import type { Metadata } from "next";
import Link from "next/link";
import { ButtonLink, Card, Chip, cx, EmptyState, inputClass, PageHeader, type Tone } from "@/components/ui";
import { requireUser } from "@/lib/auth/dal";
import {
  COUNTRIES,
  COUNTRY_LABELS,
  VENDOR_CATEGORIES,
  VENDOR_CATEGORY_LABELS,
  VENDOR_STATUSES,
  VENDOR_STATUS_LABELS,
  VETTING_CHECKS,
  type Country,
  type VendorCategory,
  type VendorStatus,
} from "@/lib/domain";
import { listVendors } from "@/server/queries";

export const metadata: Metadata = { title: "Vendors" };

const pick = <T extends string>(v: unknown, allowed: readonly T[]) =>
  typeof v === "string" && (allowed as readonly string[]).includes(v) ? (v as T) : undefined;

const statusTone: Record<VendorStatus, Tone> = { prospective: "gold", approved: "good", do_not_use: "over" };

export default async function VendorsPage({ searchParams }: PageProps<"/vendors">) {
  await requireUser();
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim().slice(0, 100) : "";
  const country = pick(sp.country, COUNTRIES) as Country | undefined;
  const category = pick(sp.category, VENDOR_CATEGORIES) as VendorCategory | undefined;
  const status = pick(sp.status, VENDOR_STATUSES) as VendorStatus | undefined;
  const rows = await listVendors({ q, country, category, status });

  return (
    <>
      <PageHeader
        eyebrow="Directory"
        title="Vendors"
        actions={
          <ButtonLink href={`/vendors/new${category || country ? `?${new URLSearchParams({ ...(category && { category }), ...(country && { country }) })}` : ""}`}>
            + Add vendor
          </ButtonLink>
        }
      />
      {sp.deleted === "1" && (
        <p role="status" className="mb-4 rounded-lg bg-good-wash px-3 py-2 text-sm text-good">
          Vendor deleted.
        </p>
      )}

      <form className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-[1fr_auto_auto_auto_auto]" role="search">
        <input name="q" defaultValue={q} placeholder="Search name, region, contact" aria-label="Search vendors" className={cx(inputClass, "col-span-2 sm:col-span-1")} />
        <select name="country" defaultValue={country ?? ""} aria-label="Country" className={inputClass}>
          <option value="">All countries</option>
          {COUNTRIES.map((c) => (
            <option key={c} value={c}>{COUNTRY_LABELS[c]}</option>
          ))}
        </select>
        <select name="category" defaultValue={category ?? ""} aria-label="Category" className={inputClass}>
          <option value="">All categories</option>
          {VENDOR_CATEGORIES.map((c) => (
            <option key={c} value={c}>{VENDOR_CATEGORY_LABELS[c]}</option>
          ))}
        </select>
        <select name="status" defaultValue={status ?? ""} aria-label="Status" className={inputClass}>
          <option value="">Any status</option>
          {VENDOR_STATUSES.map((s) => (
            <option key={s} value={s}>{VENDOR_STATUS_LABELS[s]}</option>
          ))}
        </select>
        <button className="min-h-11 rounded-xl border border-line-strong bg-card px-4 text-sm font-medium transition-brand hover:border-ink-soft">
          Filter
        </button>
      </form>

      {rows.length === 0 ? (
        <EmptyState>
          No vendors match.{" "}
          <Link href="/vendors/new" className="text-ember underline">Add one</Link>
        </EmptyState>
      ) : (
        <Card className="p-2 sm:p-3">
          <ul className="divide-y divide-line">
            {rows.map((v) => {
              const done = VETTING_CHECKS.filter((c) => v[c.key]).length;
              return (
                <li key={v.id}>
                  <Link href={`/vendors/${v.id}`} className="flex items-center gap-3 rounded-xl px-2 py-3 transition-brand hover:bg-ivory">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{v.name}</p>
                      <p className="truncate text-xs text-ink-soft">
                        {VENDOR_CATEGORY_LABELS[v.category]} · {[v.region, COUNTRY_LABELS[v.country]].filter(Boolean).join(", ")}
                        {v.bookings > 0 && ` · ${v.bookings} booking${v.bookings > 1 ? "s" : ""}`}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1.5">
                      <Chip tone={statusTone[v.status]}>{VENDOR_STATUS_LABELS[v.status]}</Chip>
                      <span className="flex items-center gap-1" aria-label={`Vetting ${done} of ${VETTING_CHECKS.length} complete`} title={`Vetting ${done}/${VETTING_CHECKS.length}`}>
                        {VETTING_CHECKS.map((c) => (
                          <span key={c.key} aria-hidden className={cx("h-1.5 w-1.5 rounded-full", v[c.key] ? "bg-good" : "bg-line-strong")} />
                        ))}
                      </span>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </Card>
      )}
      <p className="mt-3 text-xs text-ink-soft">{rows.length} vendor{rows.length === 1 ? "" : "s"} · dots show vetting progress</p>
    </>
  );
}
