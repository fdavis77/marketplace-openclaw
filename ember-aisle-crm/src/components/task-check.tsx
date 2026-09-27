"use client";

import { motion } from "motion/react";
import { useOptimistic, useTransition } from "react";
import { setTaskStatus } from "@/actions/tasks";
import type { TaskStatus } from "@/lib/domain";
import { transition } from "@/lib/motion";
import { cx } from "./ui";

/**
 * Tick-box for a task. Updates instantly (optimistic) and animates the tick
 * drawing in; if the save fails it springs back.
 */
export function TaskCheck({
  taskId,
  status,
  label,
  onChange,
}: {
  taskId: string;
  status: TaskStatus;
  label: string;
  onChange?: (done: boolean) => void;
}) {
  const [optimistic, setOptimistic] = useOptimistic(status);
  const [, startTransition] = useTransition();
  const done = optimistic === "done";

  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={done}
      aria-label={done ? `Mark “${label}” not done` : `Mark “${label}” done`}
      onClick={() => {
        const next: TaskStatus = done ? "not_started" : "done";
        onChange?.(next === "done");
        startTransition(async () => {
          setOptimistic(next);
          const r = await setTaskStatus(taskId, next);
          if (r && !r.ok) {
            onChange?.(next !== "done"); // roll the strike-through back too
            window.alert(r.error);
          }
        });
      }}
      className="-m-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-brand hover:bg-ember-wash/60"
    >
      <motion.span
        className={cx(
          "flex h-6 w-6 items-center justify-center rounded-full border-[1.5px]",
          done ? "border-good bg-good" : optimistic === "in_progress" ? "border-gold" : "border-line-strong",
        )}
        animate={{ scale: done ? [1, 1.15, 1] : 1 }}
        transition={transition.slow}
      >
        <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" aria-hidden>
          <motion.path
            d="M3.5 8.5l3 3 6-6.5"
            fill="none"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={false}
            animate={{ pathLength: done ? 1 : 0, opacity: done ? 1 : 0 }}
            transition={transition.slow}
          />
        </svg>
      </motion.span>
    </button>
  );
}
