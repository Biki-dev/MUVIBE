import { ActivityRecord, ActivityStats, PeriodType, StreakInfo } from '@/types/activity';

function toLocalDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function filterByPeriod(
  activities: ActivityRecord[],
  period: PeriodType
): ActivityRecord[] {
  const now = new Date();
  const todayStr = toLocalDateString(now);

  if (period === 'day') {
    return activities.filter((item) => {
      const itemDate = new Date(item.startedAt);
      return toLocalDateString(itemDate) === todayStr;
    });
  }

  if (period === 'week') {
    const currentDay = now.getDay();
    const distanceToMonday = currentDay === 0 ? -6 : 1 - currentDay;
    const monday = new Date(now);
    monday.setDate(now.getDate() + distanceToMonday);
    monday.setHours(0, 0, 0, 0);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    return activities.filter((item) => {
      const itemDate = new Date(item.startedAt);
      return itemDate >= monday && itemDate <= sunday;
    });
  }

  if (period === 'month') {
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    return activities.filter((item) => {
      const itemDate = new Date(item.startedAt);
      return (
        itemDate.getFullYear() === currentYear &&
        itemDate.getMonth() === currentMonth
      );
    });
  }

  return activities;
}

export function computeStats(activities: ActivityRecord[]): ActivityStats {
  let totalDistanceKm = 0;
  let totalCalories = 0;
  let totalSteps = 0;
  let totalDurationSeconds = 0;
  let runningDistanceKm = 0;
  let walkingDistanceKm = 0;
  let cyclingDistanceKm = 0;

  for (const item of activities) {
    totalDurationSeconds += item.durationSeconds || 0;
    totalCalories += item.calories || 0;

    if (item.steps) {
      totalSteps += item.steps;
    }

    if (item.distanceKm != null) {
      totalDistanceKm += item.distanceKm;
      if (item.type === 'running') {
        runningDistanceKm += item.distanceKm;
      } else if (item.type === 'walking') {
        walkingDistanceKm += item.distanceKm;
      } else if (item.type === 'cycling') {
        cyclingDistanceKm += item.distanceKm;
      }
    }
  }

  return {
    totalDistanceKm: Number(totalDistanceKm.toFixed(1)),
    totalCalories: Math.round(totalCalories),
    totalSteps,
    totalDurationSeconds,
    activityCount: activities.length,
    runningDistanceKm: Number(runningDistanceKm.toFixed(1)),
    walkingDistanceKm: Number(walkingDistanceKm.toFixed(1)),
    cyclingDistanceKm: Number(cyclingDistanceKm.toFixed(1)),
  };
}

export function computeStreak(allActivities: ActivityRecord[]): StreakInfo {
  const activeDateSet = new Set<string>();

  for (const item of allActivities) {
    if (item.durationSeconds > 0 || (item.steps && item.steps > 0)) {
      const d = new Date(item.startedAt);
      activeDateSet.add(toLocalDateString(d));
    }
  }

  const now = new Date();
  const todayStr = toLocalDateString(now);

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const yesterdayStr = toLocalDateString(yesterday);

  // Current streak
  let currentStreak = 0;
  let checkDate = new Date(now);

  if (activeDateSet.has(todayStr)) {
    // Has today
    while (activeDateSet.has(toLocalDateString(checkDate))) {
      currentStreak++;
      checkDate.setDate(checkDate.getDate() - 1);
    }
  } else if (activeDateSet.has(yesterdayStr)) {
    // Did yesterday, today still pending
    checkDate = new Date(yesterday);
    while (activeDateSet.has(toLocalDateString(checkDate))) {
      currentStreak++;
      checkDate.setDate(checkDate.getDate() - 1);
    }
  }

  // Longest streak
  const sortedDates = Array.from(activeDateSet).sort();
  let longestStreak = 0;
  let currentRun = 0;
  let prevTimestamp = 0;

  for (const dateStr of sortedDates) {
    const parts = dateStr.split('-').map(Number);
    const d = new Date(parts[0], parts[1] - 1, parts[2]).getTime();
    const oneDayMs = 24 * 60 * 60 * 1000;

    if (prevTimestamp === 0) {
      currentRun = 1;
    } else {
      const diffDays = Math.round((d - prevTimestamp) / oneDayMs);
      if (diffDays === 1) {
        currentRun++;
      } else if (diffDays > 1) {
        currentRun = 1;
      }
    }
    prevTimestamp = d;
    if (currentRun > longestStreak) {
      longestStreak = currentRun;
    }
  }

  longestStreak = Math.max(longestStreak, currentStreak);

  // Active days this month
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  let activeDaysThisMonth = 0;

  for (const dateStr of activeDateSet) {
    const [y, m] = dateStr.split('-').map(Number);
    if (y === currentYear && m === currentMonth + 1) {
      activeDaysThisMonth++;
    }
  }

  // Week day status (Mon..Sun = 0..6)
  const currentDay = now.getDay();
  const distanceToMonday = currentDay === 0 ? -6 : 1 - currentDay;
  const monday = new Date(now);
  monday.setDate(now.getDate() + distanceToMonday);

  const weekDayStatus: Record<number, 'completed' | 'missed' | 'today' | 'upcoming'> = {};
  const todayDateNum = now.getDate();
  const todayMonth = now.getMonth();
  const todayYear = now.getFullYear();

  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const dStr = toLocalDateString(d);

    const isToday =
      d.getDate() === todayDateNum &&
      d.getMonth() === todayMonth &&
      d.getFullYear() === todayYear;

    const isFuture =
      !isToday &&
      d > new Date(todayYear, todayMonth, todayDateNum, 23, 59, 59, 999);

    if (isFuture) {
      weekDayStatus[i] = 'upcoming';
    } else if (isToday) {
      weekDayStatus[i] = activeDateSet.has(dStr) ? 'completed' : 'today';
    } else {
      weekDayStatus[i] = activeDateSet.has(dStr) ? 'completed' : 'missed';
    }
  }

  return {
    currentStreak,
    longestStreak,
    totalActiveDays: activeDateSet.size,
    activeDaysThisMonth,
    weekDayStatus,
  };
}

export function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return '0m';
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
}

export function formatPace(paceStr: string | null): string {
  if (!paceStr) return '--:-- /km';
  return `${paceStr} /km`;
}
