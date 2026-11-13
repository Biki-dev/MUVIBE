import { LeaderboardPeriod } from '@/types/community';

export type { LeaderboardPeriod };

/** Which grouping a guild board is showing. */
export type GuildDimension = 'department' | 'hostel';

export interface GuildRankItem {
  rank: number;
  id: string;
  name: string;
  /** Sum of member points in the period. */
  guildPower: number;
  memberCount: number;
  avgPerMember: number;
  totalDistanceKm: number;
  totalSteps: number;
  isMine: boolean;
}

export interface SquadSummary {
  id: string;
  name: string;
  memberCount: number;
  isMine: boolean;
  members: { id: string; name: string; initial: string; contribution: number }[];
}

export interface SquadQuest {
  id: string;
  squadId: string;
  squadName: string;
  title: string;
  measurement: 'steps' | 'distance_km' | 'calories';
  goal: number;
  goalFormatted: string;
  /** Combined across every member. */
  progress: number;
  progressPct: number;
  startsAt: string;
  endsAt: string;
  remainingDays: number;
  status: 'active' | 'completed' | 'expired';
  /** Per-member split, highest first. The laggard is last. */
  contributions: {
    userId: string;
    name: string;
    initial: string;
    value: number;
    isMe: boolean;
  }[];
}

export interface NewSquadQuest {
  squadId: string;
  title: string;
  measurement: 'steps' | 'distance_km' | 'calories';
  goal: number;
  durationDays: number;
}
