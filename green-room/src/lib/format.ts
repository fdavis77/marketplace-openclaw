import { differenceInCalendarDays, format } from "date-fns";

export function formatDate(dateStr: string) {
  return format(new Date(dateStr), "d MMM yyyy");
}

export function formatDateTime(dateStr: string) {
  return format(new Date(dateStr), "EEE d MMM yyyy · HH:mm");
}

/** "3 days left" / "Today" / "2 days ago" — for deadlines and audition dates. */
export function relativeDays(dateStr: string) {
  const days = differenceInCalendarDays(new Date(dateStr), new Date());
  if (days === 0) return "Today";
  if (days > 0) return days === 1 ? "1 day left" : `${days} days left`;
  const past = Math.abs(days);
  return past === 1 ? "1 day ago" : `${past} days ago`;
}

export function isPast(dateStr: string) {
  return new Date(dateStr).getTime() < Date.now();
}

/** Formats an ISO timestamp for a <input type="datetime-local"> defaultValue. */
export function toLocalInput(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Formats a date (no time) for a <input type="date"> defaultValue. */
export function toDateInput(dateStr: string) {
  return dateStr.slice(0, 10);
}
