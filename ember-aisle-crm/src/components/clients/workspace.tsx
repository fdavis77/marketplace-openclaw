"use client";

import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useCallback, useState, useTransition, type ComponentProps } from "react";
import { setStage } from "@/actions/clients";
import { DeliveredMoment } from "@/components/motion/delivered-moment";
import { buttonClass, Chip, cx, OwnerChip } from "@/components/ui";
import type { Client, PostWeddingRecord, TimelineTask } from "@/db/schema";
import type { BudgetSummary } from "@/lib/budget";
import {
  COUNTRY_LABELS,
  STAGES,
  STAGE_LABELS,
  TIER_LABELS,
  TIER_SHORT,
  type Person,
  type Stage,
} from "@/lib/domain";
import { formatDate, relativeDays } from "@/lib/dates";
import { coupleName, stageTone } from "@/lib/format";
import { panel } from "@/lib/motion";
import { BudgetPanel } from "./budget-panel";
import { DetailsPanel } from "./details-panel";
import { PaymentsPanel, type PaymentRow } from "./payments-panel";
import { TimelinePanel } from "./timeline-panel";
import { VendorsPanel, type AssignmentRow, type VendorOption } from "./vendors-panel";
import { WrapUpPanel } from "./wrapup-panel";

type BudgetRow = ComponentProps<typeof BudgetPanel>["lines"][number];

const BASE_TABS = [
  { key: "timeline", label: "Timeline" },
  { key: "vendors", label: "Vendors" },
  { key: "budget", label: "Budget" },
  { key: "payments", label: "Payments" },
  { key: "details", label: "Details" },
] as const;
type TabKey = (typeof BASE_TABS)[number]["key"] | "wrapup";

