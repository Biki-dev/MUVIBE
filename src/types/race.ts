/**
 * src/types/race.ts
 * ─────────────────────────────────────────────────────────────────
 * Types for Multiplayer Running Competition with Common Map Destination
 * and Live WebSocket Location Broadcast.
 * ─────────────────────────────────────────────────────────────────
 */

export interface RaceCoordinates {
  latitude: number;
  longitude: number;
}

export interface RaceDestination {
  id: string;
  name: string;
  area: string;
  description: string;
  coords: RaceCoordinates;
  defaultDistanceMeters: number;
  mapXPercent: number; // 0 to 100% position on the visual campus map
  mapYPercent: number; // 0 to 100% position on the visual campus map
  icon: string;
}

export interface RaceParticipant {
  id: string;
  name: string;
  college: string;
  avatar: string;
  isHost: boolean;
  isCurrentUser: boolean;
  coords: RaceCoordinates;
  distanceRemainingMeters: number;
  speedKmh: number;
  progressPercent: number; // 0 to 100% toward destination
  currentRank: number; // 1, 2, 3...
  hasFinished: boolean;
  finishTimeSeconds?: number;
  finishTimeFormatted?: string;
  color: string;
}

export type CustomRoomChallengeType = 'blitz_60s' | 'running_sprint';

export interface RaceRoom {
  code: string;
  hostId: string;
  challengeType: CustomRoomChallengeType;
  destination: RaceDestination;
  participants: RaceParticipant[];
  status: 'lobby' | 'countdown' | 'racing' | 'finished';
  winner: RaceParticipant | null;
  startedAt?: number;
  elapsedSeconds: number;
}

export interface RaceLocationUpdate {
  participantId: string;
  coords: RaceCoordinates;
  distanceRemainingMeters: number;
  speedKmh: number;
  progressPercent: number;
  timestamp: number;
}

