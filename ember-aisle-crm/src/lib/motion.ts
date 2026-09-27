/**
 * The single motion vocabulary for the app. Every animated component pulls
 * its timing from here; CSS equivalents live in globals.css
 * (--ease-brand, `transition-brand` = 150ms, `animate-page-in` = 200ms).
 *
 * Rules:
 *  - UI transitions stay between 150–250ms.
 *  - Nothing animates row-by-row in tables or lists.
 *  - Content is never hidden waiting for an animation (no opacity:0 on
 *    server-rendered content that only JS can reveal).
 *  - The one exception to "keep it short" is the Delivered moment.
 */

export const EASE = [0.22, 1, 0.36, 1] as const;

export const DURATION = {
  fast: 0.15,
  base: 0.2,
  slow: 0.25,
  /** Count-ups and budget bars: long enough to read as motion, short enough not to wait on. */
  data: 0.6,
  /** The Delivered celebration only. */
  moment: 1.4,
} as const;

export const transition = {
  fast: { duration: DURATION.fast, ease: EASE },
  base: { duration: DURATION.base, ease: EASE },
  slow: { duration: DURATION.slow, ease: EASE },
  data: { duration: DURATION.data, ease: EASE },
} as const;

/** Panel swaps (client tabs): soft fade + short slide. */
export const panel = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0, transition: transition.base },
  exit: { opacity: 0, y: -4, transition: transition.fast },
} as const;

/** Inline editors/disclosures opening. */
export const reveal = {
  initial: { opacity: 0, height: 0 },
  animate: { opacity: 1, height: "auto", transition: transition.base },
  exit: { opacity: 0, height: 0, transition: transition.fast },
} as const;
