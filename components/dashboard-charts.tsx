"use client";

import { motion } from "framer-motion";
import { type ReactNode, useEffect, useMemo, useState } from "react";
import { Bar, BarChart, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import type { AgeData, NotificationTimeData, StateData } from "../hooks/useDashboardStats";
import { springSoft } from "../lib/motion-presets";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";

interface Props {
  stateData: StateData[];
  ageData: AgeData[];
  notificationTimeData: NotificationTimeData[];
}

interface ChartDatum {
  label: string;
  count: number;
}

/** Must match `AGE_RANGES` keys from `useDashboardStats` + display order for the donut. */
const BRACKET_ORDER = ["<18", "18-24", "25-34", "35-44", "45+"] as const;

const BRACKET_GRADIENTS: { from: string; to: string }[] = [
  { from: "#22d3ee", to: "#6366f1" },
  { from: "#818cf8", to: "#4f46e5" },
  { from: "#a78bfa", to: "#7c3aed" },
  { from: "#c084fc", to: "#9333ea" },
  { from: "#e879f9", to: "#a21caf" },
];

const UNKNOWN_GRADIENT = { from: "#64748b", to: "#334155" };

function rangeToBracket(range: string): (typeof BRACKET_ORDER)[number] | "Unknown" | null {
  if (range === "Under 18") return "<18";
  if (range === "18-24") return "18-24";
  if (range === "25-34") return "25-34";
  if (range === "35-44") return "35-44";
  if (range === "45-54" || range === "55+") return "45+";
  if (range === "Unknown") return "Unknown";
  return null;
}

function buildBracketSlices(ageData: AgeData[]): ChartDatum[] {
  const counts = new Map<string, number>();
  for (const row of ageData) {
    const bracket = rangeToBracket(row.range);
    if (bracket === null) continue;
    counts.set(bracket, (counts.get(bracket) ?? 0) + row.count);
  }

  const slices: ChartDatum[] = [];
  for (const key of BRACKET_ORDER) {
    const count = counts.get(key) ?? 0;
    if (count > 0) slices.push({ label: key, count });
  }
  const unknown = counts.get("Unknown") ?? 0;
  if (unknown > 0) slices.push({ label: "Unknown age", count: unknown });
  return slices;
}

function DonutCenter({ total }: { total: number }) {
  return (
    <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
      <motion.span
        key={total}
        initial={{ opacity: 0.5, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={springSoft}
        className="text-2xl font-semibold tabular-nums text-slate-100"
      >
        {total.toLocaleString()}
      </motion.span>
      <span className="mt-0.5 text-[0.65rem] font-medium uppercase tracking-wider text-slate-500">
        Users in view
      </span>
    </div>
  );
}

export function DashboardCharts({ stateData, ageData, notificationTimeData }: Props) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const topStates = stateData.slice(0, 10);
  const donutData = useMemo(() => buildBracketSlices(ageData), [ageData]);
  const donutTotal = useMemo(() => donutData.reduce((s, d) => s + d.count, 0), [donutData]);

  const chartHeight = 300;

  const notificationRows = useMemo(() => {
    const sorted = [...notificationTimeData].sort((a, b) => b.count - a.count);
    const total = sorted.reduce((s, r) => s + r.count, 0);
    return sorted.map((row) => ({
      ...row,
      sharePct: total > 0 ? (row.count / total) * 100 : 0,
    }));
  }, [notificationTimeData]);

  const notificationTotalUsers = useMemo(
    () => notificationRows.reduce((s, r) => s + r.count, 0),
    [notificationRows]
  );

  /** Recharts measures the parent; absolute overlays must not be the only in-flow child — use a fixed box. */
  function ChartBox({ children, height }: { children: ReactNode; height?: number }) {
    const h = height ?? chartHeight;
    return (
      <div className="w-full min-w-0 shrink-0" style={{ height: h, minHeight: h }}>
        <ResponsiveContainer width="100%" height={h} minWidth={0}>
          {children}
        </ResponsiveContainer>
      </div>
    );
  }

  if (!mounted) {
    return (
      <section className="grid auto-rows-fr grid-cols-1 items-stretch gap-4 lg:grid-cols-2">
        <Card className="flex min-h-[400px] flex-col border-slate-700/50">
          <CardHeader className="shrink-0">
            <CardTitle className="text-[0.8125rem] font-medium uppercase tracking-wide text-slate-400">
              Users by State
            </CardTitle>
          </CardHeader>
          <CardContent className="shrink-0 p-4 pt-2">
            <div className="w-full min-w-0" style={{ height: chartHeight }} aria-hidden />
          </CardContent>
        </Card>
        <Card className="flex min-h-[400px] flex-col border-slate-700/50">
          <CardHeader className="shrink-0">
            <CardTitle className="text-[0.8125rem] font-medium uppercase tracking-wide text-slate-400">
              Age distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="shrink-0 p-4 pt-2">
            <div className="w-full min-w-0" style={{ height: chartHeight }} aria-hidden />
          </CardContent>
        </Card>
        <Card className="flex min-h-[220px] flex-col border-slate-700/50 lg:col-span-2">
          <CardHeader className="shrink-0">
            <CardTitle className="text-[0.8125rem] font-medium uppercase tracking-wide text-slate-400">
              Notification time preferences
            </CardTitle>
          </CardHeader>
          <CardContent className="shrink-0 p-4 pt-2">
            <div className="h-40 w-full rounded-md border border-slate-800/80 bg-slate-900/30" aria-hidden />
          </CardContent>
        </Card>
      </section>
    );
  }

  return (
    <section className="grid auto-rows-fr grid-cols-1 items-stretch gap-4 lg:grid-cols-2">
      <motion.div
        className="flex h-full min-h-[400px]"
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-40px" }}
        whileHover={{ y: -2, transition: springSoft }}
        transition={{ duration: 0.35 }}
      >
        <Card className="flex w-full flex-1 flex-col border-slate-700/50 transition-shadow duration-300 hover:border-indigo-400/25 hover:shadow-[0_16px_44px_rgba(49,46,129,0.12)]">
          <CardHeader className="shrink-0">
            <CardTitle className="text-[0.8125rem] font-medium uppercase tracking-wide text-slate-400">
              Users by State
            </CardTitle>
          </CardHeader>
          <CardContent className="shrink-0 p-4 pt-2">
            <ChartBox>
              <BarChart data={topStates}>
                <XAxis
                  dataKey="state"
                  angle={-20}
                  textAnchor="end"
                  interval={0}
                  height={60}
                  stroke="#64748B"
                  tick={{ fill: "#94a3b8", fontSize: 11 }}
                />
                <YAxis allowDecimals={false} stroke="#64748B" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                <Tooltip
                  cursor={{ fill: "rgba(99, 102, 241, 0.15)" }}
                  contentStyle={{
                    background: "#0F172A",
                    border: "1px solid rgba(148, 163, 184, 0.3)",
                    borderRadius: "0.75rem",
                    color: "#E2E8F0",
                  }}
                />
                <Bar
                  dataKey="count"
                  fill="#6366F1"
                  radius={[6, 6, 0, 0]}
                  isAnimationActive
                  animationDuration={700}
                  animationEasing="ease-out"
                />
              </BarChart>
            </ChartBox>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        className="flex h-full min-h-[400px]"
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-40px" }}
        whileHover={{ y: -2, transition: springSoft }}
        transition={{ duration: 0.35, delay: 0.05 }}
      >
        <Card className="flex w-full flex-1 flex-col border-slate-700/50 transition-shadow duration-300 hover:border-indigo-400/25 hover:shadow-[0_16px_44px_rgba(49,46,129,0.12)]">
          <CardHeader className="shrink-0">
            <CardTitle className="text-[0.8125rem] font-medium uppercase tracking-wide text-slate-400">
              Age distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="relative shrink-0 p-4 pt-2">
            {donutData.length === 0 ? (
              <div
                className="flex w-full min-w-0 items-center justify-center text-sm text-slate-500"
                style={{ height: chartHeight, minHeight: chartHeight }}
              >
                No age data to chart yet.
              </div>
            ) : (
              <div className="relative w-full min-w-0" style={{ height: chartHeight, minHeight: chartHeight }}>
                <DonutCenter total={donutTotal} />
                <ChartBox>
                  <PieChart margin={{ top: 4, right: 4, bottom: 4, left: 4 }}>
                    <defs>
                      {donutData.map((entry, i) => {
                        const isUnknown = entry.label === "Unknown age";
                        const g = isUnknown ? UNKNOWN_GRADIENT : BRACKET_GRADIENTS[i % BRACKET_GRADIENTS.length];
                        return (
                          <linearGradient key={entry.label} id={`ageGrad-${i}`} x1="0" y1="0" x2="1" y2="1">
                            <stop offset="0%" stopColor={g.from} />
                            <stop offset="100%" stopColor={g.to} />
                          </linearGradient>
                        );
                      })}
                    </defs>
                    <Pie
                      data={donutData}
                      nameKey="label"
                      dataKey="count"
                      cx="50%"
                      cy="50%"
                      innerRadius="58%"
                      outerRadius="82%"
                      paddingAngle={3}
                      cornerRadius={6}
                      stroke="#020617"
                      strokeWidth={2}
                      isAnimationActive
                      animationDuration={800}
                      animationEasing="ease-out"
                    >
                      {donutData.map((entry, index) => (
                        <Cell key={entry.label} fill={`url(#ageGrad-${index})`} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => [
                        typeof value === "number" ? value.toLocaleString() : String(value ?? ""),
                        "Users",
                      ]}
                      contentStyle={{
                        background: "#0F172A",
                        border: "1px solid rgba(148, 163, 184, 0.3)",
                        borderRadius: "0.75rem",
                        color: "#E2E8F0",
                      }}
                    />
                    <Legend
                      verticalAlign="bottom"
                      height={28}
                      formatter={(value) => <span className="text-xs text-slate-400">{value}</span>}
                      wrapperStyle={{ paddingTop: 8 }}
                    />
                  </PieChart>
                </ChartBox>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        className="flex lg:col-span-2"
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-40px" }}
        whileHover={{ y: -2, transition: springSoft }}
        transition={{ duration: 0.35, delay: 0.08 }}
      >
        <Card className="flex w-full flex-1 flex-col border-slate-700/50 transition-shadow duration-300 hover:border-indigo-400/25 hover:shadow-[0_16px_44px_rgba(49,46,129,0.12)]">
          <CardHeader className="shrink-0 pb-1">
            <CardTitle className="text-[0.8125rem] font-medium uppercase tracking-wide text-slate-400">
              Notification time preferences
            </CardTitle>
          </CardHeader>
          <CardContent className="shrink-0 p-4 pt-2">
            {notificationTimeData.length === 0 ? (
              <div className="flex min-h-[120px] w-full items-center justify-center rounded-lg border border-slate-800/80 bg-slate-900/20 text-sm text-slate-500">
                No user rows yet.
              </div>
            ) : (
              <div className="overflow-hidden rounded-lg border border-slate-800/80">
                <div className="max-h-[min(420px,52vh)] overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[40%]">Time / slot</TableHead>
                        <TableHead className="text-right">Users</TableHead>
                        <TableHead className="text-right">Share</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {notificationRows.map((row) => (
                        <TableRow key={row.label}>
                          <TableCell className="font-medium text-slate-200">{row.label}</TableCell>
                          <TableCell className="text-right font-mono tabular-nums text-slate-300">
                            {row.count.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right font-mono text-sm tabular-nums text-slate-400">
                            {row.sharePct < 0.05 && row.sharePct > 0
                              ? row.sharePct.toFixed(2)
                              : row.sharePct.toFixed(1)}
                            %
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <p className="border-t border-slate-800/80 bg-slate-900/40 px-4 py-2.5 text-xs text-slate-500">
                  <span className="font-mono text-slate-400">{notificationRows.length}</span>{" "}
                  distinct values ·{" "}
                  <span className="font-mono text-slate-400">
                    {notificationTotalUsers.toLocaleString()}
                  </span>{" "}
                  users counted
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </section>
  );
}
