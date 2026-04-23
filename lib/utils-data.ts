import { differenceInYears, isValid, parse } from "date-fns";

import type { FirebaseTimestamp } from "../types/user";

type FirestoreLikeTimestamp =
  | FirebaseTimestamp
  | { seconds: number; nanoseconds: number }
  | { toDate: () => Date };

export function toJSDate(timestamp?: FirestoreLikeTimestamp | string | number | null): Date | null {
  if (!timestamp) return null;

  if (typeof timestamp === "string" || typeof timestamp === "number") {
    const date = new Date(timestamp);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  if ("toDate" in timestamp && typeof timestamp.toDate === "function") {
    const date = timestamp.toDate();
    return Number.isNaN(date.getTime()) ? null : date;
  }

  let seconds: number | undefined;
  let nanos: number | undefined;

  if ("_seconds" in timestamp && "_nanoseconds" in timestamp) {
    seconds = timestamp._seconds;
    nanos = timestamp._nanoseconds;
  } else if ("seconds" in timestamp && "nanoseconds" in timestamp) {
    seconds = timestamp.seconds;
    nanos = timestamp.nanoseconds;
  }

  if (typeof seconds !== "number" || typeof nanos !== "number") return null;

  const milliseconds = seconds * 1000 + Math.floor(nanos / 1_000_000);
  const date = new Date(milliseconds);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function calculateAge(dobString: string | undefined | null): number {
  if (dobString == null || typeof dobString !== "string" || dobString.trim() === "") {
    return 0;
  }

  const dob = parse(dobString.trim(), "dd/MM/yyyy", new Date());

  if (!isValid(dob)) {
    return 0;
  }

  return differenceInYears(new Date(), dob);
}

export function extractState(locationName: string | undefined | null): string {
  if (locationName == null || typeof locationName !== "string" || locationName.trim() === "") {
    return "";
  }

  const parts = locationName
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length < 2) {
    return "";
  }

  return parts[parts.length - 2] ?? "";
}
