export type ClubCategory =
  | 'Sports'
  | 'Fitness'
  | 'Gym and wellness'
  | 'Adventure'
  | 'College clubs'
  | 'Other student communities';

export interface Club {
  id: string;
  name: string;
  college: string;
  category: ClubCategory;
  shortDescription: string;
  memberCount: number;
  logo: string; // Icon name or image url
  accentColor?: string;
  schedule?: string;
  meetingSpot?: string;
  isNearby?: boolean;
}

export interface ActivityItem {
  id: string;
  name: string;
  iconName: string;
  emoji?: string;
  popular?: boolean;
}
