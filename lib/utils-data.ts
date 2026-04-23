import { differenceInYears, isValid, parse } from "date-fns";

import type { FirebaseTimestamp } from "../types/user";

export function toJSDate(
  timestamp?: FirebaseTimestamp | null
): Date | null {
  if (!timestamp) return null;

  const milliseconds =
    timestamp._seconds * 1000 + Math.floor(timestamp._nanoseconds / 1_000_000);

  return new Date(milliseconds);
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
