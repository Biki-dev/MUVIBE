export type BlitzQueueType = 'stranger' | 'nearby' | 'custom';

export type StrangerSubMode = 'campus_brawl' | 'turf_war';

export interface Challenger {
  id: string;
  name: string;
  college: string;
  department?: string;
  avatar: string;
  elo: number;
  locationTag?: string;
  distanceMeters?: number;
  isOnline: boolean;
  streak?: number;
}

export type BlitzMatchStatus =
  | 'idle'
  | 'queue_select'
  | 'searching'
  | 'matched'
  | 'countdown'
  | 'active'
  | 'finished'
  | 'sprint_race'
  | 'sprint_finished';

export type FormState = 'idle' | 'descending' | 'bottom_reached' | 'locked_out' | 'go_lower';

export interface BlitzSession {
  queueType: BlitzQueueType;
  subMode?: StrangerSubMode;
  roomCode?: string;
  opponent: Challenger | null;
  exercise: string;
  durationSeconds: number;
  secondsRemaining: number;
  playerReps: number;
  opponentReps: number;
  playerElbowAngle: number;
  isFormValid: boolean;
  formFeedback: 'PERFECT FORM' | 'GO LOWER!' | 'LOCK OUT!' | 'READY' | null;
  tugOfWarOffset: number; // -50 to +50 (0 is even, positive is player leading)
  playerEloChange?: number;
  collegePointsEarned?: number;
}

