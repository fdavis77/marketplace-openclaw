"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { createBudgetLine, deleteBudgetLine, updateBudgetLine } from "@/actions/money";
import { ActionForm, SubmitButton } from "@/components/forms";
import { BudgetBar } from "@/components/motion/budget-bar";
import { useAction } from "@/components/use-action";
import {
  Button,
  Card,
  Chip,
  EmptyState,
  Field,
  inputClass,
  options,
  SelectField,
  Stat,
  TextAreaField,
  TextField,
  type Tone,
} from "@/components/ui";
import { lineVariance, VARIANCE_LABELS, type BudgetSummary, type Variance } from "@/lib/budget";
import { BUDGET_CATEGORIES, BUDGET_CATEGORY_LABELS, type BudgetCategory } from "@/lib/domain";
import { formatGBP, penceToInput } from "@/lib/money";
import { reveal } from "@/lib/motion";
import type { VendorOption } from "./vendors-panel";

type Line = {
  id: string;
  category: BudgetCategory;
  description: string | null;
  committedPence: number;
  actualPence: number | null;
  vendorId: string | null;
  vendorName: string | null;
  notes: string | null;
};

const varianceTone: Record<Variance, Tone> = {
  pending: "pending",
  under: "good",
  on_track: "good",
  over: "over",
};

