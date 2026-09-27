"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useMemo, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { DURATION, EASE } from "@/lib/motion";

/**
 * The one flourish in the app: marking a wedding delivered. Gold and ember
 * petals drift down behind the couple's names. Tap anywhere (or Esc) to
 * dismiss; it also clears itself. Nothing underneath is blocked for long.
 */
export function DeliveredMoment({
  open,
  names,
  onDone,
}: {
  open: boolean;
  names: string;
  onDone: () => void;
}) {
  const reduce = useReducedMotion();
  // Portal to <body>: the page wrapper animates with a transform, which would
  // otherwise trap this fixed overlay inside the main column.
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(onDone, reduce ? 1600 : 3200);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onDone();
    window.addEventListener("keydown", onKey);
    return () => {
      clearTimeout(t);
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onDone, reduce]);

  const petals = useMemo(
    () =>
      Array.from({ length: 28 }, (_, i) => ({
        id: i,
        left: (i * 37) % 100,
        delay: (i % 7) * 0.12,
        drift: ((i * 53) % 60) - 30,
        rotate: ((i * 71) % 180) - 90,
        size: 8 + ((i * 13) % 10),
        gold: i % 3 !== 0,
      })),
    [],
  );

  if (!mounted) return null;
  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          role="status"
          aria-live="polite"
          className="fixed inset-0 z-50 flex cursor-pointer items-center justify-center overflow-hidden bg-ink/70 backdrop-blur-[2px]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { duration: DURATION.slow, ease: EASE } }}
          exit={{ opacity: 0, transition: { duration: DURATION.base, ease: EASE } }}
          onClick={onDone}
        >
          {!reduce &&
            petals.map((p) => (
              <motion.span
                key={p.id}
                aria-hidden
                className={`absolute top-0 block rounded-[60%_0_60%_0] ${p.gold ? "bg-gold" : "bg-ember"}`}
                style={{ left: `${p.left}%`, width: p.size, height: p.size }}
                initial={{ y: -40, x: 0, rotate: 0, opacity: 0 }}
                animate={{
                  y: "105vh",
                  x: p.drift * 3,
                  rotate: p.rotate * 4,
                  opacity: [0, 1, 1, 0],
                }}
                transition={{ duration: 2.6, delay: p.delay, ease: "easeIn" }}
              />
            ))}
          <motion.div
            className="relative mx-6 max-w-md rounded-3xl border border-gold/40 bg-card px-8 py-10 text-center shadow-2xl"
            initial={{ scale: 0.94, y: 12, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1, transition: { duration: DURATION.moment / 2, ease: EASE } }}
          >
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-gold-ink">Delivered</p>
            <motion.span
              aria-hidden
              className="mx-auto mt-3 block h-px bg-gold"
              initial={{ width: 0 }}
              animate={{ width: 64, transition: { delay: 0.25, duration: DURATION.moment / 2, ease: EASE } }}
            />
            <h2 className="mt-4 text-3xl leading-tight sm:text-4xl">{names}</h2>
            <p className="mt-3 text-sm text-ink-soft">
              Another wedding beautifully done. It&rsquo;s now in wrap-up — testimonial, consent and debrief.
            </p>
            <p className="mt-6 text-xs text-ink-soft">Tap anywhere to continue</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