export function ClientWorkspace(props: {
  today: string;
  person: Person;
  initialTab?: string;
  justCreated: boolean;
  client: Client;
  tasks: TimelineTask[];
  assignments: AssignmentRow[];
  budget: BudgetRow[];
  budgetSummary: BudgetSummary;
  payments: PaymentRow[];
  paymentSummary: { scheduled: number; paid: number; outstanding: number; overdue: number };
  wrapUp: PostWeddingRecord | null;
  vendorOptions: VendorOption[];
}) {
  const { client, today } = props;
  const delivered = client.stage === "delivered";
  const tabs: { key: TabKey; label: string }[] = delivered
    ? [{ key: "wrapup", label: "Wrap-up" }, ...BASE_TABS]
    : [...BASE_TABS];

  const valid = (t?: string): t is TabKey => !!t && tabs.some((x) => x.key === t);
  const [chosenTab, setTab] = useState<TabKey>(valid(props.initialTab) ? props.initialTab : tabs[0].key);
  // If the stage moves away from delivered while on Wrap-up, fall back to a valid tab.
  const tab: TabKey = valid(chosenTab) ? chosenTab : tabs[0].key;
  const [celebrate, setCelebrate] = useState(false);
  const [stagePending, startStage] = useTransition();
  const [stageError, setStageError] = useState<string | null>(null);

  // Keep the tab in the URL (without a server round-trip) so refresh/back works.
  const selectTab = useCallback((t: TabKey) => {
    setTab(t);
    const url = new URL(window.location.href);
    url.searchParams.set("tab", t);
    url.searchParams.delete("created");
    window.history.replaceState(null, "", url);
  }, []);


  const changeStage = (stage: Stage) => {
    setStageError(null);
    startStage(async () => {
      const r = await setStage(client.id, stage);
      if (r && !r.ok) setStageError(r.error);
      else if (stage === "delivered") setCelebrate(true);
    });
  };

  const openTasks = props.tasks.filter((t) => t.status !== "done").length;
  const overdueTasks = props.tasks.filter((t) => t.status !== "done" && t.dueDate < today).length;
  const names = coupleName(client);
  const endCelebration = useCallback(() => {
    setCelebrate(false);
    selectTab("wrapup");
  }, [selectTab]);

  return (
    <>
      <DeliveredMoment
        open={celebrate}
        names={names}
        onDone={endCelebration}
      />

      <nav aria-label="Breadcrumb" className="mb-3 text-sm">
        <Link href="/clients" className="text-ink-soft hover:text-ink">
          ← Clients
        </Link>
      </nav>

      {props.justCreated && (
        <p role="status" className="mb-4 rounded-lg bg-good-wash px-3 py-2 text-sm text-good">
          Booking created — {props.tasks.length} {TIER_LABELS[client.tier]} tasks added to the timeline.
        </p>
      )}

      <header className="mb-5">
        <div className="flex flex-wrap items-center gap-2">
          <Chip tone="gold">
            {TIER_SHORT[client.tier]} · {TIER_LABELS[client.tier]}
          </Chip>
          {client.addonFoodWine && <Chip tone="ember">Food &amp; Wine</Chip>}
          <Chip tone={stageTone(client.stage)}>{STAGE_LABELS[client.stage]}</Chip>
          <OwnerChip owner={client.lead} />
        </div>
        <h1 className="mt-2 text-4xl leading-[1.05] sm:text-5xl">{names}</h1>
        <p className="mt-2 text-ink-soft">
          <span className="tabular font-medium text-ink">{formatDate(client.weddingDate)}</span>
          {" · "}
          {relativeDays(client.weddingDate, today)}
          {" · "}
          {[client.venueName, COUNTRY_LABELS[client.country]].filter(Boolean).join(", ")}
          {client.guestCount ? ` · ${client.guestCount} guests` : ""}
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <label className="sr-only" htmlFor="stage-select">
            Pipeline stage
          </label>
          <select
            id="stage-select"
            value={client.stage}
            disabled={stagePending}
            onChange={(e) => changeStage(e.target.value as Stage)}
            className="min-h-10 rounded-full border border-line-strong bg-card px-3 text-sm"
          >
            {STAGES.map((s) => (
              <option key={s} value={s}>
                Stage: {STAGE_LABELS[s]}
              </option>
            ))}
          </select>
          {!delivered && client.stage !== "lost" && (
            <button
              type="button"
              disabled={stagePending}
              onClick={() => {
                const msg =
                  client.weddingDate > today
                    ? `The wedding date hasn't happened yet. Mark ${names} as delivered anyway?`
                    : `Mark ${names} as delivered and move to wrap-up?`;
                if (window.confirm(msg)) changeStage("delivered");
              }}
              className={buttonClass("secondary", "border-gold/60")}
            >
              ✦ Mark delivered
            </button>
          )}
          <Link href={`/clients/${client.id}/edit`} className={buttonClass("ghost")}>
            Edit booking
          </Link>
        </div>
        {stageError && (
          <p role="alert" className="mt-2 text-sm text-over">
            {stageError}
          </p>
        )}
      </header>

      <div
        role="tablist"
        aria-label="Client sections"
        className="sticky top-14 z-20 -mx-4 mb-5 flex gap-1 overflow-x-auto border-b border-line bg-ivory/95 px-4 backdrop-blur sm:top-16 sm:mx-0 sm:px-0"
      >
        {tabs.map((t) => {
          const active = tab === t.key;
          const badge =
            t.key === "timeline" && overdueTasks > 0
              ? { n: overdueTasks, over: true }
              : t.key === "timeline"
                ? { n: openTasks, over: false }
                : t.key === "payments" && props.paymentSummary.overdue > 0
                  ? { n: props.payments.filter((p) => p.status === "overdue").length, over: true }
                  : null;
          return (
            <button
              key={t.key}
              role="tab"
              id={`tab-${t.key}`}
              aria-selected={active}
              aria-controls={`panel-${t.key}`}
              onClick={() => selectTab(t.key)}
              className={cx(
                "relative flex min-h-11 shrink-0 items-center gap-1.5 px-3 text-sm font-medium transition-brand",
                active ? "text-ink" : "text-ink-soft hover:text-ink",
              )}
            >
              {t.label}
              {badge && badge.n > 0 && (
                <span
                  className={cx(
                    "tabular rounded-full px-1.5 text-[11px]",
                    badge.over ? "bg-over text-white" : "bg-line text-ink-soft",
                  )}
                >
                  {badge.n}
                </span>
              )}
              {active && (
                <motion.span
                  layoutId="tab-underline"
                  className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-ember"
                />
              )}
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={tab}
          role="tabpanel"
          id={`panel-${tab}`}
          aria-labelledby={`tab-${tab}`}
          variants={panel}
          initial="initial"
          animate="animate"
          exit="exit"
        >
          {tab === "timeline" && (
            <TimelinePanel clientId={client.id} tasks={props.tasks} today={today} person={props.person} />
          )}
          {tab === "vendors" && (
            <VendorsPanel
              clientId={client.id}
              clientCountry={client.country}
              assignments={props.assignments}
              vendorOptions={props.vendorOptions}
            />
          )}
          {tab === "budget" && (
            <BudgetPanel
              clientId={client.id}
              lines={props.budget}
              summary={props.budgetSummary}
              vendorOptions={props.vendorOptions}
              assignedVendorIds={props.assignments.map((a) => a.vendorId)}
            />
          )}
          {tab === "payments" && (
            <PaymentsPanel
              clientId={client.id}
              payments={props.payments}
              summary={props.paymentSummary}
              totalFee={client.totalFeePence}
              today={today}
            />
          )}
          {tab === "details" && <DetailsPanel client={client} />}
          {tab === "wrapup" && <WrapUpPanel clientId={client.id} record={props.wrapUp} />}
        </motion.div>
      </AnimatePresence>
    </>
  );
}
