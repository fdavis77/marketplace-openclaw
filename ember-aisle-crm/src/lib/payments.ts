import type { PaymentStatus } from "./domain";
import { addDays, type ISODate } from "./dates";

/** A payment counts as "due" (rather than "upcoming") inside this many days. */
export const DUE_SOON_DAYS = 7;

/**
 * Status is derived from dates each time it's shown, never stored, so nothing
 * needs a nightly job to flip "due" into "overdue".
 */
export function paymentStatus(
  p: { dueDate: ISODate; paidDate: ISODate | null },
  today: ISODate,
): PaymentStatus {
  if (p.paidDate) return "paid";
  if (p.dueDate < today) return "overdue";
  if (p.dueDate <= addDays(today, DUE_SOON_DAYS)) return "due";
  return "upcoming";
}

export function summarisePayments(
  payments: { amount: number; dueDate: ISODate; paidDate: ISODate | null }[],
  today: ISODate,
) {
  let scheduled = 0;
  let paid = 0;
  let overdue = 0;
  for (const p of payments) {
    scheduled += p.amount;
    const s = paymentStatus(p, today);
    if (s === "paid") paid += p.amount;
    if (s === "overdue") overdue += p.amount;
  }
  return { scheduled, paid, outstanding: scheduled - paid, overdue };
}
