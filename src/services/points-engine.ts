/**
 * src/services/points-engine.ts
 * ─────────────────────────────────────────────────────────────────
 * The single source of truth for what an activity is worth.
 *
 * Everything downstream reads from here: individual rank, Guild Power,
 * squad totals, club standings. Before this existed each of those was a
 * separate hardcoded array, which is why the app could show 7 km on one
 * screen and 100 km on another for the same person.
 *
 * Keep this pure. The SQL in supabase/migrations/005 mirrors these
 * numbers so a cloud leaderboard agrees with a local one; change one and
 * change the other.
 * ─────────────────────────────────────────────────────────────────
 */

export const POINTS = {
  /** Awarded once per logged activity of at least MIN_DURATION_SECONDS. */
  perActivity: 10,
  perKm: 5,
  perThousandSteps: 3,
  perHundredCalories: 2,
  /** Upper bound per person per day, so one long ride cannot run away with it. */
  dailyCap: 300,
} as const;

export const MIN_DURATION_SECONDS = 300;

export interface ScorableActivity {
  startedAt: string;
  durationSeconds: number;
  distanceKm: number | null;
  steps: number | null;
  calories: number | null;
}

/** Points for one activity, before the daily cap. */
export function pointsForActivity(a: ScorableActivity): number {
  if ((a.durationSeconds ?? 0) < MIN_DURATION_SECONDS) return 0;

  let total = POINTS.perActivity;
  total += (a.distanceKm ?? 0) * POINTS.perKm;
  total += ((a.steps ?? 0) / 1000) * POINTS.perThousandSteps;
  total += ((a.calories ?? 0) / 100) * POINTS.perHundredCalories;
  return Math.round(total);
}

/**
 * Points for a set of activities, applying the daily cap per calendar day.
 * Days are local to the device, matching how streaks are counted in
 * activity-stats.ts.
 */
export function totalPoints(activities: ScorableActivity[]): number {
  const byDay = new Map<string, number>();

  for (const a of activities) {
    const day = a.startedAt.slice(0, 10);
    byDay.set(day, (byDay.get(day) ?? 0) + pointsForActivity(a));
  }

  let total = 0;
  byDay.forEach((dayTotal) => {
    total += Math.min(dayTotal, POINTS.dailyCap);
  });
  return total;
}

export type LeaderboardPeriodKey = 'weekly' | 'monthly' | 'all_time';

/** ISO timestamp marking the start of a leaderboard period. */
export function periodStart(period: LeaderboardPeriodKey): string {
  const now = new Date();

  if (period === 'weekly') {
    // Monday as the first day, matching the week strip on Home.
    const day = now.getDay();
    const toMonday = day === 0 ? -6 : 1 - day;
    const monday = new Date(now);
    monday.setDate(now.getDate() + toMonday);
    monday.setHours(0, 0, 0, 0);
    return monday.toISOString();
  }

  if (period === 'monthly') {
    return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  }

  return new Date(0).toISOString();
}

/** The headline number shown beside a rank, picked from what was logged. */
export function metricLabel(distanceKm: number, steps: number, activeMinutes: number): string {
  if (distanceKm >= 1) return `${distanceKm.toFixed(1)} km`;
  if (steps >= 1000) return `${Math.round(steps).toLocaleString()} steps`;
  if (activeMinutes > 0) return `${Math.round(activeMinutes)} active mins`;
  return 'No activity yet';
}
