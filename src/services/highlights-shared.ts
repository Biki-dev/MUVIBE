import { Palette } from '@/constants/theme';
import { CommunityHighlight } from '@/types/highlights';

export interface RawActivity {
  id: string;
  userId: string;
  name: string | null;
  username: string | null;
  type: string;
  distanceKm: number | null;
  steps: number | null;
  calories: number | null;
  durationSeconds: number | null;
  endedAt: string;
}

const ACCENTS = [Palette.forest, Palette.amber, Palette.electricBlue, Palette.coral];

/**
 * Picks the one number worth showing for an activity, in order of what
 * actually says something: distance, then steps, then calories, then time.
 * Icons are Lucide, see components/ui/icon-registry.ts.
 */
export function highlightFromActivity(
  a: RawActivity,
  index: number,
  isMe: boolean
): CommunityHighlight {
  let metric: string;
  let icon: string;

  if (a.distanceKm && a.distanceKm > 0) {
    metric = `${a.distanceKm.toFixed(1)} km`;
    icon = 'navigation';
  } else if (a.steps && a.steps > 0) {
    metric = `${a.steps.toLocaleString()} steps`;
    icon = 'footprints';
  } else if (a.calories && a.calories > 0) {
    metric = `${a.calories} kcal`;
    icon = 'flame';
  } else {
    metric = `${Math.max(1, Math.round((a.durationSeconds ?? 0) / 60))} min`;
    icon = 'timer';
  }

  const name = isMe ? 'You' : a.name?.split(' ')[0] || a.username || 'Student';

  return {
    id: a.id,
    userId: a.userId,
    name,
    initial: (name === 'You' ? 'Y' : name[0] || '?').toUpperCase(),
    metric,
    icon,
    accentColor: ACCENTS[index % ACCENTS.length],
    isMe,
  };
}
