import AsyncStorage from '@react-native-async-storage/async-storage';
import { ActivityRecord, ActivityType } from '@/types/activity';

const STORAGE_KEY = '@muvibe_activities_v1';
const SEED_KEY = '@muvibe_activities_seeded_v1';

function generateId(): string {
  return `act_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

// Helper to construct sample dates relative to today
function getRelativeDate(daysAgo: number, hours: number, minutes: number): string {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  date.setHours(hours, minutes, 0, 0);
  return date.toISOString();
}

const SAMPLE_ACTIVITIES: ActivityRecord[] = [
  // Today's activities
  {
    id: generateId(),
    type: 'walking',
    startedAt: getRelativeDate(0, 7, 30),
    endedAt: getRelativeDate(0, 8, 10),
    durationSeconds: 2400, // 40m
    distanceKm: 2.8,
    steps: 3750,
    jumpCount: null,
    calories: 145,
    averageSpeed: 4.2,
    averagePace: '14:17',
    trackingMode: 'sensor',
    notes: 'Morning walk across campus grounds',
    createdAt: getRelativeDate(0, 8, 10),
  },
  {
    id: generateId(),
    type: 'running',
    startedAt: getRelativeDate(0, 17, 0),
    endedAt: getRelativeDate(0, 17, 25),
    durationSeconds: 1500, // 25m
    distanceKm: 4.2,
    steps: 4200,
    jumpCount: null,
    calories: 280,
    averageSpeed: 10.1,
    averagePace: '5:57',
    trackingMode: 'gps',
    notes: 'Campus perimeter loop',
    createdAt: getRelativeDate(0, 17, 25),
  },
  // Yesterday's activities
  {
    id: generateId(),
    type: 'cycling',
    startedAt: getRelativeDate(1, 16, 30),
    endedAt: getRelativeDate(1, 17, 30),
    durationSeconds: 3600, // 60m
    distanceKm: 14.5,
    steps: null,
    jumpCount: null,
    calories: 420,
    averageSpeed: 14.5,
    averagePace: null,
    trackingMode: 'gps',
    notes: 'Highway bypass ride',
    createdAt: getRelativeDate(1, 17, 30),
  },
  {
    id: generateId(),
    type: 'jump_rope',
    startedAt: getRelativeDate(1, 18, 0),
    endedAt: getRelativeDate(1, 18, 15),
    durationSeconds: 900, // 15m
    distanceKm: null,
    steps: null,
    jumpCount: 850,
    calories: 120,
    averageSpeed: null,
    averagePace: null,
    trackingMode: 'sensor',
    notes: 'Hostel courtyard cardio',
    createdAt: getRelativeDate(1, 18, 15),
  },
  // 2 days ago
  {
    id: generateId(),
    type: 'gym',
    startedAt: getRelativeDate(2, 18, 0),
    endedAt: getRelativeDate(2, 19, 0),
    durationSeconds: 3600, // 60m
    distanceKm: null,
    steps: null,
    jumpCount: null,
    calories: 310,
    averageSpeed: null,
    averagePace: null,
    trackingMode: 'timer',
    notes: 'Upper body strength session',
    createdAt: getRelativeDate(2, 19, 0),
  },
  // 3 days ago
  {
    id: generateId(),
    type: 'walking',
    startedAt: getRelativeDate(3, 8, 0),
    endedAt: getRelativeDate(3, 8, 45),
    durationSeconds: 2700, // 45m
    distanceKm: 3.2,
    steps: 4300,
    jumpCount: null,
    calories: 160,
    averageSpeed: 4.3,
    averagePace: '14:03',
    trackingMode: 'sensor',
    notes: 'Library and department walk',
    createdAt: getRelativeDate(3, 8, 45),
  },
  // 4 days ago
  {
    id: generateId(),
    type: 'yoga',
    startedAt: getRelativeDate(4, 6, 30),
    endedAt: getRelativeDate(4, 7, 10),
    durationSeconds: 2400, // 40m
    distanceKm: null,
    steps: null,
    jumpCount: null,
    calories: 110,
    averageSpeed: null,
    averagePace: null,
    trackingMode: 'timer',
    notes: 'Morning flow and recovery',
    createdAt: getRelativeDate(4, 7, 10),
  },
  // 5 days ago
  {
    id: generateId(),
    type: 'running',
    startedAt: getRelativeDate(5, 17, 30),
    endedAt: getRelativeDate(5, 18, 0),
    durationSeconds: 1800, // 30m
    distanceKm: 5.0,
    steps: 5100,
    jumpCount: null,
    calories: 340,
    averageSpeed: 10.0,
    averagePace: '6:00',
    trackingMode: 'gps',
    notes: 'Track interval run',
    createdAt: getRelativeDate(5, 18, 0),
  },
  // 8 days ago (in current month, outside 7-day week)
  {
    id: generateId(),
    type: 'hiking',
    startedAt: getRelativeDate(8, 7, 0),
    endedAt: getRelativeDate(8, 9, 30),
    durationSeconds: 9000, // 2.5h
    distanceKm: 8.5,
    steps: 11200,
    jumpCount: null,
    calories: 620,
    averageSpeed: 3.4,
    averagePace: '17:38',
    trackingMode: 'gps',
    notes: 'Weekend hill trail',
    createdAt: getRelativeDate(8, 9, 30),
  },
];

export async function getAllActivities(): Promise<ActivityRecord[]> {
  try {
    const seeded = await AsyncStorage.getItem(SEED_KEY);
    if (!seeded) {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(SAMPLE_ACTIVITIES));
      await AsyncStorage.setItem(SEED_KEY, 'true');
      return SAMPLE_ACTIVITIES;
    }

    const json = await AsyncStorage.getItem(STORAGE_KEY);
    if (!json) return [];
    const activities: ActivityRecord[] = JSON.parse(json);
    return Array.isArray(activities) ? activities : [];
  } catch (error) {
    console.error('Failed to load activities from storage:', error);
    return [];
  }
}

export async function saveActivity(
  activity: Omit<ActivityRecord, 'id' | 'createdAt'>
): Promise<ActivityRecord> {
  const newRecord: ActivityRecord = {
    ...activity,
    id: generateId(),
    createdAt: new Date().toISOString(),
  };

  try {
    const existing = await getAllActivities();
    const updated = [newRecord, ...existing];
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return newRecord;
  } catch (error) {
    console.error('Failed to save activity to storage:', error);
    return newRecord;
  }
}

export async function deleteActivity(id: string): Promise<boolean> {
  try {
    const existing = await getAllActivities();
    const updated = existing.filter((a) => a.id !== id);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return true;
  } catch (error) {
    console.error('Failed to delete activity from storage:', error);
    return false;
  }
}

export async function clearAllActivities(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
    await AsyncStorage.removeItem(SEED_KEY);
  } catch (error) {
    console.error('Failed to clear activities:', error);
  }
}
