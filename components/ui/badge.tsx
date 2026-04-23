import type { HTMLAttributes } from "react";

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: "default" | "secondary";
};

export function Badge({ className = "", variant = "default", ...props }: BadgeProps) {
  const variantClass =
    variant === "secondary"
      ? "bg-slate-800 text-slate-200 border-slate-700"
      : "bg-indigo-500/20 text-indigo-200 border-indigo-400/40";

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-transform duration-200 ease-out hover:scale-[1.04] active:scale-[0.98] ${variantClass} ${className}`}
      {...props}
    />
  );
}
