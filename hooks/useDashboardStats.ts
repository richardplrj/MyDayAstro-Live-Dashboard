"use client";

import { useEffect, useState } from "react";
import { collection, collectionGroup, onSnapshot } from "firebase/firestore";

import { db } from "../lib/firebase";
import { calculateAge, extractState } from "../lib/utils-data";
import type { InsightFeedback, User } from "../types/user";

export interface CountByLabel {
  count: number;
}

export interface StateData extends CountByLabel {
  state: string;
}

export interface AgeData extends CountByLabel {
  range: string;
}

export interface RasiData extends CountByLabel {
  rasi: string;
}

export interface FeedbackStats {
  Daily: number;
  Relationships: number;
  Health: number;
  Finances: number;
  Career: number;
}

/** Per category field across all insightFeedback docs (5 slots per doc). */
export interface InsightFeedbackTotals {
  helpful: number;
  notHelpful: number;
  unset: number;
}

export interface ExitFeedbackTotals {
  helpful: number;
  notHelpful: number;
}

export interface NotificationTimeData {
  label: string;
  count: number;
}

const INSIGHT_CATEGORY_KEYS = [
  "Daily",
  "Relationships",
  "Health",
  "Finances",
  "Career",
] as const satisfies readonly (keyof InsightFeedback)[];

const INITIAL_INSIGHT_TOTALS: InsightFeedbackTotals = {
  helpful: 0,
  notHelpful: 0,
  unset: 0,
};

const INITIAL_EXIT_TOTALS: ExitFeedbackTotals = {
  helpful: 0,
  notHelpful: 0,
};

interface DashboardStatsResult {
  totalUsers: number;
  stateData: StateData[];
  ageData: AgeData[];
  rasiData: RasiData[];
  totalSavedReadings: number;
  feedbackStats: FeedbackStats;
  insightFeedbackTotals: InsightFeedbackTotals;
  exitFeedbackTotals: ExitFeedbackTotals;
  notificationTimeData: NotificationTimeData[];
  loading: boolean;
  isLive: boolean;
  error: string | null;
}

const INITIAL_FEEDBACK_STATS: FeedbackStats = {
  Daily: 0,
  Relationships: 0,
  Health: 0,
  Finances: 0,
  Career: 0,
};

const AGE_RANGES = [
  { key: "Under 18", min: 0, max: 17 },
  { key: "18-24", min: 18, max: 24 },
  { key: "25-34", min: 25, max: 34 },
  { key: "35-44", min: 35, max: 44 },
  { key: "45-54", min: 45, max: 54 },
  { key: "55+", min: 55, max: Number.POSITIVE_INFINITY },
] as const;

function getAgeRange(age: number): string {
  const range = AGE_RANGES.find((item) => age >= item.min && age <= item.max);
  return range?.key ?? "Unknown";
}

/** Buckets one user for notification time distribution (live from `users`). */
function bucketNotificationTimeSlot(user: Partial<User>): { key: string; label: string; sort: number } {
  const raw = user.notificationTimeSlot as unknown;
  if (raw === undefined || raw === null || (typeof raw === "string" && raw.trim() === "")) {
    return { key: "__unset__", label: "Not set", sort: 1000 };
  }
  const n = typeof raw === "number" ? raw : Number(raw);
  if (Number.isFinite(n) && n >= 0 && n <= 23) {
    return { key: `h${n}`, label: `${String(n).padStart(2, "0")}:00`, sort: n };
  }
  if (Number.isFinite(n)) {
    return { key: `v${n}`, label: `Slot ${n}`, sort: 300 + n };
  }
  return { key: `o_${String(raw)}`, label: String(raw), sort: 600 };
}

function normalizeFirestoreError(error: unknown): string {
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "permission-denied"
  ) {
    return "Permission denied while reading dashboard data.";
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Failed to load dashboard data.";
}

function normalizeFeedbackResponse(value: unknown): "helpful" | "not-helpful" | null {
  if (typeof value === "boolean") return value ? "helpful" : "not-helpful";
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase().replace(/[_\s]+/g, "-");
  if (normalized === "helpful" || normalized === "yes" || normalized === "true") {
    return "helpful";
  }
  if (
    normalized === "not-helpful" ||
    normalized === "nothelpful" ||
    normalized === "no" ||
    normalized === "false"
  ) {
    return "not-helpful";
  }
  return null;
}

