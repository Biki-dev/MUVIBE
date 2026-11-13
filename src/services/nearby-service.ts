/**
 * src/services/nearby-service.ts
 * ─────────────────────────────────────────────────────────────────
 * Near Me, from Supabase. The people list is cached for offline
 * viewing; presence writes and challenges need a connection.
 * ─────────────────────────────────────────────────────────────────
 */
import { withSnapshot } from '@/lib/offline-cache';
import * as remote from './remote/nearby-service';
import { ActivityType } from '@/types/activity';
import {
  Coordinates,
  MyPresence,
  NearbyStudent,
  NewPeerChallenge,
  PeerChallenge,
} from '@/types/nearby';

export function getMyPresence(): Promise<MyPresence> {
  return remote.getMyPresence();
}

export function setMyPresence(
  coords: Coordinates,
  statusText: string | null,
  lastActivityType: ActivityType | null
): Promise<void> {
  return remote.setMyPresence(coords, statusText, lastActivityType);
}

export function clearMyPresence(): Promise<void> {
  return remote.clearMyPresence();
}

export function fetchNearby(origin: Coordinates, radiusKm: number): Promise<NearbyStudent[]> {
  return withSnapshot('nearby', () => remote.fetchNearby(origin, radiusKm));
}

export function sendPeerChallenge(input: NewPeerChallenge): Promise<boolean> {
  return remote.sendPeerChallenge(input);
}

export function respondPeerChallenge(
  challengeId: string,
  response: 'accepted' | 'declined' | 'cancelled'
): Promise<boolean> {
  return remote.respondPeerChallenge(challengeId, response);
}

export function fetchMyPeerChallenges(): Promise<PeerChallenge[]> {
  return withSnapshot('peer-challenges', () => remote.fetchMyPeerChallenges());
}

export function subscribeToNearby(onUpdate: () => void): () => void {
  return remote.subscribeToNearby(onUpdate);
}