export function BudgetPanel({
  clientId,
  lines,
  summary,
  vendorOptions,
  assignedVendorIds,
}: {
  clientId: string;
  lines: Line[];
  summary: BudgetSummary;
  vendorOptions: VendorOption[];
  assignedVendorIds: string[];
}) {
  const [editing, setEditing] = useState<string | "new" | null>(null);
  const diff = summary.actual - summary.committedWithActuals;

  return (
    <div className="flex flex-col gap-4">
      <Card className="p-4 sm:p-5">
        <div className="mb-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Stat label="Couple's budget">{formatGBP(summary.target)}</Stat>
          <Stat label="Committed" tone={summary.targetVariance === "over" ? "over" : undefined}>
            {formatGBP(summary.committed)}
          </Stat>
          <Stat label="Actual so far">{formatGBP(summary.actual)}</Stat>
          <div>
            <p className="text-xs uppercase tracking-wide text-ink-soft">Variance</p>
            <div className="mt-1 flex items-center gap-2">
              <Chip tone={varianceTone[summary.variance]}>{VARIANCE_LABELS[summary.variance]}</Chip>
              {summary.variance !== "pending" && (
                <span className={`tabular text-sm ${diff > 0 ? "text-over" : "text-good"}`}>
                  {diff > 0 ? "+" : diff < 0 ? "−" : ""}
                  {formatGBP(Math.abs(diff))}
                </span>
              )}
            </div>
          </div>
        </div>
        <BudgetBar committed={summary.committed} actual={summary.actual} target={summary.target} />
        {summary.targetVariance === "over" && summary.target && (
          <p className="mt-3 rounded-lg bg-over-wash px-3 py-2 text-sm text-over">
            Committed spend is {formatGBP(summary.committed - summary.target)} over the couple&rsquo;s budget.
          </p>
        )}
        <p className="mt-2 text-xs text-ink-soft">
          Variance compares actual against committed on lines that have an actual. Within ±2% counts as on track.
        </p>
      </Card>

      <div className="flex justify-end">
        <Button onClick={() => setEditing(editing === "new" ? null : "new")}>
          {editing === "new" ? "Close" : "+ Add budget line"}
        </Button>
      </div>

      <AnimatePresence initial={false}>
        {editing === "new" && (
          <motion.div key="new" {...reveal} className="overflow-hidden">
            <Card className="p-4">
              <LineForm
                action={createBudgetLine.bind(null, clientId)}
                vendorOptions={vendorOptions}
                assignedVendorIds={assignedVendorIds}
                onDone={() => setEditing(null)}
              />
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {lines.length === 0 ? (
        <EmptyState>No budget lines yet.</EmptyState>
      ) : (
        <Card className="p-2 sm:p-3">
          <ul className="divide-y divide-line">
            {lines.map((l) => {
              const v = lineVariance(l.committedPence, l.actualPence);
              return (
                <li key={l.id} className="px-2 py-3">
                  <button
                    type="button"
                    className="flex w-full items-start justify-between gap-3 text-left"
                    onClick={() => setEditing(editing === l.id ? null : l.id)}
                    aria-expanded={editing === l.id}
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{BUDGET_CATEGORY_LABELS[l.category]}</p>
                      <p className="truncate text-xs text-ink-soft">
                        {[l.description, l.vendorName].filter(Boolean).join(" · ") || "—"}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <p className="tabular text-sm">
                        <span className="text-ink-soft">{formatGBP(l.committedPence)}</span>
                        {" → "}
                        <span className="font-semibold">{formatGBP(l.actualPence)}</span>
                      </p>
                      <Chip tone={varianceTone[v]}>{VARIANCE_LABELS[v]}</Chip>
                    </div>
                  </button>
                  <AnimatePresence initial={false}>
                    {editing === l.id && (
                      <motion.div key="e" {...reveal} className="overflow-hidden">
                        <div className="mt-3 rounded-xl bg-ivory p-3">
                          <LineForm
                            action={updateBudgetLine.bind(null, l.id)}
                            line={l}
                            vendorOptions={vendorOptions}
                            assignedVendorIds={assignedVendorIds}
                            onDone={() => setEditing(null)}
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </li>
              );
            })}
          </ul>
        </Card>
      )}
    </div>
  );
}

function LineForm({
  action,
  line,
  vendorOptions,
  assignedVendorIds,
  onDone,
}: {
  action: Parameters<typeof ActionForm>[0]["action"];
  line?: Line;
  vendorOptions: VendorOption[];
  assignedVendorIds: string[];
  onDone: () => void;
}) {
  const del = useAction();
  const assigned = vendorOptions.filter((v) => assignedVendorIds.includes(v.id));
  const others = vendorOptions.filter((v) => !assignedVendorIds.includes(v.id));
  return (
    <ActionForm action={action} onSuccess={onDone} resetOnSuccess={!line}>
      {(e, pending) => (
        <div className="grid gap-3 sm:grid-cols-2">
          <SelectField
            label="Category"
            name="category"
            defaultValue={line?.category ?? ""}
            placeholder="Choose…"
            options={options(BUDGET_CATEGORIES, BUDGET_CATEGORY_LABELS)}
            error={e.category}
          />
          <TextField label="Description" name="description" defaultValue={line?.description ?? ""} error={e.description} />
          <TextField label="Committed (£)" name="committed" inputMode="decimal" defaultValue={penceToInput(line?.committedPence)} error={e.committed} required />
          <TextField label="Actual (£)" name="actual" inputMode="decimal" defaultValue={penceToInput(line?.actualPence)} error={e.actual} hint="Leave blank until invoiced." />
          <Field label="Vendor (optional)" name="vendorId" className="sm:col-span-2">
            <select id="vendorId" name="vendorId" defaultValue={line?.vendorId ?? ""} className={inputClass}>
              <option value="">None</option>
              {assigned.length > 0 && (
                <optgroup label="On this booking">
                  {assigned.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name}
                    </option>
                  ))}
                </optgroup>
              )}
              <optgroup label="Directory">
                {others.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
              </optgroup>
            </select>
          </Field>
          <TextAreaField label="Notes" name="notes" rows={2} defaultValue={line?.notes ?? ""} className="sm:col-span-2" />
          <div className="flex flex-wrap justify-between gap-2 sm:col-span-2">
            {line ? (
              <Button
                type="button"
                variant="danger"
                disabled={del.pending}
                onClick={() => del.run(() => deleteBudgetLine(line.id), { confirm: "Delete this budget line?" })}
              >
                Delete
              </Button>
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              <Button type="button" variant="ghost" onClick={onDone}>
                Cancel
              </Button>
              <SubmitButton pending={pending}>{line ? "Save" : "Add line"}</SubmitButton>
            </div>
          </div>
          {del.error && <p className="text-sm text-over sm:col-span-2">{del.error}</p>}
        </div>
      )}
    </ActionForm>
  );
}
