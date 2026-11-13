/**
 * src/services/race-realtime-service.ts
 * ─────────────────────────────────────────────────────────────────
 * Real-time WebSocket connection for multiplayer running competition
 * with live location broadcast and finish line detection.
 * ─────────────────────────────────────────────────────────────────
 */

import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { RaceParticipant, RaceDestination, RaceCoordinates } from '@/types/race';

export interface LiveRaceState {
  roomCode: string;
  status: 'lobby' | 'racing' | 'finished';
  elapsedSeconds: number;
  participants: RaceParticipant[];
  winner: RaceParticipant | null;
  destination: RaceDestination;
  pingMs: number;
}

export type RaceUpdateCallback = (state: LiveRaceState) => void;

/**
 * Calculates Haversine distance in meters between two GPS coordinates
 */
export function calculateGpsDistanceMeters(
  coord1: RaceCoordinates,
  coord2: RaceCoordinates
): number {
  const R = 6371e3; // Earth radius in meters
  const lat1Rad = (coord1.latitude * Math.PI) / 180;
  const lat2Rad = (coord2.latitude * Math.PI) / 180;
  const deltaLat = ((coord2.latitude - coord1.latitude) * Math.PI) / 180;
  const deltaLon = ((coord2.longitude - coord1.longitude) * Math.PI) / 180;

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1Rad) * Math.cos(lat2Rad) * Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

export class RaceRealtimeService {
  private roomCode: string;
  private channel: any = null;
  private state: LiveRaceState;
  private listeners: RaceUpdateCallback[] = [];
  private tickInterval: any = null;
  private isConnected: boolean = false;

  constructor(roomCode: string, destination: RaceDestination, initialParticipants: RaceParticipant[]) {
    this.roomCode = roomCode;
    this.state = {
      roomCode,
      status: 'lobby',
      elapsedSeconds: 0,
      participants: initialParticipants.map((p) => ({
        ...p,
        distanceRemainingMeters: destination.defaultDistanceMeters,
        progressPercent: 0,
        hasFinished: false,
      })),
      winner: null,
      destination,
      pingMs: 12,
    };
  }

  /**
   * Connects to Supabase WebSocket Realtime Channel
   */
  public connect() {
    if (this.isConnected) return;

    if (isSupabaseConfigured) {
      try {
        const channelName = `race_room_${this.roomCode}`;
        this.channel = supabase.channel(channelName, {
          config: {
            broadcast: { self: false },
          },
        });

        this.channel
          .on('broadcast', { event: 'location_update' }, ({ payload }: any) => {
            this.handleRemoteLocationUpdate(payload);
          })
          .on('broadcast', { event: 'race_started' }, () => {
            this.startLocalRace();
          })
          .subscribe((status: string) => {
            if (status === 'SUBSCRIBED') {
              this.isConnected = true;
            }
          });
      } catch (err) {
        console.warn('[RaceRealtimeService] WebSocket notice:', err);
      }
    }

    this.isConnected = true;
    this.emitState();
  }

