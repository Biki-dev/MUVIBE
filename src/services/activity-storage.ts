/**
 * src/services/activity-storage.ts
 * ─────────────────────────────────────────────────────────────────
 * Activity data layer — Supabase primary, AsyncStorage cache fallback.
 *
 * All mock/seed data is completely removed.
 * If user has no activities, returns empty list [] → UI displays 0 everywhere.
 * ─────────────────────────────────────────────────────────────────
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { ActivityRecord } from '@/types/activity';

const LOCAL_KEY = '@muvibe_activities_v2';
const OLD_V1_KEY = '@muvibe_activities_v1';
const OLD_SEED_KEY = '@muvibe_activities_seeded_v1';

// Proactively clear legacy mock activity caches from device storage
(async () => {
  try {
    await AsyncStorage.multiRemove([
      OLD_V1_KEY,
      OLD_SEED_KEY,
      '@fitconnect_activities_v1',
      '@fitconnect_activities_seeded_v1',
    ]);
  } catch {
    // non-fatal
  }
})();

// ── Helpers ───────────────────────────────────────────────────────
function generateId(): string {
  return `act_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

// ── Snake ↔ Camel mappers ─────────────────────────────────────────
function dbRowToRecord(row: Record<string, unknown>): ActivityRecord {
  return {
    id: String(row.id),
    type: row.type as ActivityRecord['type'],
    startedAt: String(row.started_at),
    endedAt: String(row.ended_at),
    durationSeconds: Number(row.duration_seconds ?? 0),
    distanceKm: row.distance_km != null ? Number(row.distance_km) : null,
    steps: row.steps != null ? Number(row.steps) : null,
    jumpCount: row.jump_count != null ? Number(row.jump_count) : null,
    calories: Number(row.calories ?? 0),
    averageSpeed: row.average_speed != null ? Number(row.average_speed) : null,
    averagePace: row.average_pace != null ? String(row.average_pace) : null,
    trackingMode: (row.tracking_mode as ActivityRecord['trackingMode']) ?? 'timer',
    notes: row.notes != null ? String(row.notes) : undefined,
    createdAt: String(row.created_at),
  };
}

function recordToDbRow(
  record: Omit<ActivityRecord, 'id' | 'createdAt'>,
  userId: string
): Record<string, unknown> {
  return {
    user_id: userId,
    type: record.type,
    started_at: record.startedAt,
    ended_at: record.endedAt,
    duration_seconds: record.durationSeconds,
    distance_km: record.distanceKm,
    steps: record.steps,
    jump_count: record.jumpCount,
    calories: record.calories,
    average_speed: record.averageSpeed,
    average_pace: record.averagePace,
    tracking_mode: record.trackingMode,
    notes: record.notes ?? null,
  };
}

// ── AsyncStorage cache helpers ─────────────────────────────────────
async function localRead(): Promise<ActivityRecord[]> {
  try {
    const json = await AsyncStorage.getItem(LOCAL_KEY);
    if (!json) return [];
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function localWrite(records: ActivityRecord[]): Promise<void> {
  try {
    await AsyncStorage.setItem(LOCAL_KEY, JSON.stringify(records));
  } catch {
    // non-fatal
  }
}

// ── Public API ────────────────────────────────────────────────────

/**
 * getAllActivities()
 *
 * Priority:
 *   1. Supabase (if logged in) — real database rows
 *   2. AsyncStorage cache    — offline fallback
 *   3. []                    — new user, no data → UI shows 0
 */
export async function getAllActivities(): Promise<ActivityRecord[]> {
  try {
    const { data: { session } } = await supabase.auth.getSession();

    if (session) {
      const { data, error } = await supabase
        .from('activities')
        .select('*')
        .eq('user_id', session.user.id)
        .order('started_at', { ascending: false });

      if (error) {
        console.warn('[activity-storage] Supabase fetch error:', error.message);
        return await localRead();
      }

      const records = (data ?? []).map(dbRowToRecord);
      await localWrite(records);
      return records;
    }

    // Not authenticated — read cached activities or empty array
    return await localRead();
  } catch (err) {
    console.error('[activity-storage] getAllActivities error:', err);
    return await localRead();
  }
}

/**
 * saveActivity()
 * Writes a completed activity to Supabase and mirrors to local cache.
 */
export async function saveActivity(
  activity: Omit<ActivityRecord, 'id' | 'createdAt'>
): Promise<ActivityRecord> {
  const fallbackRecord: ActivityRecord = {
    ...activity,
    id: generateId(),
    createdAt: new Date().toISOString(),
  };

  try {
    const { data: { session } } = await supabase.auth.getSession();

    if (session) {
      const row = recordToDbRow(activity, session.user.id);
      const { data: inserted, error } = await supabase
        .from('activities')
        .insert(row)
        .select()
        .single();

      if (error) {
        console.warn('[activity-storage] Supabase insert error:', error.message);
      } else if (inserted) {
        const dbRecord = dbRowToRecord(inserted as Record<string, unknown>);
        const existing = await localRead();
        await localWrite([dbRecord, ...existing]);
        return dbRecord;
      }
    }

    // Offline / fallback write
    const existing = await localRead();
    await localWrite([fallbackRecord, ...existing]);
    return fallbackRecord;
  } catch (err) {
    console.error('[activity-storage] saveActivity error:', err);
    const existing = await localRead();
    await localWrite([fallbackRecord, ...existing]);
    return fallbackRecord;
  }
}

/**
 * deleteActivity()
 * Removes an activity from Supabase and local cache.
 */
export async function deleteActivity(id: string): Promise<boolean> {
  try {
    const { data: { session } } = await supabase.auth.getSession();

    if (session) {
      await supabase
        .from('activities')
        .delete()
        .eq('id', id)
        .eq('user_id', session.user.id);
    }

    const existing = await localRead();
    await localWrite(existing.filter((a) => a.id !== id));
    return true;
  } catch (err) {
    console.error('[activity-storage] deleteActivity error:', err);
    return false;
  }
}

/**
 * clearAllActivities()
 * Clears local cache.
 */
export async function clearAllActivities(): Promise<void> {
  await AsyncStorage.removeItem(LOCAL_KEY);
}

/**
 * syncActivitiesFromSupabase()
 * Force-refresh local cache from Supabase.
 */
export async function syncActivitiesFromSupabase(): Promise<void> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data, error } = await supabase
      .from('activities')
      .select('*')
      .eq('user_id', session.user.id)
      .order('started_at', { ascending: false });

    if (!error && data) {
      await localWrite(data.map(dbRowToRecord));
    }
  } catch (err) {
    console.warn('[activity-storage] syncActivitiesFromSupabase error:', err);
  }
}

/**
 * subscribeToActivities()
 * Sets up a Supabase Realtime channel on the `activities` table.
 * Uses a unique channel topic per call to prevent collision/state errors
 * during React Fast Refresh or component re-renders.
 */
export function subscribeToActivities(onUpdate: () => void): () => void {
  if (!isSupabaseConfigured) {
    return () => {};
  }

  try {
    const channelId = `act_sub_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const channel = supabase
      .channel(channelId)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'activities' },
        () => {
          onUpdate();
        }
      )
      .subscribe();

    return () => {
      try {
        supabase.removeChannel(channel);
      } catch {
        // non-fatal
      }
    };
  } catch (err) {
    console.warn('[activity-storage] subscribeToActivities error:', err);
    return () => {};
  }
}
