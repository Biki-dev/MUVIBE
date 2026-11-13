/**
 * src/services/activity-storage.ts
 * ─────────────────────────────────────────────────────────────────
 * Activities. Supabase is the only store; reads fall back to the
 * read-only JSON snapshot when the network is unavailable.
 * ─────────────────────────────────────────────────────────────────
 */
import { withSnapshot } from '@/lib/offline-cache';
import * as remote from './remote/activity-storage';
import { ActivityRecord } from '@/types/activity';

export function getAllActivities(): Promise<ActivityRecord[]> {
  return withSnapshot('activities', () => remote.getAllActivities());
}

export function saveActivity(
  activity: Omit<ActivityRecord, 'id' | 'createdAt'>
): Promise<ActivityRecord> {
  return remote.saveActivity(activity);
}

export function deleteActivity(id: string): Promise<boolean> {
  return remote.deleteActivity(id);
}

export function clearAllActivities(): Promise<void> {
  return remote.clearAllActivities();
}

export function syncActivitiesFromSupabase(): Promise<void> {
  return remote.syncActivitiesFromSupabase();
}

export function subscribeToActivities(onUpdate: () => void): () => void {
  return remote.subscribeToActivities(onUpdate);
}
