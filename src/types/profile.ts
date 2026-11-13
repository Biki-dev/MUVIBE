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
