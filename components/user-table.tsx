"use client";

import { AnimatePresence, motion } from "framer-motion";
import { MessageSquareText, Star, ThumbsUp } from "lucide-react";
import { Fragment, type ReactNode, useEffect, useMemo, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";

import { useUserDetail } from "../hooks/useUserDetail";
import { db } from "../lib/firebase";
import { springSnappy, springSoft } from "../lib/motion-presets";
import { calculateAge, extractState, toJSDate } from "../lib/utils-data";
import type { User } from "../types/user";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "./ui/sheet";
import { Badge } from "./ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { TabsList, TabsTrigger } from "./ui/tabs";

interface UserRow extends User {
  id: string;
}

function formatTimestamp(value: unknown): string {
  if (!value || typeof value !== "object") return "";
  const date = toJSDate(value as { _seconds: number; _nanoseconds: number });
  return date
    ? date.toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
    : "";
}

function formatDateTime(value: unknown): string {
  if (!value || typeof value !== "object") return "";
  const date = toJSDate(value as { _seconds: number; _nanoseconds: number });
  return date
    ? date.toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";
}

function formatLuckyNumbers(value: unknown): string {
  if (typeof value === "number" || typeof value === "string") return String(value);
  if (!Array.isArray(value)) return "-";
  const nums = value
    .map((n) => (typeof n === "number" || typeof n === "string" ? String(n) : ""))
    .filter(Boolean);
  return nums.length ? nums.join(", ") : "-";
}

function renderFormattedInsightText(text: string): ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((part, index) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return <strong key={`${part}-${index}`}>{part.slice(2, -2)}</strong>;
        }
        return <Fragment key={`${part}-${index}`}>{part}</Fragment>;
      })}
    </>
  );
}

