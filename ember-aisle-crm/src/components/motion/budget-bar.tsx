"use client";

import { motion } from "motion/react";
import { transition } from "@/lib/motion";
import { formatGBP } from "@/lib/money";

/**
 * Committed vs actual. The track is the committed amount (or the couple's
 * target if larger); the fill is actual spend, and anything over committed
 * shows in the "over" colour. Widths animate from their previous value when
 * figures change. The bar is supplementary: the same figures are always
 * printed as text next to it, so nothing depends on the animation running.
 */
export function BudgetBar({
  committed,
  actual,
  target,
}: {
  committed: number;
  actual: number;
  target: number | null;
}) {
  const scale = Math.max(committed, actual, target ?? 0, 1);
  const pct = (n: number) => `${Math.min(100, (n / scale) * 100)}%`;
  const within = Math.min(actual, committed);
  const over = Math.max(0, actual - committed);

  return (
    <div>
      <div
        className="relative h-3 overflow-hidden rounded-full bg-ivory ring-1 ring-line"
        role="img"
        aria-label={`Actual ${formatGBP(actual)} of ${formatGBP(committed)} committed${
          target ? `, target ${formatGBP(target)}` : ""
        }`}
      >
        {/* committed */}
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full bg-gold-wash"
          initial={false}
          animate={{ width: pct(committed) }}
          transition={transition.data}
        />
        {/* actual within committed */}
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full bg-gold"
          initial={{ width: 0 }}
          animate={{ width: pct(within) }}
          transition={transition.data}
        />
        {/* overspend */}
        <motion.div
          className="absolute inset-y-0 rounded-r-full bg-over"
          style={{ left: pct(committed) }}
          initial={{ width: 0 }}
          animate={{ width: pct(over) }}
          transition={transition.data}
        />
        {target ? (
          <span
            aria-hidden
            className="absolute inset-y-[-2px] w-0.5 bg-ink"
            style={{ left: `calc(${pct(target)} - 1px)` }}
          />
        ) : null}
      </div>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-soft">
        <Legend className="bg-gold" label="Actual" />
        <Legend className="bg-gold-wash ring-1 ring-line" label="Committed" />
        {over > 0 && <Legend className="bg-over" label="Over committed" />}
        {target ? <Legend className="h-3 w-0.5 rounded-none bg-ink" label="Couple's budget" /> : null}
      </div>
    </div>
  );
}

function Legend({ className, label }: { className: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span aria-hidden className={`inline-block h-2.5 w-2.5 rounded-full ${className}`} />
      {label}
    </span>
  );
}
