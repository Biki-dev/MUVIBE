/**
 * src/services/remote/leaderboard-service.ts
 * ─────────────────────────────────────────────────────────────────
 * Leaderboards from Supabase. Requires migration 005.
 *
 * RLS keeps activity rows private, so ranking happens inside security
 * definer functions that return aggregates only. The client never sees
 * another student's individual sessions.
 * ─────────────────────────────────────────────────────────────────
 */
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { IndividualRankItem, LeaderboardPeriod } from '@/types/community';
import { GuildDimension, GuildRankItem } from '@/types/leaderboard';
import { metricLabel, periodStart } from '@/services/points-engine';

const AVATAR_COLORS = ['#C5F36B', '#5279F6', '#E8A34A', '#E56C67', '#9B51E0'];
const AVATAR_EMOJIS = ['🏃', '🚴', '🏋️', '🧘', '🤸', '🚶'];

async function me(): Promise<string | null> {
  if (!isSupabaseConfigured) return null;
  const { data } = await supabase.auth.getSession();
  return data.session?.user.id ?? null;
}

export async function fetchIndividualLeaderboard(
  period: LeaderboardPeriod
): Promise<IndividualRankItem[]> {
  if (!isSupabaseConfigured) return [];

  try {
    const userId = await me();
    const { data, error } = await supabase.rpc('individual_leaderboard', {
      since: periodStart(period),
      limit_n: 50,
    });
    if (error || !data) {
      console.warn('[leaderboard] individual_leaderboard failed:', error?.message);
      return [];
    }

    return data.map(
      (
        r: {
          user_id: string;
          full_name: string | null;
          username: string | null;
          department: string | null;
          points: number;
          distance_km: number;
          steps: number;
          active_minutes: number;
        },
        i: number
      ) => {
        const isMe = r.user_id === userId;
        const name = r.full_name || 'Student';
        return {
          rank: i + 1,
          id: r.user_id,
          name: isMe ? `${name} (You)` : name,
          username: r.username || 'student',
          department: r.department || 'Unassigned',
          points: Math.round(Number(r.points)),
          metricLabel: metricLabel(
            Number(r.distance_km ?? 0),
            Number(r.steps ?? 0),
            Number(r.active_minutes ?? 0)
          ),
          movement: 'same' as const,
          avatarColor: AVATAR_COLORS[i % AVATAR_COLORS.length],
          avatarEmoji: AVATAR_EMOJIS[i % AVATAR_EMOJIS.length],
          isCurrentUser: isMe,
        };
      }
    );
  } catch (error) {
    console.error('[leaderboard] fetchIndividualLeaderboard failed:', error);
    return [];
  }
}

export async function fetchGuildLeaderboard(
  period: LeaderboardPeriod,
  dimension: GuildDimension
): Promise<GuildRankItem[]> {
  if (!isSupabaseConfigured) return [];

  try {
    const userId = await me();
    let myGuild: string | null = null;
    if (userId) {
      const { data: profile } = await supabase
        .from('users')
        .select('department, hostel')
        .eq('id', userId)
        .maybeSingle();
      myGuild = dimension === 'hostel' ? profile?.hostel ?? null : profile?.department ?? null;
    }

    const { data, error } = await supabase.rpc('guild_leaderboard', {
      since: periodStart(period),
      dimension,
    });
    if (error || !data) {
      console.warn('[leaderboard] guild_leaderboard failed:', error?.message);
      return [];
    }

    return data.map(
      (
        r: {
          guild: string;
          guild_power: number;
          member_count: number;
          distance_km: number;
          steps: number;
        },
        i: number
      ) => ({
        rank: i + 1,
        id: r.guild,
        name: r.guild,
        guildPower: Math.round(Number(r.guild_power)),
        memberCount: Number(r.member_count),
        avgPerMember: Math.round(Number(r.guild_power) / Math.max(1, Number(r.member_count))),
        totalDistanceKm: Number(Number(r.distance_km ?? 0).toFixed(1)),
        totalSteps: Math.round(Number(r.steps ?? 0)),
        isMine: myGuild != null && r.guild === myGuild,
      })
    );
  } catch (error) {
    console.error('[leaderboard] fetchGuildLeaderboard failed:', error);
    return [];
  }
}

export function subscribeToLeaderboards(onUpdate: () => void): () => void {
  if (!isSupabaseConfigured) return () => {};
  const channel = supabase
    .channel(`leaderboards_${Date.now()}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'activities' }, onUpdate)
    .subscribe();
  return () => {
    try {
      supabase.removeChannel(channel);
    } catch {
      // non-fatal
    }
  };
}
