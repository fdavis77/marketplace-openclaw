"use client";

import { MotionConfig } from "motion/react";
import type { ReactNode } from "react";
import { EASE, DURATION } from "@/lib/motion";

/** Honours the OS "reduce motion" setting everywhere and sets default timing. */
export function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <MotionConfig reducedMotion="user" transition={{ duration: DURATION.base, ease: EASE }}>
      {children}
    </MotionConfig>
  );
}
