export type ChallengeCategory = 'for_you' | 'individual' | 'squad' | 'campus';

export type ChallengeDifficulty = 'beginner' | 'intermediate' | 'advanced';

export type ChallengeMeasurement =
  | 'steps'
  | 'distance_km'
  | 'active_minutes'
  | 'calories'
  | 'jump_count'
  | 'activity_count'
  | 'team_steps'
  | 'team_distance_km';

export type ChallengeStatus = 'not_joined' | 'active' | 'completed';

export interface SquadMember {
  name: string;
  username: string;
  avatarColor: string;
  avatarEmoji: string;
  contribution: number;
  contributionUnit: string;
}

export interface SquadInfo {
  squadName: string;
  teamProgress: number;
  teamTarget: number;
  teamMembersCount: number;
  members: SquadMember[];
}

export interface ParticipantPreview {
  id: string;
  name: string;
  username: string;
  avatarColor: string;
  avatarEmoji: string;
}

export interface Challenge {
  id: string;
  title: string;
  category: ChallengeCategory;
  difficulty: ChallengeDifficulty;
  description: string;
  goal: number;
  goalFormatted: string;
  goalUnit: string;
  measurement: ChallengeMeasurement;
  durationDays: number;
  participantsCount: number;
  rewardPoints: number;
  progress: number;
  status: ChallengeStatus;
  startDate: string;
  endDate: string;
  remainingDays: number;
  featured: boolean;
  coverGradient: {
    bg: string;
    accent: string;
    icon: string;
  };
  rules: string[];
  eligibility: string;
  squadInfo?: SquadInfo;
  participantsPreview: ParticipantPreview[];
  completedDate?: string;
  activityType?: string;
}
