import type { Metadata } from "next";
import Link from "next/link";
import { ButtonLink, Card, Chip, EmptyState, inputClass, OwnerChip, PageHeader, cx } from "@/components/ui";
import { requireUser } from "@/lib/auth/dal";
import {
  COUNTRIES,
  COUNTRY_LABELS,
  STAGES,
  STAGE_LABELS,
  TIERS,
  TIER_LABELS,
  TIER_SHORT,
  type Country,
  type Tier,
} from "@/lib/domain";
import { formatDate, relativeDays, todayISO } from "@/lib/dates";
import { coupleName, stageTone } from "@/lib/format";
import { formatGBP } from "@/lib/money";
import { listClients } from "@/server/queries";

export const metadata: Metadata = { title: "Clients" };

const pick = <T extends string>(v: unknown, allowed: readonly T[]) =>
  typeof v === "string" && (allowed as readonly string[]).includes(v) ? (v as T) : undefined;

export default async function ClientsPage({ searchParams }: PageProps<"/clients">) {
  await requireUser();
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim().slice(0, 100) : "";
  const stage = pick(sp.stage, [...STAGES, "active", "all"] as const) ?? "active";
  const tier = pick(sp.tier, TIERS) as Tier | undefined;
  const country = pick(sp.country, COUNTRIES) as Country | undefined;
  const rows = await listClients({ q, stage, tier, country });
  const today = todayISO();

  return (
    <>
      <PageHeader
        eyebrow="Bookings"
        title="Clients"
        actions={<ButtonLink href="/clients/new">+ New booking</ButtonLink>}
      />
      {sp.deleted === "1" && (
        <p role="status" className="mb-4 rounded-lg bg-good-wash px-3 py-2 text-sm text-good">
          Client and all their data permanently deleted.
        </p>
      )}

      <form className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-[1fr_auto_auto_auto_auto]" role="search">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search couple or venue"
          aria-label="Search couple or venue"
          className={cx(inputClass, "col-span-2 sm:col-span-1")}
        />
        <select name="stage" defaultValue={stage} aria-label="Stage" className={inputClass}>
          <option value="active">Active</option>
          <option value="all">All stages</option>
          {STAGES.map((s) => (
            <option key={s} value={s}>
              {STAGE_LABELS[s]}
            </option>
          ))}
        </select>
        <select name="tier" defaultValue={tier ?? ""} aria-label="Tier" className={inputClass}>
          <option value="">All tiers</option>
          {TIERS.map((t) => (
            <option key={t} value={t}>
              {TIER_LABELS[t]}
            </option>
          ))}
        </select>
        <select name="country" defaultValue={country ?? ""} aria-label="Country" className={inputClass}>
          <option value="">All countries</option>
          {COUNTRIES.map((c) => (
            <option key={c} value={c}>
              {COUNTRY_LABELS[c]}
            </option>
          ))}
        </select>
        <button className="min-h-11 rounded-xl border border-line-strong bg-card px-4 text-sm font-medium transition-brand hover:border-ink-soft">
          Filter
        </button>
      </form>

      {rows.length === 0 ? (
        <EmptyState>
          No clients match.{" "}
          <Link href="/clients/new" className="text-ember underline">
            Add a booking
          </Link>
        </EmptyState>
      ) : (
        <>
          {/* Phones: cards */}
          <ul className="flex flex-col gap-2 sm:hidden">
            {rows.map((c) => (
              <li key={c.id}>
                <Link href={`/clients/${c.id}`} className="block rounded-2xl border border-line bg-card p-4 transition-brand active:bg-ivory">
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-display text-xl leading-tight">{coupleName(c)}</p>
                    <Chip tone={stageTone(c.stage)}>{STAGE_LABELS[c.stage]}</Chip>
                  </div>
                  <p className="mt-1 text-sm text-ink-soft">
                    {formatDate(c.weddingDate)} · {relativeDays(c.weddingDate, today)}
                  </p>
                  <p className="mt-1 text-xs text-ink-soft">
                    {[c.venueName, COUNTRY_LABELS[c.country], TIER_SHORT[c.tier]].filter(Boolean).join(" · ")}
                  </p>
                </Link>
              </li>
            ))}
          </ul>

          {/* Desktop: table */}
          <Card className="hidden overflow-hidden sm:block">
            <table className="w-full text-sm">
              <thead className="border-b border-line bg-ivory/60 text-left text-xs uppercase tracking-wide text-ink-soft">
                <tr>
                  <th className="px-4 py-3 font-medium">Couple</th>
                  <th className="px-4 py-3 font-medium">Wedding</th>
                  <th className="px-4 py-3 font-medium">Where</th>
                  <th className="px-4 py-3 font-medium">Tier</th>
                  <th className="px-4 py-3 font-medium">Stage</th>
                  <th className="px-4 py-3 font-medium">Lead</th>
                  <th className="px-4 py-3 text-right font-medium">Fee</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {rows.map((c) => (
                  <tr key={c.id} className="transition-brand hover:bg-ivory/70">
                    <td className="px-4 py-3">
                      <Link href={`/clients/${c.id}`} className="font-display text-lg leading-tight hover:text-ember">
                        {coupleName(c)}
                      </Link>
                    </td>
                    <td className="tabular px-4 py-3">
                      {formatDate(c.weddingDate)}
                      <span className="block text-xs text-ink-soft">{relativeDays(c.weddingDate, today)}</span>
                    </td>
                    <td className="px-4 py-3">
                      {COUNTRY_LABELS[c.country]}
                      {c.venueName && <span className="block text-xs text-ink-soft">{c.venueName}</span>}
                    </td>
                    <td className="px-4 py-3">{TIER_LABELS[c.tier]}</td>
                    <td className="px-4 py-3">
                      <Chip tone={stageTone(c.stage)}>{STAGE_LABELS[c.stage]}</Chip>
                    </td>
                    <td className="px-4 py-3">
                      <OwnerChip owner={c.lead} />
                    </td>
                    <td className="tabular px-4 py-3 text-right">{formatGBP(c.totalFeePence)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
          <p className="mt-3 text-xs text-ink-soft">{rows.length} client{rows.length === 1 ? "" : "s"}</p>
        </>
      )}
    </>
  );
}
