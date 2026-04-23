import type { HTMLAttributes, TableHTMLAttributes, TdHTMLAttributes } from "react";

export function Table({ className = "", ...props }: TableHTMLAttributes<HTMLTableElement>) {
  return <table className={`w-full border-collapse text-sm text-slate-300 ${className}`} {...props} />;
}

export function TableHeader({ className = "", ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return <thead className={`border-b border-slate-700/50 bg-slate-900/60 ${className}`} {...props} />;
}

export function TableBody({ className = "", ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className="divide-y divide-slate-800/80" {...props} />;
}

export function TableRow({ className = "", ...props }: HTMLAttributes<HTMLTableRowElement>) {
  return <tr className={`border-0 transition-colors hover:bg-slate-800/30 ${className}`} {...props} />;
}

export function TableHead({ className = "", ...props }: HTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={`h-11 px-4 text-left align-middle text-xs font-semibold uppercase tracking-wider text-slate-500 first:pl-4 last:pr-4 ${className}`}
      {...props}
    />
  );
}

export function TableCell({ className = "", ...props }: TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={`h-12 px-4 py-0 align-middle first:pl-4 last:pr-4 ${className}`} {...props} />;
}
