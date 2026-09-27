/**
 * Money is stored as integer pence so sums never drift (0.1 + 0.2 problems).
 * Everything the user sees or types is pounds; convert only at the edges.
 */

export type Pence = number;

const gbp = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const gbpWhole = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
  maximumFractionDigits: 0,
});

export function formatGBP(pence: Pence | null | undefined, opts?: { whole?: boolean }): string {
  if (pence === null || pence === undefined) return "—";
  const pounds = pence / 100;
  if (opts?.whole) return gbpWhole.format(pounds);
  // Show pennies only when there are some.
  return pence % 100 === 0 ? gbpWhole.format(pounds) : gbp.format(pounds);
}

/**
 * Parses "£1,250.50", "1250.5", "1250" → pence. Returns null for blank input
 * and NaN for anything unparseable, so callers can tell "empty" from "invalid".
 */
export function parsePounds(input: string | null | undefined): Pence | null {
  if (input === null || input === undefined) return null;
  const cleaned = input.replace(/[£,\s]/g, "");
  if (cleaned === "") return null;
  if (!/^-?\d+(\.\d{1,2})?$/.test(cleaned)) return Number.NaN;
  const [whole, frac = ""] = cleaned.replace("-", "").split(".");
  const pence = Number(whole) * 100 + Number(frac.padEnd(2, "0"));
  return cleaned.startsWith("-") ? -pence : pence;
}

/** For pre-filling inputs: 125050 → "1250.50", 125000 → "1250". */
export function penceToInput(pence: Pence | null | undefined): string {
  if (pence === null || pence === undefined) return "";
  const sign = pence < 0 ? "-" : "";
  const abs = Math.abs(pence);
  const whole = Math.floor(abs / 100);
  const frac = abs % 100;
  return frac === 0 ? `${sign}${whole}` : `${sign}${whole}.${String(frac).padStart(2, "0")}`;
}
