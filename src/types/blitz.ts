/**
 * src/types/blitz.ts
 * ─────────────────────────────────────────────────────────────────
 * Blitz Battle: a short head to head bout decided by movement the
 * phone can actually measure, namely steps from the pedometer and
 * distance from GPS. There is no camera and no pose estimation here.
 * ─────────────────────────────────────────────────────────────────
 */

/** How an opponent is found. */
export type BlitzQueueType = 'stranger' | 'nearby' | 'custom';

/** What the bout is scored on. Both come straight from the sensors. */
export type BlitzMode = 'run' | 'walk';

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
  | 'queue_select'
  | 'mode_select'
  /** Private room lobby: waiting for the other player. */
  | 'room'
  | 'searching'
  | 'matched'
  | 'countdown'
  | 'active'
  | 'finished';

/** Static description of a bout format. */
export interface BlitzModeSpec {
  id: BlitzMode;
  name: string;
  tagline: string;
  /** Bout length in seconds. */
  durationSeconds: number;
  /** What the winner is decided on. */
  measurement: 'steps' | 'distance_km';
  unit: string;
  icon: string;
  /** Typical opponent output over the bout, used to pace the rival. */
  parScore: number;
}

/** Live state of one bout. */
export interface BlitzSession {
  queueType: BlitzQueueType;
  mode: BlitzModeSpec;
  roomCode?: string;
  opponent: Challenger | null;
  secondsRemaining: number;
  /** Steps for a walk bout, metres for a run bout. */
  playerScore: number;
  opponentScore: number;
  /** Straight from the sensors, so the UI can say when it is estimating. */
  sensorNote: string;
  /** -1 behind through 0 level to +1 ahead. Drives the tug bar. */
  leadRatio: number;
}

export interface BlitzResult {
  mode: BlitzModeSpec;
  opponent: Challenger | null;
  playerScore: number;
  opponentScore: number;
  won: boolean;
  drawn: boolean;
  eloChange: number;
  pointsEarned: number;
}
