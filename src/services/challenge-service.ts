/**
 * src/services/challenge-service.ts
 * ─────────────────────────────────────────────────────────────────
 * Challenges, from Supabase, with a read-only offline snapshot.
 * ─────────────────────────────────────────────────────────────────
 */
import { withSnapshot } from '@/lib/offline-cache';
import * as remote from './remote/challenge-service';
import { Challenge } from '@/types/challenge';

export function fetchAllChallenges(userId?: string): Promise<Challenge[]> {
  return withSnapshot('challenges', () => remote.fetchAllChallenges(userId));
}

export function joinChallengeInDB(challengeId: string, userId: string): Promise<boolean> {
  return remote.joinChallengeInDB(challengeId, userId);
}

export function leaveChallengeInDB(challengeId: string, userId: string): Promise<boolean> {
  return remote.leaveChallengeInDB(challengeId, userId);
}

export function subscribeToChallenges(onUpdate: () => void): () => void {
  return remote.subscribeToChallenges(onUpdate);
}
