"use client";

import { animate, useReducedMotion } from "motion/react";
import { useEffect, useRef } from "react";
import { DURATION, EASE } from "@/lib/motion";

/**
 * Counts up to `value` on mount. The server renders the final number, so the
 * real figure is on screen even before (or without) JavaScript — the
 * animation only replays it once hydrated.
 */
export function CountUp({ value, format }: { value: number; format?: "gbp" }) {
  const ref = useRef<HTMLSpanElement>(null);
  const reduce = useReducedMotion();
  const text = (n: number) =>
    format === "gbp"
      ? new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(
          n / 100,
        )
      : String(Math.round(n));

  useEffect(() => {
    const el = ref.current;
    if (!el || reduce || value === 0) return;
    const controls = animate(0, value, {
      duration: DURATION.data,
      ease: EASE,
      onUpdate: (n) => {
        el.textContent = text(n);
      },
    });
    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, reduce]);

  return (
    <span ref={ref} className="tabular" aria-label={text(value)}>
      {text(value)}
    </span>
  );
}
