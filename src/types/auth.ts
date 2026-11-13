export type AuthProvider = 'email' | 'google' | 'guest';

export interface User {
  id: string;
  email: string;
  name?: string;
  provider: AuthProvider;
}

export interface StudentProfile {
  fullName: string;
  username: string;
  college: string;
  department: string;
  academicYear: string;
  avatarUrl?: string;
  bio?: string;
}

export type OnboardingStep =
  | 'splash'
  | 'auth'
  | 'profile'
  | 'activities'
  | 'location'
  | 'clubs'
  | 'customize'
  | 'finish'
  | 'completed';

export interface OnboardingData {
  profile: Partial<StudentProfile>;
  selectedActivities: string[];
  locationEnabled: boolean;
  joinedClubIds: string[];
  notificationsEnabled: boolean;
  isCompleted: boolean;
}
