import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { OWNER_LABELS, type Owner } from "@/lib/domain";

export function cx(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(" ");
}

// ── Buttons ──────────────────────────────────────────────────────────────

type Variant = "primary" | "secondary" | "ghost" | "danger";
const variants: Record<Variant, string> = {
  primary: "bg-ember text-white hover:bg-ember-deep shadow-sm",
  secondary: "bg-card text-ink border border-line-strong hover:border-ink-soft",
  ghost: "text-ink-soft hover:text-ink hover:bg-ember-wash/60",
  danger: "bg-card text-over border border-over/40 hover:bg-over-wash",
};
const btnBase =
  "inline-flex items-center justify-center gap-2 rounded-full px-4 min-h-10 text-sm font-medium transition-brand disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap";

export function buttonClass(variant: Variant = "primary", extra?: string) {
  return cx(btnBase, variants[variant], extra);
}

export function Button({
  variant = "primary",
  className,
  ...props
}: ComponentProps<"button"> & { variant?: Variant }) {
  return <button className={buttonClass(variant, className)} {...props} />;
}

export function ButtonLink({
  variant = "primary",
  className,
  ...props
}: ComponentProps<typeof Link> & { variant?: Variant }) {
  return <Link className={buttonClass(variant, className)} {...props} />;
}

// ── Layout ───────────────────────────────────────────────────────────────

export function Card({ className, ...props }: ComponentProps<"section">) {
  return (
    <section
      className={cx("rounded-2xl border border-line bg-card shadow-[0_1px_0_rgba(42,37,34,0.03)]", className)}
      {...props}
    />
  );
}

export function PageHeader({
  eyebrow,
  title,
  actions,
  children,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow && (
          <p className="mb-1 text-xs font-medium uppercase tracking-[0.14em] text-gold-ink">{eyebrow}</p>
        )}
        <h1 className="text-3xl leading-tight sm:text-4xl">{title}</h1>
        {children}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </header>
  );
}

export function SectionTitle({ children, aside }: { children: ReactNode; aside?: ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <h2 className="text-xl">{children}</h2>
      {aside}
    </div>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-xl border border-dashed border-line-strong px-4 py-6 text-center text-sm text-ink-soft">
      {children}
    </p>
  );
}

/** Thin aged-gold rule used as a flourish under display headings. */
export function GoldRule({ className }: { className?: string }) {
  return <span aria-hidden className={cx("block h-px w-12 bg-gold", className)} />;
}

// ── Chips ────────────────────────────────────────────────────────────────

export type Tone = "neutral" | "ember" | "gold" | "good" | "over" | "pending";
const tones: Record<Tone, string> = {
  neutral: "bg-ivory text-ink-soft border-line",
  ember: "bg-ember-wash text-ember-deep border-ember/20",
  gold: "bg-gold-wash text-gold-ink border-gold/30",
  good: "bg-good-wash text-good border-good/20",
  over: "bg-over-wash text-over border-over/25",
  pending: "bg-pending-wash text-pending border-line",
};

export function Chip({ tone = "neutral", className, ...props }: ComponentProps<"span"> & { tone?: Tone }) {
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2 py-0.5 text-xs font-medium",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}

const ownerTone: Record<Owner, Tone> = { fabian: "ember", davinia: "gold", joint: "neutral" };
export function OwnerChip({ owner }: { owner: Owner }) {
  return <Chip tone={ownerTone[owner]}>{OWNER_LABELS[owner]}</Chip>;
}

// ── Form fields ──────────────────────────────────────────────────────────

export const inputClass =
  "w-full rounded-xl border border-line-strong bg-card px-3 min-h-11 text-ink placeholder:text-ink-soft/60 transition-brand focus:border-ember focus:outline-none focus:ring-2 focus:ring-ember/15 aria-[invalid=true]:border-over";

export function Field({
  label,
  name,
  error,
  hint,
  className,
  children,
}: {
  label: string;
  name: string;
  error?: string;
  hint?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cx("flex flex-col gap-1.5", className)}>
      <label htmlFor={name} className="text-sm font-medium text-ink">
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${name}-error`} className="text-xs text-over">
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs text-ink-soft">{hint}</p>
      ) : null}
    </div>
  );
}

type FieldProps = { label: string; name: string; error?: string; hint?: ReactNode; className?: string };

export function TextField({
  label,
  name,
  error,
  hint,
  className,
  ...props
}: FieldProps & Omit<ComponentProps<"input">, "name">) {
  return (
    <Field label={label} name={name} error={error} hint={hint} className={className}>
      <input
        id={name}
        name={name}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${name}-error` : undefined}
        className={inputClass}
        {...props}
      />
    </Field>
  );
}

export function SelectField({
  label,
  name,
  error,
  hint,
  className,
  options,
  placeholder,
  ...props
}: FieldProps &
  Omit<ComponentProps<"select">, "name"> & {
    options: readonly { value: string; label: string }[];
    placeholder?: string;
  }) {
  return (
    <Field label={label} name={name} error={error} hint={hint} className={className}>
      <select
        id={name}
        name={name}
        aria-invalid={error ? true : undefined}
        className={cx(inputClass, "pr-8")}
        {...props}
      >
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </Field>
  );
}

export function TextAreaField({
  label,
  name,
  error,
  hint,
  className,
  ...props
}: FieldProps & Omit<ComponentProps<"textarea">, "name">) {
  return (
    <Field label={label} name={name} error={error} hint={hint} className={className}>
      <textarea
        id={name}
        name={name}
        rows={3}
        aria-invalid={error ? true : undefined}
        className={cx(inputClass, "py-2.5")}
        {...props}
      />
    </Field>
  );
}

export function options<T extends string>(values: readonly T[], labels: Record<T, string>) {
  return values.map((v) => ({ value: v, label: labels[v] }));
}

export function Stat({ label, children, tone }: { label: string; children: ReactNode; tone?: "over" }) {
  return (
    <div className="min-w-0">
      <p className="text-xs uppercase tracking-wide text-ink-soft">{label}</p>
      <p className={cx("tabular mt-0.5 text-lg font-semibold", tone === "over" && "text-over")}>{children}</p>
    </div>
  );
}