export function useDashboardStats(): DashboardStatsResult {
  const [totalUsers, setTotalUsers] = useState(0);
  const [stateData, setStateData] = useState<StateData[]>([]);
  const [ageData, setAgeData] = useState<AgeData[]>([]);
  const [rasiData, setRasiData] = useState<RasiData[]>([]);
  const [totalSavedReadings, setTotalSavedReadings] = useState(0);
  const [feedbackStats, setFeedbackStats] =
    useState<FeedbackStats>(INITIAL_FEEDBACK_STATS);
  const [insightFeedbackTotals, setInsightFeedbackTotals] = useState<InsightFeedbackTotals>(
    INITIAL_INSIGHT_TOTALS
  );
  const [exitFeedbackTotals, setExitFeedbackTotals] = useState<ExitFeedbackTotals>(
    INITIAL_EXIT_TOTALS
  );
  const [notificationTimeData, setNotificationTimeData] = useState<NotificationTimeData[]>([]);
  const [usersLoaded, setUsersLoaded] = useState(false);
  const [savedReadingsLoaded, setSavedReadingsLoaded] = useState(false);
  const [feedbackLoaded, setFeedbackLoaded] = useState(false);
  const [exitFeedbackLoaded, setExitFeedbackLoaded] = useState(false);
  const [isLive, setIsLive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsLive(true);
    const unsubUsers = onSnapshot(
      collection(db, "users"),
      (snapshot) => {
        setError(null);
        setTotalUsers(snapshot.size);

        const statesCount = new Map<string, number>();
        const ageCount = new Map<string, number>();
        const rasiCount = new Map<string, number>();
        const notifBuckets = new Map<
          string,
          { label: string; sort: number; count: number }
        >();

        snapshot.docs.forEach((docSnap) => {
          const user = docSnap.data() as Partial<User>;
          const locationName = user.location?.name ?? "";
          const state = extractState(locationName) || "Unknown";
          statesCount.set(state, (statesCount.get(state) ?? 0) + 1);

          if (user.dob) {
            const age = calculateAge(user.dob);
            const range = getAgeRange(age);
            ageCount.set(range, (ageCount.get(range) ?? 0) + 1);
          } else {
            ageCount.set("Unknown", (ageCount.get("Unknown") ?? 0) + 1);
          }

          const rasiNo = user.moonRasiNo;
          const rasiKey =
            typeof rasiNo === "number" ? `Rasi ${rasiNo}` : "Unknown";
          rasiCount.set(rasiKey, (rasiCount.get(rasiKey) ?? 0) + 1);

          const slot = bucketNotificationTimeSlot(user);
          const prev = notifBuckets.get(slot.key) ?? {
            label: slot.label,
            sort: slot.sort,
            count: 0,
          };
          notifBuckets.set(slot.key, {
            label: slot.label,
            sort: slot.sort,
            count: prev.count + 1,
          });
        });

        setStateData(
          Array.from(statesCount.entries())
            .map(([state, count]) => ({ state, count }))
            .sort((a, b) => b.count - a.count)
        );
        setAgeData(
          Array.from(ageCount.entries())
            .map(([range, count]) => ({ range, count }))
            .sort((a, b) => b.count - a.count)
        );
        setRasiData(
          Array.from(rasiCount.entries())
            .map(([rasi, count]) => ({ rasi, count }))
            .sort((a, b) => b.count - a.count)
        );
        setNotificationTimeData(
          Array.from(notifBuckets.values())
            .sort((a, b) =>
              a.sort !== b.sort ? a.sort - b.sort : a.label.localeCompare(b.label)
            )
            .map(({ label, count }) => ({ label, count }))
        );
        setUsersLoaded(true);
      },
      (snapshotError) => {
        setError(normalizeFirestoreError(snapshotError));
        setUsersLoaded(true);
      }
    );

    const unsubSavedReadings = onSnapshot(
      collectionGroup(db, "saved_readings"),
      (snapshot) => {
        setError(null);
        setTotalSavedReadings(snapshot.size);
        setSavedReadingsLoaded(true);
      },
      (snapshotError) => {
        setError(normalizeFirestoreError(snapshotError));
        setSavedReadingsLoaded(true);
      }
    );

    const unsubInsightFeedback = onSnapshot(
      collectionGroup(db, "insightFeedback"),
      (snapshot) => {
        setError(null);
        const nextStats: FeedbackStats = { ...INITIAL_FEEDBACK_STATS };
        const totals: InsightFeedbackTotals = { ...INITIAL_INSIGHT_TOTALS };

        snapshot.docs.forEach((docSnap) => {
          const feedback = docSnap.data() as Partial<InsightFeedback>;
          if (normalizeFeedbackResponse(feedback.Daily) === "helpful") nextStats.Daily += 1;
          if (normalizeFeedbackResponse(feedback.Relationships) === "helpful")
            nextStats.Relationships += 1;
          if (normalizeFeedbackResponse(feedback.Health) === "helpful") nextStats.Health += 1;
          if (normalizeFeedbackResponse(feedback.Finances) === "helpful") nextStats.Finances += 1;
          if (normalizeFeedbackResponse(feedback.Career) === "helpful") nextStats.Career += 1;

          for (const key of INSIGHT_CATEGORY_KEYS) {
            const v = normalizeFeedbackResponse(feedback[key]);
            if (v === "helpful") totals.helpful += 1;
            else if (v === "not-helpful") totals.notHelpful += 1;
            else totals.unset += 1;
          }
        });

        setFeedbackStats(nextStats);
        setInsightFeedbackTotals(totals);
        setFeedbackLoaded(true);
      },
      (snapshotError) => {
        setError(normalizeFirestoreError(snapshotError));
        setFeedbackLoaded(true);
      }
    );

    const unsubExitFeedback = onSnapshot(
      collectionGroup(db, "exitFeedback"),
      (snapshot) => {
        setError(null);
        const totals: ExitFeedbackTotals = { helpful: 0, notHelpful: 0 };
        snapshot.docs.forEach((docSnap) => {
          const data = docSnap.data() as { response?: string };
          const normalized = normalizeFeedbackResponse(data.response);
          if (normalized === "helpful") totals.helpful += 1;
          else if (normalized === "not-helpful") totals.notHelpful += 1;
        });
        setExitFeedbackTotals(totals);
        setExitFeedbackLoaded(true);
      },
      (snapshotError) => {
        setError(normalizeFirestoreError(snapshotError));
        setExitFeedbackLoaded(true);
      }
    );

    return () => {
      setIsLive(false);
      unsubUsers();
      unsubSavedReadings();
      unsubInsightFeedback();
      unsubExitFeedback();
    };
  }, []);

  const loading =
    !usersLoaded || !savedReadingsLoaded || !feedbackLoaded || !exitFeedbackLoaded;

  return {
    totalUsers,
    stateData,
    ageData,
    rasiData,
    totalSavedReadings,
    feedbackStats,
    insightFeedbackTotals,
    exitFeedbackTotals,
    notificationTimeData,
    loading,
    isLive,
    error,
  };
}
