"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { createPayment, deletePayment, markPaymentPaid, updatePayment } from "@/actions/money";
import { ActionForm, SubmitButton } from "@/components/forms";
import { useAction } from "@/components/use-action";
import {
  Button,
  Card,
  Chip,
  cx,
  EmptyState,
  options,
  SelectField,
  Stat,
  TextAreaField,
  TextField,
  type Tone,
} from "@/components/ui";
import type { Payment } from "@/db/schema";
import {
  PAYMENT_METHODS,
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUS_LABELS,
  PAYMENT_TYPES,
  PAYMENT_TYPE_LABELS,
  type PaymentStatus,
} from "@/lib/domain";
import { formatDate, relativeDays } from "@/lib/dates";
import { formatGBP, penceToInput } from "@/lib/money";
import { reveal } from "@/lib/motion";

export type PaymentRow = Payment & { status: PaymentStatus };

const statusTone: Record<PaymentStatus, Tone> = {
  upcoming: "neutral",
  due: "gold",
  overdue: "over",
  paid: "good",
};

export function PaymentsPanel({
  clientId,
  payments,
  summary,
  totalFee,
  today,
}: {
  clientId: string;
  payments: PaymentRow[];
  summary: { scheduled: number; paid: number; outstanding: number; overdue: number };
  totalFee: number;
  today: string;
}) {
  const [editing, setEditing] = useState<string | "new" | null>(null);
  const gap = totalFee - summary.scheduled;

  return (
    <div className="flex flex-col gap-4">
      <Card className="p-4 sm:p-5">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Stat label="Total fee">{formatGBP(totalFee)}</Stat>
          <Stat label="Paid">{formatGBP(summary.paid)}</Stat>
          <Stat label="Outstanding">{formatGBP(summary.outstanding)}</Stat>
          <Stat label="Overdue" tone={summary.overdue > 0 ? "over" : undefined}>
            {formatGBP(summary.overdue)}
          </Stat>
        </div>
        {payments.length > 0 && gap !== 0 && (
          <p className="mt-3 rounded-lg bg-gold-wash px-3 py-2 text-sm text-gold-ink">
            The schedule adds up to {formatGBP(summary.scheduled)} —{" "}
            {gap > 0 ? `${formatGBP(gap)} short of` : `${formatGBP(-gap)} more than`} the {formatGBP(totalFee)} fee.
          </p>
        )}
      </Card>

      <div className="flex justify-end">
        <Button onClick={() => setEditing(editing === "new" ? null : "new")}>
          {editing === "new" ? "Close" : "+ Add payment"}
        </Button>
      </div>

      <AnimatePresence initial={false}>
        {editing === "new" && (
          <motion.div key="new" {...reveal} className="overflow-hidden">
            <Card className="p-4">
              <PaymentForm
                action={createPayment.bind(null, clientId)}
                suggestedType={payments.length === 0 ? "deposit" : "milestone"}
                today={today}
                onDone={() => setEditing(null)}
              />
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {payments.length === 0 ? (
        <EmptyState>No payments scheduled yet.</EmptyState>
      ) : (
        <Card className="p-2 sm:p-3">
          <ul className="divide-y divide-line">
            {payments.map((p) => (
              <PaymentItem
                key={p.id}
                p={p}
                today={today}
                editing={editing === p.id}
                onToggle={() => setEditing(editing === p.id ? null : p.id)}
                onClose={() => setEditing(null)}
              />
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}

function PaymentItem({
  p,
  today,
  editing,
  onToggle,
  onClose,
}: {
  p: PaymentRow;
  today: string;
  editing: boolean;
  onToggle: () => void;
  onClose: () => void;
}) {
  const pay = useAction();
  return (
    <li className={cx("px-2 py-3", p.status === "overdue" && "bg-over-wash/40")}>
      <div className="flex items-start justify-between gap-3">
        <button type="button" className="min-w-0 text-left" onClick={onToggle} aria-expanded={editing}>
          <p className="text-sm font-medium">{p.label || PAYMENT_TYPE_LABELS[p.type]}</p>
          <p className="text-xs text-ink-soft">
            {p.paidDate
              ? `Paid ${formatDate(p.paidDate)}${p.method ? ` · ${PAYMENT_METHOD_LABELS[p.method]}` : ""}`
              : `Due ${formatDate(p.dueDate)} · ${relativeDays(p.dueDate, today)}`}
          </p>
        </button>
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <span className="tabular text-sm font-semibold">{formatGBP(p.amountPence)}</span>
          <Chip tone={statusTone[p.status]}>{PAYMENT_STATUS_LABELS[p.status]}</Chip>
        </div>
      </div>
      {!p.paidDate && (
        <div className="mt-2">
          <Button
            variant="secondary"
            className="min-h-9 px-3 text-xs"
            disabled={pay.pending}
            onClick={() =>
              pay.run(() => markPaymentPaid(p.id, p.method), {
                confirm: `Mark ${formatGBP(p.amountPence)} as paid today?`,
              })
            }
          >
            {pay.pending ? "Saving…" : "✓ Mark paid today"}
          </Button>
          {pay.error && <p className="mt-1 text-xs text-over">{pay.error}</p>}
        </div>
      )}
      <AnimatePresence initial={false}>
        {editing && (
          <motion.div key="e" {...reveal} className="overflow-hidden">
            <div className="mt-3 rounded-xl bg-ivory p-3">
              <PaymentForm action={updatePayment.bind(null, p.id)} payment={p} today={today} onDone={onClose} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </li>
  );
}

function PaymentForm({
  action,
  payment,
  suggestedType,
  today,
  onDone,
}: {
  action: Parameters<typeof ActionForm>[0]["action"];
  payment?: Payment;
  suggestedType?: "deposit" | "milestone";
  today: string;
  onDone: () => void;
}) {
  const del = useAction();
  return (
    <ActionForm action={action} onSuccess={onDone} resetOnSuccess={!payment}>
      {(e, pending) => (
        <div className="grid gap-3 sm:grid-cols-2">
          <SelectField label="Type" name="type" defaultValue={payment?.type ?? suggestedType} options={options(PAYMENT_TYPES, PAYMENT_TYPE_LABELS)} />
          <TextField label="Label (optional)" name="label" defaultValue={payment?.label ?? ""} placeholder="e.g. 50% on venue signing" error={e.label} />
          <TextField label="Amount (£)" name="amount" inputMode="decimal" defaultValue={penceToInput(payment?.amountPence)} error={e.amount} required />
          <TextField label="Due date" name="dueDate" type="date" defaultValue={payment?.dueDate ?? today} error={e.dueDate} required />
          <TextField label="Paid on" name="paidDate" type="date" defaultValue={payment?.paidDate ?? ""} error={e.paidDate} hint="Leave blank until received." />
          <SelectField label="Method" name="method" defaultValue={payment?.method ?? ""} placeholder="—" options={options(PAYMENT_METHODS, PAYMENT_METHOD_LABELS)} />
          <TextAreaField label="Notes" name="notes" rows={2} defaultValue={payment?.notes ?? ""} className="sm:col-span-2" />
          <div className="flex flex-wrap justify-between gap-2 sm:col-span-2">
            {payment ? (
              <Button
                type="button"
                variant="danger"
                disabled={del.pending}
                onClick={() => del.run(() => deletePayment(payment.id), { confirm: "Delete this payment?" })}
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
              <SubmitButton pending={pending}>{payment ? "Save" : "Add payment"}</SubmitButton>
            </div>
          </div>
          {del.error && <p className="text-sm text-over sm:col-span-2">{del.error}</p>}
        </div>
      )}
    </ActionForm>
  );
}
