interface WaypointProgressProps {
  steps: string[];
  currentStep: number;
}

// Progress shown as waypoints along a route, not generic numbered circles —
// the steps genuinely are a sequence, so the chart motif earns its place here.
export function WaypointProgress({ steps, currentStep }: WaypointProgressProps) {
  return (
    <ol className="flex w-full items-start" aria-label="Form progress">
      {steps.map((label, i) => {
        const isComplete = i < currentStep;
        const isCurrent = i === currentStep;
        return (
          <li key={label} className="flex flex-1 flex-col items-center last:flex-none">
            <div className="flex w-full items-center">
              <span
                aria-hidden
                className={`h-px flex-1 ${i === 0 ? "invisible" : ""} ${
                  isComplete ? "bg-brass" : "bg-navy-light"
                }`}
              />
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-xs font-display ${
                  isComplete
                    ? "border-brass bg-brass text-navy"
                    : isCurrent
                      ? "border-brass bg-transparent text-brass"
                      : "border-navy-light bg-transparent text-linen/50"
                }`}
                aria-current={isCurrent ? "step" : undefined}
              >
                {isComplete ? "✓" : i + 1}
              </span>
              <span
                aria-hidden
                className={`h-px flex-1 ${i === steps.length - 1 ? "invisible" : ""} ${
                  isComplete ? "bg-brass" : "bg-navy-light"
                }`}
              />
            </div>
            <span
              className={`mt-2 max-w-[6rem] text-center text-xs sm:text-sm ${
                isCurrent ? "text-brass font-semibold" : "text-linen/60"
              }`}
            >
              {label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
