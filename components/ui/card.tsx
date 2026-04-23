import type { HTMLAttributes } from "react";

type DivProps = HTMLAttributes<HTMLDivElement>;

export function Card({ className = "", ...props }: DivProps) {
  return (
    <div
      className={`rounded-xl border border-slate-700/50 bg-slate-900/80 shadow-[0_12px_36px_rgba(2,6,23,0.35)] backdrop-blur transition-[box-shadow,border-color,transform] duration-300 ease-out ${className}`}
      {...props}
    />
  );
}

export function CardHeader({ className = "", ...props }: DivProps) {
  return <div className={`p-4 pb-2 ${className}`} {...props} />;
}

export function CardTitle({ className = "", ...props }: DivProps) {
  return (
    <h3
      className={`text-sm font-medium tracking-tight text-slate-300 ${className}`}
      {...props}
    />
  );
}

export function CardContent({ className = "", ...props }: DivProps) {
  return <div className={`p-4 pt-2 ${className}`} {...props} />;
}
