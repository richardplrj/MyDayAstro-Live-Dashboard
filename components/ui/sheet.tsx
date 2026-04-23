"use client";

import { motion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect } from "react";
import type { ReactNode } from "react";

import { springSoft } from "../../lib/motion-presets";

interface SheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
}

interface SheetContentProps {
  open: boolean;
  onClose?: () => void;
  children: ReactNode;
}

export function Sheet({ open, onOpenChange, children }: SheetProps) {
  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  return (
    <>
      <motion.div
        aria-hidden
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-[2px]"
        initial={false}
        animate={{ opacity: open ? 1 : 0 }}
        transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
        style={{ pointerEvents: open ? "auto" : "none" }}
        onClick={() => onOpenChange(false)}
      />
      {children}
    </>
  );
}

export function SheetContent({ open, onClose, children }: SheetContentProps) {
  return (
    <motion.aside
      initial={false}
      animate={open ? { opacity: 1, scale: 1, y: 0 } : { opacity: 0, scale: 0.98, y: 12 }}
      transition={springSoft}
      className="fixed left-1/2 top-1/2 z-50 h-[min(86vh,820px)] w-[min(94vw,980px)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-slate-700/60 bg-slate-950 p-6 shadow-2xl"
      style={{ willChange: "transform, opacity" }}
    >
      {onClose ? (
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-700/70 bg-slate-900 text-slate-400 transition-colors hover:border-slate-600 hover:text-slate-200"
          aria-label="Close user details"
        >
          <X className="h-4 w-4" />
        </button>
      ) : null}
      {children}
    </motion.aside>
  );
}

export function SheetHeader({ children }: { children: ReactNode }) {
  return <div className="mb-4 border-b border-slate-700/50 pb-4">{children}</div>;
}

export function SheetTitle({ children }: { children: ReactNode }) {
  return <h2 className="text-xl font-semibold text-slate-100">{children}</h2>;
}

export function SheetDescription({ children }: { children: ReactNode }) {
  return <p className="mt-1 text-sm text-slate-400">{children}</p>;
}
