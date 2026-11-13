import { ActivityType, TrackingMode } from '@/types/activity';

export type TrackingStatus = 'idle' | 'active' | 'paused' | 'completed';

export interface TrackingSession {
  type: ActivityType;
  status: TrackingStatus;
  startTime: number;
  pausedDuration: number;
  pausedAt: number | null;
  steps: number;
  distanceKm: number;
  jumpCount: number;
  calories: number;
}

export function createSession(type: ActivityType): TrackingSession {
  return {
    type,
    status: 'idle',
    startTime: 0,
    pausedDuration: 0,
    pausedAt: null,
    steps: 0,
    distanceKm: 0,
    jumpCount: 0,
    calories: 0,
  };
}

export function getElapsedSeconds(session: TrackingSession): number {
  if (session.status === 'idle' || session.startTime === 0) return 0;
  const now = session.pausedAt ? session.pausedAt : Date.now();
  const totalMs = now - session.startTime - session.pausedDuration;
  return Math.max(0, Math.floor(totalMs / 1000));
}

export function getElapsedString(session: TrackingSession): string {
  const seconds = getElapsedSeconds(session);
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  const mm = String(mins).padStart(2, '0');
  const ss = String(secs).padStart(2, '0');

  if (hrs > 0) {
    return `${hrs}:${mm}:${ss}`;
  }
  return `${mm}:${ss}`;
}

export function stepsToDistance(steps: number, type: 'walking' | 'running'): number {
  // Configurable stride length estimate: ~0.75m for walking, ~0.95m for running
  const strideKm = type === 'running' ? 0.00095 : 0.00075;
  return Number((steps * strideKm).toFixed(2));
}

export function calculatePace(durationSeconds: number, distanceKm: number): string | null {
  if (distanceKm <= 0.05 || durationSeconds <= 0) return null;
  const secondsPerKm = durationSeconds / distanceKm;
  const mins = Math.floor(secondsPerKm / 60);
  const secs = Math.floor(secondsPerKm % 60);
  if (mins > 59) return null; // Avoid unrealistic pace displays
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

export function calculateSpeed(durationSeconds: number, distanceKm: number): number | null {
  if (durationSeconds <= 0 || distanceKm <= 0) return null;
  const hours = durationSeconds / 3600;
  const kmh = distanceKm / hours;
  return Number(kmh.toFixed(1));
}

export function estimateCalories(
  type: ActivityType,
  durationSeconds: number,
  distanceKm: number,
  steps: number,
  jumpCount: number
): number {
  const durationHours = durationSeconds / 3600;

  switch (type) {
    case 'walking': {
      // ~0.04 kcal per step or ~50 kcal per km
      if (steps > 0) return Math.round(steps * 0.04);
      if (distanceKm > 0) return Math.round(distanceKm * 55);
      return Math.round(durationHours * 200);
    }
    case 'running': {
      // ~65 kcal per km or ~600 kcal per hour
      if (distanceKm > 0) return Math.round(distanceKm * 65);
      return Math.round(durationHours * 600);
    }
    case 'cycling': {
      // ~30 kcal per km or ~450 kcal per hour
      if (distanceKm > 0) return Math.round(distanceKm * 30);
      return Math.round(durationHours * 450);
    }
    case 'jump_rope': {
      // ~0.15 kcal per jump or ~700 kcal per hour
      if (jumpCount > 0) return Math.round(jumpCount * 0.15);
      return Math.round(durationHours * 650);
    }
    case 'gym':
      return Math.round(durationHours * 350);
    case 'yoga':
      return Math.round(durationHours * 180);
    case 'swimming':
      return Math.round(durationHours * 500);
    case 'hiking':
      if (distanceKm > 0) return Math.round(distanceKm * 70);
      return Math.round(durationHours * 400);
    case 'other':
    default:
      return Math.round(durationHours * 250);
  }
}