export function UserTable() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"insights" | "library" | "feedback">("insights");
  const [insightLanguage, setInsightLanguage] = useState<"en" | "hi">("en");
  const [expandedInsightKey, setExpandedInsightKey] = useState<string | null>(null);
  const [selectedInsightId, setSelectedInsightId] = useState<string | null>(null);
  const [savedReadingLanguage, setSavedReadingLanguage] = useState<"en" | "hi">("en");
  const [selectedSavedReadingId, setSelectedSavedReadingId] = useState<string | null>(null);
  const [feedbackFilter, setFeedbackFilter] = useState<"all" | "rating" | "insight" | "exit">("all");
  const [sortKey, setSortKey] = useState<"firstName" | "email" | "language" | "state" | "age">(
    "firstName"
  );
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const selectedUserDetail = useUserDetail(selectedUserId ?? "");

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "users"),
      (snapshot) => {
        setUsersError(null);
        const rows = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...(docSnap.data() as User),
        }));
        setUsers(rows);
        setLoadingUsers(false);
      },
      (error) => {
        setUsersError(
          error.code === "permission-denied"
            ? "Permission denied while reading users."
            : error.message
        );
        setLoadingUsers(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();
    const searched = users.filter((user) => {
      if (!query) return true;
      return (
        user.firstName?.toLowerCase().includes(query) ||
        user.email?.toLowerCase().includes(query)
      );
    });

    return searched.sort((a, b) => {
      const stateA = extractState(a.location?.name ?? "") || "";
      const stateB = extractState(b.location?.name ?? "") || "";
      const ageA = calculateAge(a.dob);
      const ageB = calculateAge(b.dob);

      let comparison = 0;
      if (sortKey === "age") comparison = ageA - ageB;
      else if (sortKey === "state") comparison = stateA.localeCompare(stateB);
      else comparison = String(a[sortKey]).localeCompare(String(b[sortKey]));

      return sortOrder === "asc" ? comparison : -comparison;
    });
  }, [users, search, sortKey, sortOrder]);

  const userLocation = extractState(selectedUserDetail.user?.location?.name ?? "") || "Unknown";
  const initials =
    selectedUserDetail.user?.firstName
      ?.split(" ")
      .map((part) => part[0]?.toUpperCase())
      .join("")
      .slice(0, 2) ?? "U";

  const timeline = useMemo(() => {
    const ratings = selectedUserDetail.dailyRatings.map((rating) => ({
      id: `rating-${rating.id}`,
      type: "rating" as const,
      createdAt: rating.createdAt,
      label: `Daily Rating ${rating.rating}/5`,
      subLabel: `Prompt: ${rating.promptType || "-"}`,
    }));
    const feedback = selectedUserDetail.insightFeedback.map((item) => ({
      id: `insight-${item.id}`,
      type: "insight" as const,
      createdAt: item.updatedAt,
      label: "Insight Feedback",
      subLabel: [
        `Daily: ${item.Daily ?? "-"}`,
        `Relationships: ${item.Relationships ?? "-"}`,
        `Career: ${item.Career ?? "-"}`,
        `Health: ${item.Health ?? "-"}`,
        `Finance: ${item.Finances ?? "-"}`,
      ].join(" • "),
    }));
    const exit = selectedUserDetail.exitFeedback.map((item) => ({
      id: `exit-${item.id}`,
      type: "exit" as const,
      createdAt: item.createdAt,
      label: "Exit Feedback",
      subLabel: item.response === "not-helpful" ? "Not helpful" : "Helpful",
    }));
    return [...ratings, ...feedback, ...exit].sort((a, b) => {
      const aDate = toJSDate(a.createdAt)?.getTime() ?? 0;
      const bDate = toJSDate(b.createdAt)?.getTime() ?? 0;
      return bDate - aDate;
    });
  }, [selectedUserDetail.dailyRatings, selectedUserDetail.insightFeedback, selectedUserDetail.exitFeedback]);

  const filteredTimeline = useMemo(() => {
    if (feedbackFilter === "all") return timeline;
    return timeline.filter((entry) => entry.type === feedbackFilter);
  }, [feedbackFilter, timeline]);

  const parsedInsights = useMemo(() => {
    return selectedUserDetail.dailyInsights.map((insight) => {
      const aiDashboard = insight.aiDashboard as
        | {
            overall_dashboard?: {
              overall_score?: number;
              overall_reading_en?: string;
              overall_reading_hi?: string;
              lucky_color_en?: string;
              lucky_color_hi?: string;
              lucky_number?: number | string | Array<number | string>;
            };
            categories?: Record<
              string,
              {
                score?: number;
                reading_en?: string;
                reading_hi?: string;
              }
            >;
          }
        | undefined;
      const overall = aiDashboard?.overall_dashboard;
      const categories = aiDashboard?.categories ?? {};
      return {
        id: insight.id,
        date: insight.date || "Unknown date",
        luckyColor:
          insight.lucky_color ??
          overall?.lucky_color_en ??
          insight.lucky_color_hi ??
          overall?.lucky_color_hi ??
          "-",
        luckyNumbers: formatLuckyNumbers(insight.lucky_number ?? overall?.lucky_number),
        sections: [
          {
            key: "overall",
            title: "Overall",
            score: overall?.overall_score,
            reading_en: overall?.overall_reading_en,
            reading_hi: overall?.overall_reading_hi,
          },
          {
            key: "career",
            title: "Career",
            score: categories.career?.score,
            reading_en: categories.career?.reading_en,
            reading_hi: categories.career?.reading_hi,
          },
          {
            key: "relationships",
            title: "Relationships",
            score: (categories.relationships ?? categories.relationship)?.score,
            reading_en: (categories.relationships ?? categories.relationship)?.reading_en,
            reading_hi: (categories.relationships ?? categories.relationship)?.reading_hi,
          },
          {
            key: "health",
            title: "Health",
            score: categories.health?.score,
            reading_en: categories.health?.reading_en,
            reading_hi: categories.health?.reading_hi,
          },
          {
            key: "finance",
            title: "Finance",
            score: (categories.finance ?? categories.finances)?.score,
            reading_en: (categories.finance ?? categories.finances)?.reading_en,
            reading_hi: (categories.finance ?? categories.finances)?.reading_hi,
          },
        ],
      };
    });
  }, [selectedUserDetail.dailyInsights]);

  const parsedSavedReadings = useMemo(() => {
    return [...selectedUserDetail.savedReadings]
      .sort((a, b) => {
        const aTime = toJSDate(a.createdAt)?.getTime() ?? 0;
        const bTime = toJSDate(b.createdAt)?.getTime() ?? 0;
        return bTime - aTime;
      })
      .map((reading) => ({
        id: reading.id,
        readingType: reading.readingType ?? "Saved Reading",
        savedAtLabel: formatDateTime(reading.createdAt) || "-",
        contentEn: reading.contentEn ?? "",
        contentHi: reading.contentHi ?? "",
      }));
  }, [selectedUserDetail.savedReadings]);

  useEffect(() => {
    if (parsedInsights.length === 0) {
      setSelectedInsightId(null);
      setExpandedInsightKey(null);
      return;
    }
    if (!selectedInsightId || !parsedInsights.some((insight) => insight.id === selectedInsightId)) {
      setSelectedInsightId(parsedInsights[0].id);
      setExpandedInsightKey(null);
    }
  }, [parsedInsights, selectedInsightId]);

  useEffect(() => {
    if (parsedSavedReadings.length === 0) {
      setSelectedSavedReadingId(null);
      return;
    }
    if (
      !selectedSavedReadingId ||
      !parsedSavedReadings.some((reading) => reading.id === selectedSavedReadingId)
    ) {
      setSelectedSavedReadingId(parsedSavedReadings[0].id);
    }
  }, [parsedSavedReadings, selectedSavedReadingId]);

  const requestSort = (key: typeof sortKey) => {
    if (sortKey === key) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(key);
    setSortOrder("asc");
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        whileHover={{ y: -2, transition: springSoft }}
      >
        <Card className="overflow-hidden border-slate-700/50 transition-shadow duration-300 hover:shadow-[0_16px_44px_rgba(49,46,129,0.1)]">
        <CardHeader className="flex flex-col gap-4 border-b border-slate-800/80 bg-slate-900/40 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-[0.8125rem] font-medium uppercase tracking-wide text-slate-400">
              User directory
            </CardTitle>
            <p className="mt-1 text-xs text-slate-500">Search, sort, and open a row for the full profile.</p>
          </div>
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Filter by name or email…"
            className="h-9 w-full sm:max-w-xs"
          />
        </CardHeader>
        <CardContent className="p-0">
          {loadingUsers ? (
            <p className="px-4 py-6 text-center text-sm text-slate-500">Loading users…</p>
          ) : null}
          {usersError ? <p className="px-4 py-2 text-sm text-rose-500">{usersError}</p> : null}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="cursor-pointer select-none hover:text-slate-300" onClick={() => requestSort("firstName")}>
                    Name
                  </TableHead>
                  <TableHead className="cursor-pointer select-none hover:text-slate-300" onClick={() => requestSort("email")}>
                    Email
                  </TableHead>
                  <TableHead className="cursor-pointer select-none hover:text-slate-300" onClick={() => requestSort("language")}>
                    Language
                  </TableHead>
                  <TableHead className="cursor-pointer select-none hover:text-slate-300" onClick={() => requestSort("state")}>
                    State
                  </TableHead>
                  <TableHead
                    className="w-[4.5rem] cursor-pointer text-right tabular-nums select-none hover:text-slate-300"
                    onClick={() => requestSort("age")}
                  >
                    Age
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell className="h-32 text-center text-slate-500" colSpan={5}>
                      No users match your search.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user, index) => (
                    <motion.tr
                      key={user.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.22, delay: Math.min(index * 0.015, 0.3) }}
                      whileHover={{ backgroundColor: "rgba(30, 41, 59, 0.45)" }}
                      className="cursor-pointer border-0"
                      onClick={() => setSelectedUserId(user.id)}
                    >
                      <TableCell className="font-medium text-slate-100">
                        {user.firstName}
                      </TableCell>
                      <TableCell className="max-w-[14rem] truncate text-slate-400" title={user.email}>
                        {user.email}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={user.language?.toLowerCase() === "hindi" ? "secondary" : "default"}
                        >
                          {user.language}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-slate-400">
                        {extractState(user.location?.name ?? "") || "—"}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-slate-300">
                        {calculateAge(user.dob) || "—"}
                      </TableCell>
                    </motion.tr>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      </motion.div>

      <Sheet open={Boolean(selectedUserId)} onOpenChange={(open) => !open && setSelectedUserId(null)}>
        <SheetContent open={Boolean(selectedUserId)} onClose={() => setSelectedUserId(null)}>
          <SheetHeader>
            <motion.div
              className="flex items-center gap-3"
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={springSoft}
            >
              <motion.div
                className="flex h-12 w-12 items-center justify-center rounded-full border border-slate-700 bg-slate-900 text-slate-100"
                whileHover={{ scale: 1.05, borderColor: "rgba(129, 140, 248, 0.45)" }}
                transition={springSnappy}
              >
                {initials}
              </motion.div>
              <div>
                <SheetTitle>{selectedUserDetail.user?.firstName ?? "User 360"}</SheetTitle>
                <SheetDescription>
                  {selectedUserDetail.user?.email ?? ""} • {userLocation}
                </SheetDescription>
              </div>
            </motion.div>
          </SheetHeader>

          {selectedUserDetail.loading ? (
            <p className="text-sm text-slate-500">Loading user details...</p>
          ) : null}
          {selectedUserDetail.error ? (
            <p className="text-sm text-rose-500">{selectedUserDetail.error}</p>
          ) : null}

          <div className="space-y-4 pb-8">
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...springSoft, delay: 0.05 }}
            >
              <Card className="transition-shadow duration-300 hover:shadow-md">
              <CardHeader>
                <CardTitle>Overview</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-3 text-sm text-slate-300">
                <p>
                  <span className="font-semibold">DOB:</span> {selectedUserDetail.user?.dob ?? "-"}
                </p>
                <p>
                  <span className="font-semibold">TOB:</span> {selectedUserDetail.user?.tob ?? "-"}
                </p>
                <p className="col-span-2">
                  <span className="font-semibold">Moon Rasi:</span>{" "}
                  {selectedUserDetail.user?.moonRasiNo ?? "-"}
                </p>
              </CardContent>
            </Card>
            </motion.div>

            <TabsList>
              <TabsTrigger active={activeTab === "insights"} onClick={() => setActiveTab("insights")}>
                Insights
              </TabsTrigger>
              <TabsTrigger active={activeTab === "library"} onClick={() => setActiveTab("library")}>
                Library
              </TabsTrigger>
              <TabsTrigger active={activeTab === "feedback"} onClick={() => setActiveTab("feedback")}>
                Feedback
              </TabsTrigger>
            </TabsList>

            <AnimatePresence mode="wait">
              {activeTab === "insights" ? (
                <motion.div
                  key="insights"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                >
                  <Card className="transition-shadow duration-300">
                    <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <CardTitle>All Insights</CardTitle>
                      <div className="inline-flex items-center rounded-full border border-slate-700/70 bg-slate-900/70 p-1">
                        <button
                          type="button"
                          onClick={() => setInsightLanguage("en")}
                          className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                            insightLanguage === "en"
                              ? "bg-indigo-500/20 text-indigo-200"
                              : "text-slate-400 hover:text-slate-200"
                          }`}
                        >
                          English
                        </button>
                        <button
                          type="button"
                          onClick={() => setInsightLanguage("hi")}
                          className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                            insightLanguage === "hi"
                              ? "bg-indigo-500/20 text-indigo-200"
                              : "text-slate-400 hover:text-slate-200"
                          }`}
                        >
                          Hindi
                        </button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {parsedInsights.length > 0 ? (
                        <div className="grid gap-3 md:grid-cols-[180px_minmax(0,1fr)]">
                          <div className="space-y-2">
                            {parsedInsights.map((insight) => {
                              const selected = selectedInsightId === insight.id;
                              return (
                                <button
                                  key={insight.id}
                                  type="button"
                                  onClick={() => {
                                    setSelectedInsightId(insight.id);
                                    setExpandedInsightKey(null);
                                  }}
                                  className={`w-full rounded-lg border px-3 py-2.5 text-left transition-colors ${
                                    selected
                                      ? "border-indigo-500/40 bg-indigo-500/10 text-indigo-100"
                                      : "border-slate-700/60 bg-slate-900/70 text-slate-300 hover:border-slate-600 hover:bg-slate-900"
                                  }`}
                                >
                                  <p className="text-sm font-medium">{insight.date}</p>
                                </button>
                              );
                            })}
                          </div>

                          {selectedInsightId ? (
                            <div className="rounded-xl border border-slate-700/60 bg-slate-900/60 p-3">
                              {(() => {
                                const selectedInsight = parsedInsights.find((it) => it.id === selectedInsightId);
                                if (!selectedInsight) return null;
                                return (
                                  <div className="space-y-3">
                                    <div className="grid gap-2 sm:grid-cols-2">
                                      <div className="rounded-lg border border-slate-700/60 bg-slate-950/70 px-3 py-2">
                                        <p className="text-[0.68rem] font-semibold uppercase tracking-wide text-slate-500">
                                          Lucky color
                                        </p>
                                        <p className="mt-1 text-sm font-medium text-slate-200">
                                          {selectedInsight.luckyColor}
                                        </p>
                                      </div>
                                      <div className="rounded-lg border border-slate-700/60 bg-slate-950/70 px-3 py-2">
                                        <p className="text-[0.68rem] font-semibold uppercase tracking-wide text-slate-500">
                                          Lucky numbers
                                        </p>
                                        <p className="mt-1 text-sm font-medium text-slate-200">
                                          {selectedInsight.luckyNumbers}
                                        </p>
                                      </div>
                                    </div>

                                    <div className="flex flex-wrap gap-2">
                                      {selectedInsight.sections.map((section) => {
                                        const rowKey = `${selectedInsight.id}:${section.key}`;
                                        const isOpen = expandedInsightKey === rowKey;
                                        const reading =
                                          insightLanguage === "en" ? section.reading_en : section.reading_hi;
                                        return (
                                          <div
                                            key={rowKey}
                                            className="w-full self-start rounded-lg border border-slate-700/60 bg-slate-950/70 p-3 sm:w-[calc(50%-0.25rem)] lg:w-[calc(33.333%-0.34rem)]"
                                          >
                                            <button
                                              type="button"
                                              onClick={() =>
                                                setExpandedInsightKey((prev) => (prev === rowKey ? null : rowKey))
                                              }
                                              className="flex w-full items-center justify-between gap-2 text-left"
                                            >
                                              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                                                {section.title}
                                              </p>
                                              <span className="rounded-full border border-slate-700/70 bg-slate-800/80 px-2 py-0.5 text-[0.68rem] font-medium text-slate-300">
                                                {typeof section.score === "number" ? section.score : "-"}
                                              </span>
                                            </button>
                                            {isOpen ? (
                                              <p className="mt-2 text-sm leading-relaxed text-slate-300">
                                                {reading
                                                  ? renderFormattedInsightText(reading)
                                                  : "-"}
                                              </p>
                                            ) : null}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                );
                              })()}
                            </div>
                          ) : null}
                        </div>
                      ) : (
                        <p className="py-10 text-center text-sm text-slate-500">No Daily Insights Yet</p>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ) : activeTab === "library" ? (
                <motion.div
                  key="library"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                >
                  <Card className="transition-shadow duration-300">
                    <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <CardTitle>Saved Readings</CardTitle>
                      <div className="inline-flex items-center rounded-full border border-slate-700/70 bg-slate-900/70 p-1">
                        <button
                          type="button"
                          onClick={() => setSavedReadingLanguage("en")}
                          className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                            savedReadingLanguage === "en"
                              ? "bg-indigo-500/20 text-indigo-200"
                              : "text-slate-400 hover:text-slate-200"
                          }`}
                        >
                          English
                        </button>
                        <button
                          type="button"
                          onClick={() => setSavedReadingLanguage("hi")}
                          className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                            savedReadingLanguage === "hi"
                              ? "bg-indigo-500/20 text-indigo-200"
                              : "text-slate-400 hover:text-slate-200"
                          }`}
                        >
                          Hindi
                        </button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {parsedSavedReadings.length === 0 ? (
                        <p className="py-10 text-center text-sm text-slate-500">No Saved Readings Yet</p>
                      ) : (
                        <div className="grid gap-3 md:grid-cols-[220px_minmax(0,1fr)]">
                          <div className="space-y-2">
                            {parsedSavedReadings.map((reading) => {
                              const selected = selectedSavedReadingId === reading.id;
                              return (
                                <button
                                  key={reading.id}
                                  type="button"
                                  onClick={() => setSelectedSavedReadingId(reading.id)}
                                  className={`w-full rounded-lg border px-3 py-2.5 text-left transition-colors ${
                                    selected
                                      ? "border-indigo-500/40 bg-indigo-500/10 text-indigo-100"
                                      : "border-slate-700/60 bg-slate-900/70 text-slate-300 hover:border-slate-600 hover:bg-slate-900"
                                  }`}
                                >
                                  <p className="text-sm font-medium">{reading.readingType}</p>
                                  <p className="mt-1 text-xs text-slate-400">{reading.savedAtLabel}</p>
                                </button>
                              );
                            })}
                          </div>
                          {selectedSavedReadingId ? (
                            <div className="rounded-xl border border-slate-700/60 bg-slate-900/60 p-3">
                              {(() => {
                                const selectedReading = parsedSavedReadings.find(
                                  (item) => item.id === selectedSavedReadingId
                                );
                                if (!selectedReading) return null;
                                const content =
                                  savedReadingLanguage === "en"
                                    ? selectedReading.contentEn
                                    : selectedReading.contentHi;
                                return (
                                  <div className="space-y-3">
                                    <div className="rounded-lg border border-slate-700/60 bg-slate-950/70 px-3 py-2">
                                      <p className="text-sm font-medium text-slate-200">
                                        {selectedReading.readingType}
                                      </p>
                                      <p className="mt-1 text-xs text-slate-400">
                                        Saved: {selectedReading.savedAtLabel}
                                      </p>
                                    </div>
                                    <div className="rounded-lg border border-slate-700/60 bg-slate-950/70 p-3">
                                      <p className="text-sm leading-relaxed text-slate-300">
                                        {content || "No reading content available."}
                                      </p>
                                    </div>
                                  </div>
                                );
                              })()}
                            </div>
                          ) : null}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ) : (
                <motion.div
                  key="feedback"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                >
                  <Card className="transition-shadow duration-300">
                    <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <CardTitle>Feedback Timeline</CardTitle>
                      <div className="inline-flex items-center rounded-full border border-slate-700/70 bg-slate-900/70 p-1">
                        {(
                          [
                            ["all", "All"],
                            ["rating", "Ratings"],
                            ["insight", "Insight"],
                            ["exit", "Exit"],
                          ] as const
                        ).map(([key, label]) => (
                          <button
                            key={key}
                            type="button"
                            onClick={() => setFeedbackFilter(key)}
                            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                              feedbackFilter === key
                                ? "bg-indigo-500/20 text-indigo-200"
                                : "text-slate-400 hover:text-slate-200"
                            }`}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {filteredTimeline.length === 0 ? (
                        <p className="py-10 text-center text-sm text-slate-500">No Feedback Yet</p>
                      ) : (
                        filteredTimeline.map((entry, i) => (
                          <motion.div
                            key={entry.id}
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: Math.min(i * 0.03, 0.25), ...springSoft }}
                            whileHover={{ scale: 1.01, transition: springSnappy }}
                            className="rounded-lg border border-slate-700/50 bg-slate-900 p-3"
                          >
                            <div className="flex items-start gap-2.5">
                              {entry.type === "rating" ? (
                                <Star className="mt-0.5 h-4 w-4 text-amber-300" />
                              ) : entry.type === "insight" ? (
                                <ThumbsUp className="mt-0.5 h-4 w-4 text-emerald-300" />
                              ) : (
                                <MessageSquareText className="mt-0.5 h-4 w-4 text-indigo-300" />
                              )}
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <p className="text-sm font-medium text-slate-200">{entry.label}</p>
                                  <span
                                    className={`rounded-full border px-2 py-0.5 text-[0.68rem] font-medium ${
                                      entry.type === "rating"
                                        ? "border-amber-500/30 bg-amber-500/10 text-amber-200"
                                        : entry.type === "insight"
                                          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
                                          : "border-indigo-500/30 bg-indigo-500/10 text-indigo-200"
                                    }`}
                                  >
                                    {entry.type === "rating"
                                      ? "Rating"
                                      : entry.type === "insight"
                                        ? "Insight"
                                        : "Exit"}
                                  </span>
                                </div>
                                <p className="mt-1 text-xs leading-relaxed text-slate-400">{entry.subLabel}</p>
                                <p className="mt-1.5 text-xs text-slate-500">
                                  {formatDateTime(entry.createdAt)}
                                </p>
                              </div>
                            </div>
                          </motion.div>
                        ))
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
