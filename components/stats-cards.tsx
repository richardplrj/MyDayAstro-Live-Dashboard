import {
  BookMarked,
  LogOut,
  MapPinned,
  MessageSquareText,
  ThumbsDown,
  ThumbsUp,
  Users,
} from "lucide-react";
import { motion } from "framer-motion";
import type { ReactNode } from "react";

import type { ExitFeedbackTotals, InsightFeedbackTotals } from "../hooks/useDashboardStats";
import { springSnappy, springSoft } from "../lib/motion-presets";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

interface Props {
  totalUsers: number;
  stateCoverage: number;
  totalSavedReadings: number;
  insightFeedbackTotals: InsightFeedbackTotals;
  exitFeedbackTotals: ExitFeedbackTotals;
}

function StatCard({
  title,
  icon,
  value,
  subValue,
  footnote,
}: {
  title: string;
  icon: ReactNode;
  value: string;
  subValue?: string;
  footnote?: string;
}) {
  return (
    <motion.div
      className="h-full min-h-[168px]"
      whileHover={{ y: -3, transition: springSoft }}
      whileTap={{ scale: 0.992, transition: { duration: 0.12 } }}
      transition={{ layout: springSnappy }}
    >
      <Card className="flex h-full min-h-[168px] flex-col border-slate-700/50 shadow-[0_12px_36px_rgba(2,6,23,0.35)] transition-shadow duration-300 hover:border-indigo-400/35 hover:shadow-[0_16px_44px_rgba(49,46,129,0.18)]">
        <CardHeader className="flex shrink-0 flex-row items-start justify-between gap-2 pb-1">
          <CardTitle className="text-[0.8125rem] font-medium uppercase tracking-wide text-slate-400">
            {title}
          </CardTitle>
          <motion.span
            className="mt-0.5 text-slate-500"
            whileHover={{ rotate: [0, -8, 8, 0], transition: { duration: 0.45 } }}
          >
            {icon}
          </motion.span>
        </CardHeader>
        <CardContent className="flex flex-1 flex-col justify-between pt-0">
          <motion.p
            key={value}
            layout="position"
            initial={{ opacity: 0.6, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={springSnappy}
            className="text-3xl font-semibold tabular-nums tracking-tight text-slate-50 md:text-[2rem] md:leading-none"
          >
            {value}
          </motion.p>
          {subValue ? (
            <motion.p
              key={subValue}
              layout="position"
              initial={{ opacity: 0.5, y: 2 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...springSnappy, delay: 0.04 }}
              className="mt-1.5 text-lg font-medium tabular-nums tracking-tight text-slate-400 md:text-xl"
            >
              {subValue}
            </motion.p>
          ) : null}
          {footnote ? (
            <p className="mt-4 min-h-[2.5rem] text-xs leading-relaxed text-slate-500">{footnote}</p>
          ) : (
            <div className="mt-4 min-h-0" aria-hidden />
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

function FeedbackStatCard({
  title,
  icon,
  helpful,
  notHelpful,
  tagline,
}: {
  title: string;
  icon: ReactNode;
  helpful: number;
  notHelpful: number;
  tagline: string;
}) {
  return (
    <motion.div
      className="h-full min-h-[184px]"
      whileHover={{ y: -3, transition: springSoft }}
      whileTap={{ scale: 0.992, transition: { duration: 0.12 } }}
    >
      <Card className="flex h-full min-h-[184px] flex-col border-slate-700/50 shadow-[0_12px_36px_rgba(2,6,23,0.35)] transition-shadow duration-300 hover:border-indigo-400/35 hover:shadow-[0_16px_44px_rgba(49,46,129,0.18)]">
        <CardHeader className="flex shrink-0 flex-row items-start justify-between gap-2 pb-1">
          <CardTitle className="text-[0.8125rem] font-medium uppercase tracking-wide text-slate-400">
            {title}
          </CardTitle>
          <span className="mt-0.5 text-slate-500">{icon}</span>
        </CardHeader>
        <CardContent className="flex flex-1 flex-col justify-between pt-0">
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-2.5 rounded-full border border-green-500/25 bg-green-500/10 px-4 py-2.5 text-base font-semibold tabular-nums text-green-100 md:px-5 md:py-3 md:text-lg">
              <ThumbsUp className="h-5 w-5 shrink-0 text-green-300 md:h-6 md:w-6" strokeWidth={2.25} aria-hidden />
              {helpful.toLocaleString()}
            </span>
            <span className="inline-flex items-center gap-2.5 rounded-full border border-red-500/25 bg-red-500/10 px-4 py-2.5 text-base font-semibold tabular-nums text-red-100 md:px-5 md:py-3 md:text-lg">
              <ThumbsDown className="h-5 w-5 shrink-0 text-red-300 md:h-6 md:w-6" strokeWidth={2.25} aria-hidden />
              {notHelpful.toLocaleString()}
            </span>
          </div>
          <p className="mt-4 min-h-[2.5rem] text-xs leading-relaxed text-slate-500">{tagline}</p>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function StatsCards({
  totalUsers,
  stateCoverage,
  totalSavedReadings,
  insightFeedbackTotals,
  exitFeedbackTotals,
}: Props) {
  return (
    <section className="grid auto-rows-fr grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <StatCard
        title="Total Users"
        icon={<Users className="h-4 w-4" />}
        value={totalUsers.toLocaleString()}
        footnote="All registered accounts in the users collection."
      />
      <StatCard
        title="State Coverage"
        icon={<MapPinned className="h-4 w-4" />}
        value={stateCoverage.toLocaleString()}
        footnote="Distinct Indian states from known locations only. Users with missing or unparseable location are excluded from this count."
      />
      <div className="sm:col-span-2 lg:col-span-1">
        <StatCard
          title="Global Saved Readings"
          icon={<BookMarked className="h-4 w-4" />}
          value={totalSavedReadings.toLocaleString()}
          footnote="Total documents across all saved_readings subcollections."
        />
      </div>
      <FeedbackStatCard
        title="Insight feedback"
        icon={<MessageSquareText className="h-4 w-4" strokeWidth={2.25} />}
        helpful={insightFeedbackTotals.helpful}
        notHelpful={insightFeedbackTotals.notHelpful}
        tagline="Category-level helpful taps across all users."
      />
      <FeedbackStatCard
        title="Exit feedback"
        icon={<LogOut className="h-4 w-4" strokeWidth={2.25} />}
        helpful={exitFeedbackTotals.helpful}
        notHelpful={exitFeedbackTotals.notHelpful}
        tagline="Exit-survey responses across all users."
      />
    </section>
  );
}
