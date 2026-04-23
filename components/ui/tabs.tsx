"use client";

import { LayoutGroup, motion } from "framer-motion";
import type { ReactNode } from "react";

import { springSnappy } from "../../lib/motion-presets";

interface TabsListProps {
  children: ReactNode;
}

interface TabsTriggerProps {
  active?: boolean;
  onClick: () => void;
  children: ReactNode;
}

export function TabsList({ children }: TabsListProps) {
  return (
    <LayoutGroup id="dashboard-tabs">
      <div className="inline-flex rounded-lg border border-slate-700 bg-slate-900 p-1">{children}</div>
    </LayoutGroup>
  );
}

export function TabsTrigger({ active = false, onClick, children }: TabsTriggerProps) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      transition={springSnappy}
      className={`relative rounded-md px-3 py-1.5 text-sm transition-colors duration-200 ${
        active ? "text-slate-100" : "text-slate-400 hover:text-slate-200"
      }`}
    >
      {active ? (
        <motion.span
          layoutId="sheetTabPill"
          className="absolute inset-0 rounded-md bg-slate-700 shadow-sm"
          transition={{ type: "spring", stiffness: 400, damping: 32 }}
        />
      ) : null}
      <span className="relative z-10">{children}</span>
    </motion.button>
  );
}
