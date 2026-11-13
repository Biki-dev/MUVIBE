import { ActivityType } from '@/types/activity';

export interface Coordinates {
  latitude: number;
  longitude: number;
}

/** A student who has opted in to being seen by people nearby. */
export interface NearbyStudent {
  id: string;
  name: string;
  username: string;
  department: string;
  academicYear: string;
  avatarColor: string;
  /** Vector icon for the avatar, named after the react-native-vector-icons directory. */
  avatarIcon: { name: string; type: 'ion' | 'mci' };
  /** Straight-line distance from the viewer, km. */
  distanceKm: number;
  /** What they said they are up to, if anything. */
  statusText: string | null;
  /** Most recent logged activity, if any. */
  lastActivity: {
    type: ActivityType;
    distanceKm: number | null;
    steps: number | null;
    durationSeconds: number;
    endedAt: string;
  } | null;
  /** Minutes since their presence was last refreshed. */
  lastSeenMinutes: number;
  /** Seeded placeholder, labelled in the UI. Guest mode only. */
  isDemo: boolean;
  /** An open challenge already exists between you and this student. */
  openChallengeId: string | null;
}

export type PeerChallengeMeasurement = 'steps' | 'distance_km';
export type PeerChallengeStatus =
  | 'pending'
  | 'accepted'
  | 'declined'
  | 'completed'
  | 'cancelled';

export interface PeerChallenge {
  id: string;
  challengerId: string;
  challengeeId: string;
  /** The other person, from the viewer's side. */
  opponent: {
    id: string;
    name: string;
    username: string;
    avatarColor: string;
    avatarIcon: { name: string; type: 'ion' | 'mci' };
  };
  /** True when the viewer sent it. */
  isMine: boolean;
  measurement: PeerChallengeMeasurement;
  goal: number;
  goalFormatted: string;
  durationDays: number;
  status: PeerChallengeStatus;
  createdAt: string;
  startsAt: string | null;
  endsAt: string | null;
  remainingDays: number;
  myProgress: number;
  opponentProgress: number;
}

export interface MyPresence {
  visible: boolean;
  statusText: string | null;
  coords: Coordinates | null;
  updatedAt: string | null;
}

export interface NewPeerChallenge {
  opponentId: string;
  measurement: PeerChallengeMeasurement;
  goal: number;
  durationDays: number;
}
