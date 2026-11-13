export interface AchievementBadge {
  id: string;
  title: string;
  description: string;
  unlockRequirement: string;
  unlocked: boolean;
  unlockedDate?: string;
  currentProgress?: number;
  targetGoal?: number;
  unit?: string;
  iconName: string;
  iconType: 'ion' | 'mci';
  color: string;
}

export interface ActivityHighlightItem {
  id: string;
  label: string;
  value: string;
  sublabel: string;
  iconName: string;
}

export interface ProfileFitnessOverview {
  activeMinutes: number;
  totalDistanceKm: number;
  totalSteps: number;
  totalActivities: number;
}

export interface PublicUserProfile {
  id: string;
  email: string;
  fullName: string;
  username: string;
  college: string;
  department: string;
  academicYear: string;
  avatarUrl: string;
  bio: string;
  followersCount: number;
  followingCount: number;
}

export interface UserConnectionItem {
  id: string;
  userId: string;
  fullName: string;
  username: string;
  avatarUrl: string;
  college: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
}
