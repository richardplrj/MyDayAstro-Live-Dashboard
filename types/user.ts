export interface FirebaseTimestamp {
  _seconds: number;
  _nanoseconds: number;
}

export interface UserLocation {
  name: string;
  city: string;
  state: string;
}

export interface User {
  firstName: string;
  email: string;
  dob: string;
  tob: string;
  language: string;
  moonRasiNo: number;
  location: UserLocation;
  /** Preferred notification time; often hour 0–23 in local time, but may be an app-specific index. */
  notificationTimeSlot?: number;
  notificationsEnabled?: boolean;
}

export type FeedbackResponse = "helpful" | "not-helpful";
export type InsightFeedbackValue = "helpful" | "not-helpful" | null;

export interface DailyInsight {
  date: string;
  lucky_color_code?: string;
  lucky_color?: string;
  lucky_color_hi?: string;
  lucky_number?: number[];
  updatedAt?: FirebaseTimestamp;
  aiDashboard?: unknown;
}

export interface SavedReading {
  score: number;
  readingType: string;
  readingDateKey: string;
  contentEn: string;
  contentHi: string;
  createdAt: FirebaseTimestamp;
  updatedAt: FirebaseTimestamp;
}

export interface InsightFeedback {
  Daily: InsightFeedbackValue;
  Relationships: InsightFeedbackValue;
  Health: InsightFeedbackValue;
  Finances: InsightFeedbackValue;
  Career: InsightFeedbackValue;
  updatedAt: FirebaseTimestamp;
  DailyUpdatedAt?: FirebaseTimestamp | null;
  RelationshipsUpdatedAt?: FirebaseTimestamp | null;
  HealthUpdatedAt?: FirebaseTimestamp | null;
  FinancesUpdatedAt?: FirebaseTimestamp | null;
  CareerUpdatedAt?: FirebaseTimestamp | null;
}

export interface DailyRating {
  promptType: string;
  rating: number;
  createdAt: FirebaseTimestamp;
}

export interface ExitFeedback {
  response: FeedbackResponse;
  createdAt: FirebaseTimestamp;
}
