"use client";

import { AnimatePresence, motion } from "framer-motion";
import { MessageSquareText, Star, ThumbsUp } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
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

export function UserTable() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"insights" | "library" | "feedback">("insights");
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

  const latestInsight = selectedUserDetail.dailyInsights[0];
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
      subLabel: rating.promptType,
    }));
    const feedback = selectedUserDetail.insightFeedback.map((item) => ({
      id: `insight-${item.id}`,
      type: "insight" as const,
      createdAt: item.updatedAt,
      label: "Insight Feedback",
      subLabel: `Career:${item.Career ?? "-"} Health:${item.Health ?? "-"} Finances:${
        item.Finances ?? "-"
      } Daily:${item.Daily ?? "-"}`,
    }));
    const exit = selectedUserDetail.exitFeedback.map((item) => ({
      id: `exit-${item.id}`,
      type: "exit" as const,
      createdAt: item.createdAt,
      label: "Exit Feedback",
      subLabel: item.response,
    }));
    return [...ratings, ...feedback, ...exit].sort((a, b) => {
      const aDate = toJSDate(a.createdAt)?.getTime() ?? 0;
      const bDate = toJSDate(b.createdAt)?.getTime() ?? 0;
      return bDate - aDate;
    });
  }, [selectedUserDetail.dailyRatings, selectedUserDetail.insightFeedback, selectedUserDetail.exitFeedback]);

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
                    <CardHeader>
                      <CardTitle>Today&apos;s Reading</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {latestInsight ? (
                        <>
                          <p className="text-sm text-slate-300">Date: {latestInsight.date}</p>
                          <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.08 }}
                            className="rounded-lg border border-slate-700/50 bg-slate-900 p-3 text-sm text-slate-300"
                          >
                            {(latestInsight.aiDashboard as { overall_dashboard?: { overall_reading_en?: string } })
                              ?.overall_dashboard?.overall_reading_en ?? "Latest insight is available."}
                          </motion.p>
                        </>
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
                    <CardHeader>
                      <CardTitle>Saved Readings</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {selectedUserDetail.savedReadings.length === 0 ? (
                        <p className="py-10 text-center text-sm text-slate-500">No Saved Readings Yet</p>
                      ) : (
                        <ul className="space-y-2">
                          {selectedUserDetail.savedReadings.map((reading, i) => (
                            <motion.li
                              key={reading.id}
                              initial={{ opacity: 0, y: 6 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: i * 0.04, ...springSoft }}
                              whileHover={{ x: 2, transition: { duration: 0.18 } }}
                              className="rounded-lg border border-slate-700/50 bg-slate-900 p-3"
                            >
                              <p className="text-sm font-medium text-slate-200">{reading.readingType}</p>
                              <p className="text-xs text-slate-500">
                                Date Saved: {formatTimestamp(reading.createdAt)}
                              </p>
                            </motion.li>
                          ))}
                        </ul>
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
                    <CardHeader>
                      <CardTitle>Feedback Timeline</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {timeline.length === 0 ? (
                        <p className="py-10 text-center text-sm text-slate-500">No Feedback Yet</p>
                      ) : (
                        timeline.map((entry, i) => (
                          <motion.div
                            key={entry.id}
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: Math.min(i * 0.03, 0.25), ...springSoft }}
                            whileHover={{ scale: 1.01, transition: springSnappy }}
                            className="rounded-lg border border-slate-700/50 bg-slate-900 p-3"
                          >
                            <div className="flex items-start gap-2">
                              {entry.type === "rating" ? (
                                <Star className="mt-0.5 h-4 w-4 text-amber-300" />
                              ) : entry.type === "insight" ? (
                                <ThumbsUp className="mt-0.5 h-4 w-4 text-emerald-300" />
                              ) : (
                                <MessageSquareText className="mt-0.5 h-4 w-4 text-indigo-300" />
                              )}
                              <div>
                                <p className="text-sm font-medium text-slate-200">{entry.label}</p>
                                <p className="text-xs text-slate-400">{entry.subLabel}</p>
                                <p className="text-xs text-slate-500">{formatDateTime(entry.createdAt)}</p>
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
