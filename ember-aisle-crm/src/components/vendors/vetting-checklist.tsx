"use client";

import { useOptimistic, useTransition } from "react";
import { setVettingCheck } from "@/actions/vendors";
import { cx } from "@/components/ui";
import { VETTING_CHECKS, type VettingKey } from "@/lib/domain";
import { formatDate } from "@/lib/dates";

type Values = Record<VettingKey, string | null>;

/** One tap marks a check done today (or clears it). */
export function VettingChecklist({ vendorId, values }: { vendorId: string; values: Values }) {
  const [optimistic, set] = useOptimistic(values);
  const [, start] = useTransition();
  return (
    <ul className="divide-y divide-line">
      {VETTING_CHECKS.map((c) => {
        const date = optimistic[c.key];
        return (
          <li key={c.key} className="flex items-center justify-between gap-3 py-2.5">
            <div>
              <p className="text-sm font-medium">{c.label}</p>
              <p className={cx("text-xs", date ? "text-good" : "text-ink-soft")}>
                {date ? `Done ${formatDate(date)}` : "Not done"}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                if (date && !window.confirm(`Clear “${c.label}”?`)) return;
                start(async () => {
                  set({ ...optimistic, [c.key]: date ? null : new Date().toISOString().slice(0, 10) });
                  const r = await setVettingCheck(vendorId, c.key, !date);
                  if (r && !r.ok) window.alert(r.error);
                });
              }}
              className={cx(
                "min-h-9 rounded-full border px-3 text-xs font-medium transition-brand",
                date ? "border-line text-ink-soft hover:text-ink" : "border-good/40 bg-good-wash text-good",
              )}
            >
              {date ? "Clear" : "Mark done today"}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
