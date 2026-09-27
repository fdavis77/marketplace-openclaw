import type { Pence } from "./money";

/** Within ±2% of committed counts as on track — pennies of drift aren't news. */
export const ON_TRACK_TOLERANCE = 0.02;

export type Variance = "pending" | "under" | "on_track" | "over";

export const VARIANCE_LABELS: Record<Variance, string> = {
  pending: "No actual yet",
  under: "Under",
  on_track: "On track",
  over: "Over",
};

export function lineVariance(committed: Pence, actual: Pence | null): Variance {
  if (actual === null) return "pending";
  const tolerance = Math.abs(committed) * ON_TRACK_TOLERANCE;
  if (actual > committed + tolerance) return "over";
  if (actual < committed - tolerance) return "under";
  return "on_track";
}

export type BudgetSummary = {
  /** The couple's overall budget, if set on the booking. */
  target: Pence | null;
  committed: Pence;
  actual: Pence;
  /** Committed total for lines that have an actual — the fair comparison. */
  committedWithActuals: Pence;
  /** actual vs committed on lines that have actuals. */
  variance: Variance;
  /** Committed vs the overall target. */
  targetVariance: Variance | null;
  lineCount: number;
};

export function summariseBudget(
  lines: { committed: Pence; actual: Pence | null }[],
  target: Pence | null,
): BudgetSummary {
  let committed = 0;
  let actual = 0;
  let committedWithActuals = 0;
  let anyActual = false;
  for (const l of lines) {
    committed += l.committed;
    if (l.actual !== null) {
      anyActual = true;
      actual += l.actual;
      committedWithActuals += l.committed;
    }
  }
  return {
    target,
    committed,
    actual,
    committedWithActuals,
    variance: anyActual ? lineVariance(committedWithActuals, actual) : "pending",
    targetVariance: target && target > 0 ? lineVariance(target, committed) : null,
    lineCount: lines.length,
  };
}
