"use client";

import { useEffect, useState } from "react";
import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  type QueryConstraint,
} from "firebase/firestore";

import { db } from "../lib/firebase";
import type {
  DailyInsight,
  DailyRating,
  ExitFeedback,
  InsightFeedback,
  SavedReading,
  User,
} from "../types/user";

type FirestoreDoc<T> = T & { id: string };

interface UserDetailResult {
  user: User | null;
  dailyInsights: FirestoreDoc<DailyInsight>[];
  savedReadings: FirestoreDoc<SavedReading>[];
  insightFeedback: FirestoreDoc<InsightFeedback>[];
  dailyRatings: FirestoreDoc<DailyRating>[];
  exitFeedback: FirestoreDoc<ExitFeedback>[];
  loading: boolean;
  error: string | null;
}

function normalizeFirestoreError(error: unknown): string {
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "permission-denied"
  ) {
    return "Permission denied while reading user details.";
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Failed to load user details.";
}

type LoadedState = {
  user: boolean;
  dailyInsights: boolean;
  savedReadings: boolean;
  insightFeedback: boolean;
  dailyRatings: boolean;
  exitFeedback: boolean;
};

const INITIAL_LOADED_STATE: LoadedState = {
  user: false,
  dailyInsights: false,
  savedReadings: false,
  insightFeedback: false,
  dailyRatings: false,
  exitFeedback: false,
};

export function useUserDetail(userId: string): UserDetailResult {
  const [user, setUser] = useState<User | null>(null);
  const [dailyInsights, setDailyInsights] = useState<FirestoreDoc<DailyInsight>[]>([]);
  const [savedReadings, setSavedReadings] = useState<FirestoreDoc<SavedReading>[]>([]);
  const [insightFeedback, setInsightFeedback] = useState<FirestoreDoc<InsightFeedback>[]>([]);
  const [dailyRatings, setDailyRatings] = useState<FirestoreDoc<DailyRating>[]>([]);
  const [exitFeedback, setExitFeedback] = useState<FirestoreDoc<ExitFeedback>[]>([]);
  const [loaded, setLoaded] = useState<LoadedState>(INITIAL_LOADED_STATE);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setUser(null);
      setDailyInsights([]);
      setSavedReadings([]);
      setInsightFeedback([]);
      setDailyRatings([]);
      setExitFeedback([]);
      setLoaded({
        user: true,
        dailyInsights: true,
        savedReadings: true,
        insightFeedback: true,
        dailyRatings: true,
        exitFeedback: true,
      });
      setError("User ID is required.");
      return;
    }

    setLoaded(INITIAL_LOADED_STATE);
    setError(null);

    const userRef = doc(db, "users", userId);

    const listenCollection = <T,>(
      subcollectionName: string,
      setter: (value: FirestoreDoc<T>[]) => void,
      loadedKey: keyof LoadedState,
      constraints: QueryConstraint[] = []
    ) => {
      const baseCollection = collection(userRef, subcollectionName);
      const targetQuery =
        constraints.length > 0 ? query(baseCollection, ...constraints) : baseCollection;

      return onSnapshot(
        targetQuery,
        (snapshot) => {
          setter(
            snapshot.docs.map((docSnap) => ({
              id: docSnap.id,
              ...(docSnap.data() as T),
            }))
          );
          setLoaded((prev) => ({ ...prev, [loadedKey]: true }));
        },
        (snapshotError) => {
          setError(normalizeFirestoreError(snapshotError));
          setLoaded((prev) => ({ ...prev, [loadedKey]: true }));
        }
      );
    };

    const unsubUser = onSnapshot(
      userRef,
      (snapshot) => {
        setUser(snapshot.exists() ? (snapshot.data() as User) : null);
        setLoaded((prev) => ({ ...prev, user: true }));
      },
      (snapshotError) => {
        setError(normalizeFirestoreError(snapshotError));
        setLoaded((prev) => ({ ...prev, user: true }));
      }
    );

    const unsubDailyInsights = listenCollection<DailyInsight>(
      "daily_insights",
      setDailyInsights,
      "dailyInsights",
      [orderBy("updatedAt", "desc")]
    );
    const unsubSavedReadings = listenCollection<SavedReading>(
      "saved_readings",
      setSavedReadings,
      "savedReadings"
    );
    const unsubInsightFeedback = listenCollection<InsightFeedback>(
      "insightFeedback",
      setInsightFeedback,
      "insightFeedback"
    );
    const unsubDailyRatings = listenCollection<DailyRating>(
      "dailyRatings",
      setDailyRatings,
      "dailyRatings"
    );
    const unsubExitFeedback = listenCollection<ExitFeedback>(
      "exitFeedback",
      setExitFeedback,
      "exitFeedback"
    );

    return () => {
      unsubUser();
      unsubDailyInsights();
      unsubSavedReadings();
      unsubInsightFeedback();
      unsubDailyRatings();
      unsubExitFeedback();
    };
  }, [userId]);

  const loading = Object.values(loaded).some((value) => !value);

  return {
    user,
    dailyInsights,
    savedReadings,
    insightFeedback,
    dailyRatings,
    exitFeedback,
    loading,
    error,
  };
}
