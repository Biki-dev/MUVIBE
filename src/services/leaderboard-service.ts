/**
 * Leaderboards and Guild Power, from Supabase, with a read-only offline
 * snapshot. Requires migration 006.
 */
import { withSnapshot } from '@/lib/offline-cache';
import * as remote from './remote/leaderboard-service';
import { IndividualRankItem, LeaderboardPeriod } from '@/types/community';
import { GuildDimension, GuildRankItem } from '@/types/leaderboard';

export function fetchIndividualLeaderboard(
  period: LeaderboardPeriod
): Promise<IndividualRankItem[]> {
  return withSnapshot('leaderboard.individual', () =>
    remote.fetchIndividualLeaderboard(period)
  );
}

export function fetchGuildLeaderboard(
  period: LeaderboardPeriod,
  dimension: GuildDimension
): Promise<GuildRankItem[]> {
  return withSnapshot('leaderboard.guild', () =>
    remote.fetchGuildLeaderboard(period, dimension)
  );
}

export function subscribeToLeaderboards(onUpdate: () => void): () => void {
  return remote.subscribeToLeaderboards(onUpdate);
}
