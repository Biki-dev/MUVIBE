export type ClubCategory =
  | 'all'
  | 'running'
  | 'cycling'
  | 'sports'
  | 'gym_fitness'
  | 'adventure'
  | 'yoga_wellness'
  | 'general'
  | 'other';

export interface ClubMember {
  id: string;
  name: string;
  username: string;
  role: 'admin' | 'member';
  avatarColor: string;
  avatarEmoji: string;
}

export interface ClubMemberRankItem {
  rank: number;
  userId: string;
  name: string;
  username: string;
  role: 'admin' | 'member';
  avatarColor: string;
  avatarEmoji: string;
  points: number;
  distanceKm: number;
  activitiesCount: number;
  steps: number;
  isCurrentUser?: boolean;
}

export interface ClubDiscussionPost {
  id: string;
  clubId: string;
  userId: string;
  authorName: string;
  authorUsername: string;
  authorAvatarColor: string;
  title: string;
  content: string;
  imageUrl?: string;
  linkUrl?: string;
  upvotes: number;
  downvotes: number;
  score: number;
  userVote: 1 | -1 | 0;
  commentsCount: number;
  createdAt: string;
  formattedDate: string;
}

export interface ClubPostComment {
  id: string;
  postId: string;
  userId: string;
  authorName: string;
  authorUsername: string;
  authorAvatarColor: string;
  content: string;
  createdAt: string;
  formattedDate: string;
}

export interface CommunityClub {
  id: string;
  name: string;
  category: ClubCategory;
  categoryLabel: string;
  institution: string;
  description: string;
  longDescription: string;
  interests: string[];
  meetingLocation: string;
  memberCount: number;
  joined: boolean;
  featured: boolean;
  coverColor: string;
  totalPoints: number;
  totalDistanceKm: number;
  totalActivities: number;
  stats?: {
    activitiesOrganized: number;
    upcomingEventsCount: number;
    totalHoursLogged: number;
  };
  announcements?: {
    id: string;
    title: string;
    date: string;
    content: string;
  }[];
  upcomingActivities?: {
    id: string;
    name: string;
    date: string;
    time: string;
    venue: string;
    organizer: string;
  }[];
  members?: ClubMember[];
}

// ── Legacy Types preserved for backward compatibility ─────────────
export type LeaderboardCategory = 'individual' | 'department' | 'squad';
export type LeaderboardPeriod = 'weekly' | 'monthly' | 'all_time';

export interface IndividualRankItem {
  rank: number;
  id: string;
  name: string;
  username: string;
  department: string;
  points: number;
  metricLabel: string;
  movement: 'up' | 'down' | 'same';
  movementValue?: number;
  avatarColor: string;
  avatarEmoji: string;
  isCurrentUser?: boolean;
}

export interface DepartmentRankItem {
  rank: number;
  id: string;
  name: string;
  totalPoints: number;
  studentCount: number;
  avgPointsPerStudent: number;
  movement: 'up' | 'down' | 'same';
  movementValue?: number;
  isUserDepartment?: boolean;
}

export interface SquadRankItem {
  rank: number;
  id: string;
  name: string;
  totalPoints: number;
  memberCount: number;
  totalActivityFormatted: string;
  movement: 'up' | 'down' | 'same';
  isUserSquad?: boolean;
}

export type EventCategory =
  | 'all'
  | 'running'
  | 'cycling'
  | 'fitness'
  | 'sports'
  | 'adventure'
  | 'wellness';

export type EventTab = 'discover' | 'my_events' | 'past_events';

export interface EventScheduleItem {
  time: string;
  title: string;
}

export interface EventParticipant {
  name: string;
  username: string;
  avatarColor: string;
  avatarEmoji: string;
}

export interface CommunityEvent {
  id: string;
  name: string;
  category: EventCategory;
  categoryLabel: string;
  organizer: string;
  organizerClubId?: string;
  date: string;
  time: string;
  startTime: string;
  endTime: string;
  venue: string;
  distanceOrTarget: string;
  estimatedDuration: string;
  registrationDeadline: string;
  participantCount: number;
  registered: boolean;
  status: 'upcoming' | 'past';
  featured: boolean;
  description: string;
  schedule: EventScheduleItem[];
  participantsPreview: EventParticipant[];
  coverColor: string;
}
