"use client";

import { AnimatePresence, motion } from "framer-motion";

import { DashboardCharts } from "../../components/dashboard-charts";
import { StatsCards } from "../../components/stats-cards";
import { UserTable } from "../../components/user-table";
import { useDashboardStats } from "../../hooks/useDashboardStats";
import { fadeUp, springSnappy, staggerContainer } from "../../lib/motion-presets";

export default function DashboardPage() {
  const {
    totalUsers,
    totalSavedReadings,
    stateData,
    ageData,
    loading,
    isLive,
    error,
    insightFeedbackTotals,
    exitFeedbackTotals,
    notificationTimeData,
  } = useDashboardStats();

  /** Distinct known states only — does not count missing/empty location (`Unknown` bucket). */
  const stateCoverage = stateData.filter((s) => s.state !== "Unknown").length;

  return (
    <main className="min-h-screen bg-slate-950 p-4 md:p-6">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(80%_50%_at_50%_-10%,rgba(99,102,241,0.12),transparent)]" />
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="show"
        className="relative mx-auto flex w-full max-w-7xl flex-col gap-6 md:gap-8"
      >
        <motion.header
          variants={fadeUp}
          className="flex flex-col gap-4 border-b border-slate-800/80 pb-6 sm:flex-row sm:items-end sm:justify-between"
        >
          <div>
            <motion.h1
              className="text-2xl font-semibold tracking-tight md:text-3xl"
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.05, ...springSnappy }}
            >
              <span className="bg-gradient-to-r from-indigo-200 to-violet-200 bg-clip-text text-transparent">
                MyDay Astro
              </span>
              <span className="mx-2 font-light text-slate-600" aria-hidden>
                |
              </span>
              <span className="text-slate-100">Real Time Dashboard</span>
            </motion.h1>
            <motion.p
              className="mt-1.5 text-xs font-medium uppercase tracking-[0.18em] text-slate-500"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.15, duration: 0.35 }}
            >
              Users · coverage · live analytics
            </motion.p>
          </div>
          <motion.div
            className="inline-flex shrink-0 items-center gap-1.5 self-start rounded-full border border-emerald-500/30 bg-emerald-500/10 py-1 pl-2 pr-2 sm:self-auto"
            whileHover={{ scale: 1.03, transition: springSnappy }}
            whileTap={{ scale: 0.97 }}
          >
            {isLive ? (
              <span className="relative flex h-2 w-2 shrink-0">
                <span
                  className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-40"
                  aria-hidden
                />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
              </span>
            ) : (
              <span className="h-2 w-2 shrink-0 rounded-full bg-slate-500/70" aria-hidden />
            )}
            <span className="text-xs font-medium leading-none text-emerald-300">
              {isLive ? "Live" : "Offline"}
            </span>
          </motion.div>
        </motion.header>

        <AnimatePresence mode="wait">
          {loading ? (
            <motion.p
              key="loading"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.22 }}
              className="text-sm text-slate-500"
            >
              Loading dashboard stats…
            </motion.p>
          ) : null}
        </AnimatePresence>

        <AnimatePresence>
          {error ? (
            <motion.p
              key="err"
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 6 }}
              transition={springSnappy}
              className="text-sm text-rose-500"
            >
              {error}
            </motion.p>
          ) : null}
        </AnimatePresence>

        <motion.div variants={fadeUp}>
          <StatsCards
            totalUsers={totalUsers}
            stateCoverage={stateCoverage}
            totalSavedReadings={totalSavedReadings}
            insightFeedbackTotals={insightFeedbackTotals}
            exitFeedbackTotals={exitFeedbackTotals}
          />
        </motion.div>
        <motion.div variants={fadeUp}>
          <DashboardCharts
            stateData={stateData}
            ageData={ageData}
            notificationTimeData={notificationTimeData}
          />
        </motion.div>
        <motion.div variants={fadeUp}>
          <UserTable />
        </motion.div>
      </motion.div>
    </main>
  );
}
