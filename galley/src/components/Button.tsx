import { type ButtonHTMLAttributes, type ReactNode } from "react";
import { Link } from "react-router-dom";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
}

const variants = {
  primary: "bg-brass text-navy hover:bg-brass-light",
  secondary: "border border-brass text-brass hover:bg-brass/10",
  ghost: "text-navy hover:bg-navy/5",
};

const base =
  "inline-flex items-center justify-center gap-2 rounded-md px-6 py-3 font-body font-semibold tracking-wide transition-colors disabled:cursor-not-allowed disabled:opacity-50";

export function Button({ variant = "primary", className = "", ...props }: ButtonProps) {
  return <button className={`${base} ${variants[variant]} ${className}`} {...props} />;
}

export function LinkButton({
  to,
  variant = "primary",
  className = "",
  children,
}: {
  to: string;
  variant?: "primary" | "secondary" | "ghost";
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link to={to} className={`${base} ${variants[variant]} ${className}`}>
      {children}
    </Link>
  );
}
