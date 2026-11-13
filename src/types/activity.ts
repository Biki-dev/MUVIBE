export type ActivityType =
  | 'walking'
  | 'running'
  | 'cycling'
  | 'jump_rope'
  | 'gym'
  | 'yoga'
  | 'swimming'
  | 'hiking'
  | 'other';

export type TrackingMode = 'sensor' | 'gps' | 'timer' | 'manual';

export type PeriodType = 'day' | 'week' | 'month';

export interface ActivityRecord {
  id: string;
  type: ActivityType;
  startedAt: string;
  endedAt: string;
  durationSeconds: number;
  distanceKm: number | null;
  steps: number | null;
  jumpCount: number | null;
  calories: number;
  averageSpeed: number | null;
  averagePace: string | null;
  trackingMode: TrackingMode;
  notes?: string;
  createdAt: string;
}

export interface ActivityStats {
  totalDistanceKm: number;
  totalCalories: number;
  totalSteps: number;
  totalDurationSeconds: number;
  activityCount: number;
  runningDistanceKm: number;
  walkingDistanceKm: number;
  cyclingDistanceKm: number;
}

export interface StreakInfo {
  currentStreak: number;
  longestStreak: number;
  totalActiveDays: number;
  activeDaysThisMonth: number;
  weekDayStatus: Record<number, 'completed' | 'missed' | 'today' | 'upcoming'>;
}