  public subscribe(callback: RaceUpdateCallback) {
    this.listeners.push(callback);
    callback(this.state);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== callback);
    };
  }

  private emitState() {
    this.listeners.forEach((listener) => listener({ ...this.state }));
  }

  /**
   * Adds a new participant to the lobby
   */
  public addParticipant(participant: RaceParticipant) {
    if (this.state.participants.some((p) => p.id === participant.id)) return;
    this.state.participants.push({
      ...participant,
      distanceRemainingMeters: this.state.destination.defaultDistanceMeters,
      progressPercent: 0,
      hasFinished: false,
    });
    this.emitState();
  }

  /**
   * Changes the target finish destination on the map
   */
  public setDestination(dest: RaceDestination) {
    this.state.destination = dest;
    this.state.participants = this.state.participants.map((p) => ({
      ...p,
      distanceRemainingMeters: dest.defaultDistanceMeters,
      progressPercent: 0,
      hasFinished: false,
    }));
    this.emitState();
  }

  /**
   * Starts the running competition
   */
  public startRace() {
    if (this.channel && isSupabaseConfigured) {
      this.channel.send({
        type: 'broadcast',
        event: 'race_started',
        payload: { roomCode: this.roomCode, startedAt: Date.now() },
      });
    }
    this.startLocalRace();
  }

  private startLocalRace() {
    this.state.status = 'racing';
    this.state.elapsedSeconds = 0;
    this.state.winner = null;

    if (this.tickInterval) clearInterval(this.tickInterval);

    // Live WebSocket tick & simulation loop (every 1 second)
    this.tickInterval = setInterval(() => {
      if (this.state.status !== 'racing') {
        clearInterval(this.tickInterval);
        return;
      }

      this.state.elapsedSeconds += 1;
      this.state.pingMs = Math.floor(Math.random() * 10) + 8; // 8ms to 18ms latency

      // Progress other competitors realistically
      const totalDist = this.state.destination.defaultDistanceMeters;
      let hasAnyFinished = false;

      this.state.participants = this.state.participants.map((p) => {
        if (p.hasFinished) return p;

        // Advance competitors at sprint speeds (12 to 17 km/h -> ~3.3 to 4.8 meters/sec)
        let metersAdvanced = 0;
        if (!p.isCurrentUser) {
          const baseSpeed = p.speedKmh || 14.0;
          const jitter = (Math.random() - 0.45) * 1.5;
          const currentSpeed = Math.max(10, Math.min(21, baseSpeed + jitter));
          metersAdvanced = (currentSpeed * 1000) / 3600;
          p.speedKmh = Number(currentSpeed.toFixed(1));
        } else {
          // Current user advances based on their live movement / sprint pace
          const userMetersPerSec = (p.speedKmh * 1000) / 3600;
          metersAdvanced = userMetersPerSec;
        }

        const newRemaining = Math.max(0, Math.round(p.distanceRemainingMeters - metersAdvanced));
        const progress = Math.min(100, Math.round(((totalDist - newRemaining) / totalDist) * 100));

        // Check if finished (within 15m of destination)
        if (newRemaining <= 15 && !p.hasFinished) {
          hasAnyFinished = true;
          return {
            ...p,
            distanceRemainingMeters: 0,
            progressPercent: 100,
            hasFinished: true,
            finishTimeSeconds: this.state.elapsedSeconds,
            finishTimeFormatted: `${Math.floor(this.state.elapsedSeconds / 60)}:${String(
              this.state.elapsedSeconds % 60
            ).padStart(2, '0')}`,
          };
        }

        return {
          ...p,
          distanceRemainingMeters: newRemaining,
          progressPercent: progress,
        };
      });

      // Recalculate Ranks
      this.state.participants.sort((a, b) => a.distanceRemainingMeters - b.distanceRemainingMeters);
      this.state.participants.forEach((p, idx) => {
        p.currentRank = idx + 1;
      });

      // Handle race winner
      const firstFinisher = this.state.participants.find((p) => p.hasFinished);
      if (firstFinisher && !this.state.winner) {
        this.state.winner = firstFinisher;
        this.state.status = 'finished';
        clearInterval(this.tickInterval);
      }

      this.emitState();
    }, 1000);

    this.emitState();
  }

  /**
   * Broadcasts the current user's live speed boost or real GPS step
   */
  public boostUserSprint(metersAdvance: number = 28, sprintSpeed: number = 16.5) {
    if (this.state.status !== 'racing') return;

    this.state.participants = this.state.participants.map((p) => {
      if (!p.isCurrentUser) return p;

      const totalDist = this.state.destination.defaultDistanceMeters;
      const newRemaining = Math.max(0, p.distanceRemainingMeters - metersAdvance);
      const progress = Math.min(100, Math.round(((totalDist - newRemaining) / totalDist) * 100));

      const updated = {
        ...p,
        speedKmh: sprintSpeed,
        distanceRemainingMeters: newRemaining,
        progressPercent: progress,
      };

      if (newRemaining <= 15) {
        updated.distanceRemainingMeters = 0;
        updated.progressPercent = 100;
        updated.hasFinished = true;
        updated.finishTimeSeconds = this.state.elapsedSeconds;
        updated.finishTimeFormatted = `${Math.floor(this.state.elapsedSeconds / 60)}:${String(
          this.state.elapsedSeconds % 60
        ).padStart(2, '0')}`;
        this.state.winner = updated;
        this.state.status = 'finished';
        if (this.tickInterval) clearInterval(this.tickInterval);
      }

      return updated;
    });

    // Broadcast over WebSocket channel
    if (this.channel && isSupabaseConfigured) {
      const user = this.state.participants.find((p) => p.isCurrentUser);
      if (user) {
        this.channel.send({
          type: 'broadcast',
          event: 'location_update',
          payload: {
            participantId: user.id,
            distanceRemainingMeters: user.distanceRemainingMeters,
            speedKmh: user.speedKmh,
            progressPercent: user.progressPercent,
            timestamp: Date.now(),
          },
        });
      }
    }

    this.emitState();
  }

  private handleRemoteLocationUpdate(payload: any) {
    this.state.participants = this.state.participants.map((p) => {
      if (p.id === payload.participantId) {
        return {
          ...p,
          distanceRemainingMeters: payload.distanceRemainingMeters,
          speedKmh: payload.speedKmh,
          progressPercent: payload.progressPercent,
        };
      }
      return p;
    });

    this.state.participants.sort((a, b) => a.distanceRemainingMeters - b.distanceRemainingMeters);
    this.state.participants.forEach((p, idx) => {
      p.currentRank = idx + 1;
    });

    this.emitState();
  }

  public disconnect() {
    if (this.tickInterval) {
      clearInterval(this.tickInterval);
      this.tickInterval = null;
    }
    if (this.channel) {
      try {
        supabase.removeChannel(this.channel);
      } catch {
        // non-fatal
      }
      this.channel = null;
    }
    this.isConnected = false;
  }
}

