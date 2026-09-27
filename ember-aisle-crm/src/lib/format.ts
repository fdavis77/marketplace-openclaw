import type { Stage } from "./domain";

export function coupleName(c: { partnerOneName: string; partnerTwoName: string }) {
  return `${c.partnerOneName} & ${c.partnerTwoName}`;
}

export function stageTone(s: Stage) {
  if (s === "delivered") return "good" as const;
  if (s === "lost") return "pending" as const;
  if (s === "booked" || s === "planning") return "ember" as const;
  return "gold" as const;
}
