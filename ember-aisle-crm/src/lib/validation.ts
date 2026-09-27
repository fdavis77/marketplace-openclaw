import { z } from "zod";
import { isISODate } from "./dates";
import { parsePounds } from "./money";

/** What every mutating server action returns to its form. */
export type ActionResult =
  | { ok: true; message?: string; id?: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string> }
  | undefined;

const blankToNull = (v: unknown) =>
  v === undefined || v === null || (typeof v === "string" && v.trim() === "") ? null : v;

export const requiredText = (label: string, max = 200) =>
  z.preprocess(
    (v) => (typeof v === "string" ? v.trim() : v),
    z.string({ error: `${label} is required.` }).min(1, `${label} is required.`).max(max, `${label} is too long.`),
  );

export const optionalText = (max = 2000) =>
  z.preprocess(
    (v) => (typeof v === "string" ? blankToNull(v.trim()) : blankToNull(v)),
    z.string().max(max, "That's too long.").nullable(),
  );

export const optionalEmail = z.preprocess(
  (v) => (typeof v === "string" ? blankToNull(v.trim().toLowerCase()) : blankToNull(v)),
  z.email("Enter a valid email address.").nullable(),
);

export const requiredDate = (label: string) =>
  z.preprocess(
    blankToNull,
    z
      .string({ error: `${label} is required.` })
      .refine(isISODate, `${label} must be a valid date.`),
  );

export const optionalDate = z.preprocess(
  blankToNull,
  z.string().refine(isISODate, "Enter a valid date.").nullable(),
);

/** "£1,250.50" → 125050 pence. */
export const requiredPounds = (label: string) =>
  z.preprocess(
    (v) => (typeof v === "string" ? parsePounds(v) : v),
    z
      .number({ error: `${label} is required.` })
      .refine((n) => !Number.isNaN(n), `${label} must be an amount like 1250 or 1250.50.`)
      .refine((n) => n >= 0, `${label} can't be negative.`)
      .refine((n) => n <= 2_000_000_000, `${label} is too large.`),
  );

export const optionalPounds = (label: string) =>
  z.preprocess(
    (v) => (typeof v === "string" ? parsePounds(v) : blankToNull(v)),
    z
      .number()
      .refine((n) => !Number.isNaN(n), `${label} must be an amount like 1250 or 1250.50.`)
      .refine((n) => n >= 0, `${label} can't be negative.`)
      .refine((n) => n <= 2_000_000_000, `${label} is too large.`)
      .nullable(),
  );

export const optionalInt = (label: string, max = 100_000) =>
  z.preprocess(
    (v) => {
      const b = blankToNull(v);
      return typeof b === "string" ? Number(b) : b;
    },
    z
      .number()
      .int(`${label} must be a whole number.`)
      .min(0, `${label} can't be negative.`)
      .max(max, `${label} is too large.`)
      .nullable(),
  );

export const checkbox = z.preprocess((v) => v === "on" || v === "true" || v === true, z.boolean());

export const uuid = z.uuid("Invalid reference.");

export function fromForm(fd: FormData): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of fd.entries()) {
    if (k.startsWith("$")) continue; // React's internal action fields
    out[k] = typeof v === "string" ? v : null;
  }
  return out;
}

/** Turns a zod failure into a form-friendly result. */
export function invalid(error: z.ZodError): ActionResult {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".");
    if (!fieldErrors[key]) fieldErrors[key] = issue.message;
  }
  const first = Object.values(fieldErrors)[0];
  return { ok: false, error: first ?? "Please check the form.", fieldErrors };
}
