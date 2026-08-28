import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-tight",
  {
    variants: {
      variant: {
        default: "bg-accent-soft text-[var(--color-accent-800)]",
        outline: "border border-border text-muted",
        solid: "bg-accent text-accent-foreground",
        accent2: "bg-accent-2-soft text-[var(--color-accent-2-800)]",
        solid2: "bg-accent-2 text-accent-2-foreground",
        warning: "bg-red-100 text-red-800",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

function Badge({
  className,
  variant,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ variant, className }))} {...props} />;
}

export { Badge, badgeVariants };
