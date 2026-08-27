import { differenceInCalendarDays, format } from "date-fns";

export function formatEventRange(startAt: string, endAt: string | null) {
  const start = new Date(startAt);
  const end = endAt ? new Date(endAt) : null;
  const datePart = format(start, "EEE d MMM yyyy");
  const timePart = format(start, "HH:mm");
  if (end && format(end, "yyyy-MM-dd") === format(start, "yyyy-MM-dd")) {
    return `${datePart} · ${timePart}–${format(end, "HH:mm")}`;
  }
  return `${datePart} · ${timePart}`;
}

export function formatDeadline(deadlineAt: string) {
  const deadline = new Date(deadlineAt);
  const days = differenceInCalendarDays(deadline, new Date());
  if (days < 0) return "Closed";
  if (days === 0) return "Closes today";
  if (days === 1) return "1 day left";
  return `${days} days left`;
}

export function isPastDeadline(deadlineAt: string) {
  return new Date(deadlineAt).getTime() < Date.now();
}

/** Formats an ISO timestamp for a <input type="datetime-local"> defaultValue. */
export function toLocalInput(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
