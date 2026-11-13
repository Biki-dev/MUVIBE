/**
 * src/services/native-widget-service.ts
 * ─────────────────────────────────────────────────────────────────
 * Bridge between React Native and the Android AppWidgetManager.
 *
 * Automatically syncs the user's latest stats (today's steps, distance,
 * calories, streak) to the Android system home screen widgets whenever
 * an activity completes or data is loaded in MUVIBE.
 * ─────────────────────────────────────────────────────────────────
 */
import { NativeModules, Platform } from 'react-native';
import { ActivityRecord, StreakInfo } from '@/types/activity';

const { WidgetBridge } = NativeModules;

export interface WidgetSyncData {
  todaySteps: number;
  todayDistanceKm: number;
  todayCalories: number;
  streakCount: number;
}

/**
 * Syncs the latest computed data to the Android system widgets.
 */
export async function syncNativeWidgets({
  todaySteps,
  todayDistanceKm,
  todayCalories,
  streakCount,
}: WidgetSyncData): Promise<boolean> {
  if (Platform.OS !== 'android') {
    return false;
  }

  if (!WidgetBridge || typeof WidgetBridge.updateWidgetData !== 'function') {
    return false;
  }

  try {
    const stepsFormatted = todaySteps > 0 ? todaySteps.toLocaleString() : '0';
    const distFormatted = `${todayDistanceKm.toFixed(1)} km`;
    const calFormatted = `${todayCalories.toLocaleString()} kcal`;
    const streakFormatted = String(streakCount);
    const streakMsg =
      streakCount > 0 ? 'Consistency is key!' : 'Log an activity today!';

    await WidgetBridge.updateWidgetData(
      stepsFormatted,
      distFormatted,
      calFormatted,
      streakFormatted,
      streakMsg
    );
    return true;
  } catch (err) {
    if (__DEV__) {
      console.warn('[NativeWidgetService] Failed to sync native widgets:', err);
    }
    return false;
  }
}

/**
 * Helper to compute and sync immediately from full activity array.
 */
export async function syncWidgetsFromActivities(
  activities: ActivityRecord[],
  streak: StreakInfo
): Promise<boolean> {
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const todayActivities = activities.filter((a) => {
    const d = new Date(a.startedAt);
    return (
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` ===
      todayStr
    );
  });

  let todaySteps = 0;
  let todayCalories = 0;
  let todayDistKm = 0;

  for (const a of todayActivities) {
    todaySteps += a.steps || 0;
    todayCalories += a.calories || 0;
    if (a.distanceKm) todayDistKm += a.distanceKm;
  }

  return syncNativeWidgets({
    todaySteps,
    todayDistanceKm: todayDistKm,
    todayCalories,
    streakCount: streak.currentStreak,
  });
}
