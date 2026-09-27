import type { Metadata } from "next";
import Link from "next/link";
import { CountUp } from "@/components/motion/count-up";
import { TaskCheck } from "@/components/task-check";
import { Card, Chip, cx, EmptyState, OwnerChip, SectionTitle } from "@/components/ui";
import { requireUser } from "@/lib/auth/dal";
import {
  COUNTRY_LABELS,
  PAYMENT_TYPE_LABELS,
  TIER_SHORT,
} from "@/lib/domain";
import { formatShortDate, formatWeekday, relativeDays, todayISO } from "@/lib/dates";
import { coupleName } from "@/lib/format";
import { formatGBP } from "@/lib/money";
import { getDashboard } from "@/server/queries";

export const metadata: Metadata = { title: "Today" };

function greeting() {
  const h = Number(
    new Intl.DateTimeFormat("en-GB", { hour: "numeric", hourCycle: "h23", timeZone: "Europe/London" }).format(
      new Date(),
    ),
  );
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}

export default async function Dashboard({ searchParams }: PageProps<"/">) {
  const user = await requireUser();
  const sp = await searchParams;
  const view = sp.view === "all" ? "all" : "mine";
  const today = todayISO();
  const { weddings, tasks, duePayments, needsSignOff } = await getDashboard(
    today,
    view === "mine" ? user.person : null,
  );

  const overdueTasks = tasks.filter((t) => t.dueDate < today);
  const weekTasks = tasks.filter((t) => t.dueDate >= today);
  const overduePayments = duePayments.filter((p) => p.dueDate < today);
  const soonPayments = duePayments.filter((p) => p.dueDate >= today);
  const overdueTotal = overduePayments.reduce((s, p) => s + p.amountPence, 0);
  const next = weddings[0];

  return (
    <>
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-1 text-xs font-medium uppercase tracking-[0.14em] text-gold-ink">
            {formatWeekday(today)}
          </p>
          <h1 className="text-3xl sm:text-4xl">
            {greeting()}, {user.name.split(" ")[0]}
          </h1>
        </div>
        <ViewToggle view={view} />
      </header>

      <div className="mb-6 grid grid-cols-3 gap-2 sm:gap-4">
        <StatTile
          label="Upcoming weddings"
          value={<CountUp value={weddings.length} />}
          sub={next ? `Next ${relativeDays(next.weddingDate, today)}` : "None booked"}
        />
        <StatTile
          label="Tasks this week"
          value={<CountUp value={tasks.length} />}
          sub={overdueTasks.length ? `${overdueTasks.length} overdue` : "Nothing overdue"}
          alert={overdueTasks.length > 0}
        />
        <StatTile
          label="Overdue payments"
          value={<CountUp value={overdueTotal} format="gbp" />}
          sub={
            overduePayments.length
              ? `${overduePayments.length} payment${overduePayments.length > 1 ? "s" : ""}`
              : "All up to date"
          }
          alert={overduePayments.length > 0}
        />
      </div>

      {needsSignOff.length > 0 && (
        <Card className="mb-6 border-gold/50 bg-gold-wash/50 p-4">
          <p className="text-sm font-medium">Ready to mark delivered</p>
          <p className="mb-2 text-xs text-ink-soft">These weddings have happened but are still open.</p>
          <ul className="flex flex-wrap gap-2">
            {needsSignOff.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/clients/${c.id}`}
                  className="inline-flex rounded-full border border-gold/50 bg-card px-3 py-1.5 text-sm transition-brand hover:border-gold-ink"
                >
                  {coupleName(c)} · {formatShortDate(c.weddingDate)}
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.25fr_1fr]">
        <Card className="p-4 sm:p-5">
          <SectionTitle aside={<span className="text-xs text-ink-soft">Next 7 days</span>}>Tasks</SectionTitle>
          {tasks.length === 0 ? (
            <EmptyState>Nothing due this week. Enjoy it.</EmptyState>
          ) : (
            <div className="flex flex-col gap-5">
              {overdueTasks.length > 0 && (
                <TaskGroup title="Overdue" tone="over" tasks={overdueTasks} today={today} />
              )}
              {weekTasks.length > 0 && <TaskGroup title="This week" tasks={weekTasks} today={today} />}
            </div>
          )}
        </Card>

        <div className="flex flex-col gap-6">
          <Card className="p-4 sm:p-5">
            <SectionTitle aside={<Link href="/clients" className="text-xs text-ember hover:underline">All clients</Link>}>
              Upcoming weddings
            </SectionTitle>
            {weddings.length === 0 ? (
              <EmptyState>
                No upcoming weddings{view === "mine" ? " led by you" : ""}.{" "}
                <Link href="/clients/new" className="text-ember underline">
                  Add a booking
                </Link>
              </EmptyState>
            ) : (
              <ul className="-mx-2 divide-y divide-line">
                {weddings.map((w) => (
                  <li key={w.id}>
                    <Link
                      href={`/clients/${w.id}`}
                      className="flex items-center gap-3 rounded-xl px-2 py-3 transition-brand hover:bg-ivory"
                    >
                      <DateBadge iso={w.weddingDate} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-display text-lg leading-tight">{coupleName(w)}</p>
                        <p className="truncate text-xs text-ink-soft">
                          {[w.venueName, COUNTRY_LABELS[w.country]].filter(Boolean).join(" · ")}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1">
                        <span className="tabular text-xs font-medium">{relativeDays(w.weddingDate, today)}</span>
                        <span className="text-[11px] text-ink-soft">
                          {TIER_SHORT[w.tier]} · {w.openTasks} open
                        </span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card className="p-4 sm:p-5">
            <SectionTitle>Payments</SectionTitle>
            {duePayments.length === 0 ? (
              <EmptyState>No payments overdue or due this week.</EmptyState>
            ) : (
              <ul className="-mx-2 divide-y divide-line">
                {[...overduePayments, ...soonPayments].map((p) => {
                  const overdue = p.dueDate < today;
                  return (
                    <li key={p.id}>
                      <Link
                        href={`/clients/${p.clientId}?tab=payments`}
                        className="flex items-center justify-between gap-3 rounded-xl px-2 py-3 transition-brand hover:bg-ivory"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{coupleName(p)}</p>
                          <p className="text-xs text-ink-soft">
                            {p.label || PAYMENT_TYPE_LABELS[p.type]} · due {formatShortDate(p.dueDate)}
                          </p>
                        </div>
                        <div className="flex shrink-0 flex-col items-end gap-1">
                          <span className="tabular text-sm font-semibold">{formatGBP(p.amountPence)}</span>
                          <Chip tone={overdue ? "over" : "gold"}>{overdue ? "Overdue" : "Due"}</Chip>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        </div>
      </div>
      <p className="mt-6 text-center text-xs text-ink-soft">
        {view === "mine" ? "Showing your work and joint work. " : "Showing everything. "}
        <Link href={view === "mine" ? "/?view=all" : "/?view=mine"} className="text-ember hover:underline">
          {view === "mine" ? "Show all" : "Show only mine"}
        </Link>
      </p>
    </>
  );
}

function ViewToggle({ view }: { view: "mine" | "all" }) {
  const base = "rounded-full px-4 py-1.5 text-sm font-medium transition-brand";
  return (
    <div role="group" aria-label="Whose work" className="inline-flex self-start rounded-full border border-line bg-card p-1">
      <Link href="/?view=mine" aria-pressed={view === "mine"} className={cx(base, view === "mine" ? "bg-ink text-ivory" : "text-ink-soft")}>
        Mine
      </Link>
      <Link href="/?view=all" aria-pressed={view === "all"} className={cx(base, view === "all" ? "bg-ink text-ivory" : "text-ink-soft")}>
        All
      </Link>
    </div>
  );
}

function StatTile({
  label,
  value,
  sub,
  alert,
}: {
  label: string;
  value: React.ReactNode;
  sub: string;
  alert?: boolean;
}) {
  return (
    <Card className={cx("p-3 sm:p-5", alert && "border-over/30")}>
      <p className="text-[11px] font-medium uppercase leading-tight tracking-wide text-ink-soft sm:text-xs">{label}</p>
      <p className={cx("mt-1 font-display text-3xl leading-none sm:mt-2 sm:text-5xl", alert && "text-over")}>{value}</p>
      <p className={cx("mt-1.5 text-[11px] sm:text-xs", alert ? "text-over" : "text-ink-soft")}>{sub}</p>
    </Card>
  );
}

function DateBadge({ iso }: { iso: string }) {
  const [, m, d] = iso.split("-");
  const month = new Intl.DateTimeFormat("en-GB", { month: "short", timeZone: "UTC" }).format(
    new Date(Date.UTC(2000, Number(m) - 1, 1)),
  );
  return (
    <span className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl border border-gold/40 bg-gold-wash/60">
      <span className="font-display text-xl leading-none">{Number(d)}</span>
      <span className="text-[10px] uppercase tracking-wide text-gold-ink">{month}</span>
    </span>
  );
}

type DashTask = Awaited<ReturnType<typeof getDashboard>>["tasks"][number];

function TaskGroup({
  title,
  tasks,
  today,
  tone,
}: {
  title: string;
  tasks: DashTask[];
  today: string;
  tone?: "over";
}) {
  return (
    <section>
      <h3 className={cx("mb-1 font-sans text-xs font-semibold uppercase tracking-wide", tone === "over" ? "text-over" : "text-ink-soft")}>
        {title} · {tasks.length}
      </h3>
      <ul className="divide-y divide-line">
        {tasks.map((t) => (
          <li key={t.id} className="flex items-start gap-3 py-2.5">
            <div className="pt-0.5">
              <TaskCheck taskId={t.id} status={t.status} label={t.name} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm leading-snug">{t.name}</p>
              <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-ink-soft">
                <Link href={`/clients/${t.clientId}`} className="font-medium text-ink hover:text-ember">
                  {coupleName(t)}
                </Link>
                <span className={cx("tabular", t.dueDate < today && "text-over")}>
                  {t.dueDate === today ? "Today" : formatShortDate(t.dueDate)}
                </span>
                <OwnerChip owner={t.owner} />
              </p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
