/**
 * Calendar-date helpers. All dates are ISO "YYYY-MM-DD" strings and all
 * arithmetic happens in UTC, so a server in any timezone gives the same answer.
 * "Today" is taken in Europe/London — the business's home timezone — so a
 * payment doesn't flip to overdue at 11pm UK time because the server is in UTC.
 */

export type ISODate = string;

const ISO_RE = /^\d{4}-\d{2}-\d{2}$/;

export function isISODate(value: unknown): value is ISODate {
  if (typeof value !== "string" || !ISO_RE.test(value)) return false;
  const d = toUTC(value);
  return !Number.isNaN(d.getTime()) && fromUTC(d) === value;
}

function toUTC(iso: ISODate): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function fromUTC(d: Date): ISODate {
  return d.toISOString().slice(0, 10);
}

export function todayISO(now: Date = new Date(), timeZone = "Europe/London"): ISODate {
  // en-CA formats as YYYY-MM-DD.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export function addDays(iso: ISODate, days: number): ISODate {
  const d = toUTC(iso);
  d.setUTCDate(d.getUTCDate() + days);
  return fromUTC(d);
}

/** Adds calendar months, clamping to the last day (31 Mar - 1 month = 28/29 Feb). */
export function addMonths(iso: ISODate, months: number): ISODate {
  const [y, m, d] = iso.split("-").map(Number);
  const targetMonthIndex = m - 1 + months;
  const lastDay = new Date(Date.UTC(y, targetMonthIndex + 1, 0)).getUTCDate();
  return fromUTC(new Date(Date.UTC(y, targetMonthIndex, Math.min(d, lastDay))));
}

/** Whole days from `a` to `b` (positive when b is later). */
export function daysBetween(a: ISODate, b: ISODate): number {
  return Math.round((toUTC(b).getTime() - toUTC(a).getTime()) / 86_400_000);
}

export function maxDate(a: ISODate, b: ISODate): ISODate {
  return a >= b ? a : b;
}

const longFmt = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});
const shortFmt = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});
const weekdayFmt = new Intl.DateTimeFormat("en-GB", {
  weekday: "short",
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});

export function formatDate(iso: ISODate | null | undefined): string {
  return iso ? longFmt.format(toUTC(iso)) : "—";
}

export function formatShortDate(iso: ISODate | null | undefined): string {
  return iso ? shortFmt.format(toUTC(iso)) : "—";
}

export function formatWeekday(iso: ISODate | null | undefined): string {
  return iso ? weekdayFmt.format(toUTC(iso)) : "—";
}

/** "in 12 days", "today", "3 days ago" — for glanceable dashboards. */
export function relativeDays(iso: ISODate, today: ISODate): string {
  const n = daysBetween(today, iso);
  if (n === 0) return "today";
  if (n === 1) return "tomorrow";
  if (n === -1) return "yesterday";
  if (n > 0) {
    if (n < 60) return `in ${n} days`;
    const months = Math.round(n / 30.44);
    return `in ${months} months`;
  }
  return `${-n} days ago`;
}
