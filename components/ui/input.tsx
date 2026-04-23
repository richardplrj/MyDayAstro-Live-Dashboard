import type { InputHTMLAttributes } from "react";

type Props = InputHTMLAttributes<HTMLInputElement>;

export function Input({ className = "", ...props }: Props) {
  return (
    <input
      className={`h-10 w-full rounded-md border border-slate-700/50 bg-slate-900 px-3 text-sm text-slate-100 outline-none transition-all duration-200 ease-out placeholder:text-slate-600 focus:border-indigo-400/50 focus:ring-2 focus:ring-indigo-500/25 ${className}`}
      {...props}
    />
  );
}
