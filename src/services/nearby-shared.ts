/**
 * Helpers shared by the local and remote Near Me services.
 */
import { Coordinates } from '@/types/nearby';

const AVATAR_COLORS = ['#C5F36B', '#5279F6', '#E8A34A', '#E56C67', '#9B51E0'];

// MaterialCommunityIcons names, see https://oblador.github.io/react-native-vector-icons/
const ACTIVITY_ICON: Record<string, string> = {
  walking: 'walk',
  running: 'run',
  cycling: 'bike',
  jump_rope: 'jump-rope',
  gym: 'dumbbell',
  yoga: 'yoga',
  swimming: 'swim',
  hiking: 'hiking',
  other: 'star-four-points',
};

export function avatarFor(
  index: number,
  activityType: string | null
): { color: string; icon: { name: string; type: 'ion' | 'mci' } } {
  const name = (activityType && ACTIVITY_ICON[activityType]) || 'account';
  return {
    color: AVATAR_COLORS[index % AVATAR_COLORS.length],
    icon: { name, type: 'mci' },
  };
}

export function distanceKm(a: Coordinates, b: Coordinates): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * Math.sin(dLon / 2) ** 2;
  return Number((2 * 6371 * Math.asin(Math.sqrt(h))).toFixed(2));
}

export function minutesSince(iso: string): number {
  return Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
}

export function remainingDays(endIso: string): number {
  const diff = new Date(endIso).getTime() - Date.now();
  return diff <= 0 ? 0 : Math.ceil(diff / 86400000);
}

export function formatPeerGoal(goal: number, measurement: string): string {
  if (measurement === 'steps') return `${Math.round(goal).toLocaleString()} steps`;
  return `${Number(goal.toFixed(1))} km`;
}

/** "4.2 km · 35m ago" style line for a card. */
export function formatLastSeen(minutes: number): string {
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const h = Math.floor(minutes / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}
