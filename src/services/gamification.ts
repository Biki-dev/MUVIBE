/**
 * src/services/gamification.ts
 * ─────────────────────────────────────────────────────────────────
 * Levels, XP and tiers, derived from the same points the leaderboards
 * use. There is no separate XP currency to drift out of step: XP is
 * lifetime points from services/points-engine.ts.
 *
 * Curve: each level costs BASE + STEP * (level - 1), so the cost grows
 * steadily rather than exponentially. Tuned against a realistic student
 * pace of five sessions a week at roughly 35 points each (~175/week):
 *
 *   Bronze  level 5    214 XP   about 1 week
 *   Silver  level 12   935 XP   about 5 weeks
 *   Gold    level 22  2730 XP   about one semester
 *   Apex    level 35  6409 XP   about a full academic year
 *
 * An exponential curve was tried first and put Apex at roughly 600 weeks,
 * which is not a goal, it is an insult. Keep the top rank reachable by a
 * dedicated student inside one year.
 * ─────────────────────────────────────────────────────────────────
 */
import { Tier, TIERS, TierKey } from '@/constants/theme';
import { ScorableActivity, totalPoints } from '@/services/points-engine';

const BASE = 40;
const STEP = 9;
const MAX_LEVEL = 60;

/** XP needed to go from `level` to `level + 1`. */
export function xpForLevel(level: number): number {
  return BASE + STEP * (Math.max(1, level) - 1);
}

/** Cumulative XP needed to reach `level`. Level 1 starts at 0. */
export function xpToReach(level: number): number {
  let total = 0;
  for (let l = 1; l < level; l++) total += xpForLevel(l);
  return total;
}

export interface Progression {
  level: number;
  tier: Tier;
  /** Lifetime XP. */
  xp: number;
  /** XP earned inside the current level. */
  xpIntoLevel: number;
  /** XP the current level costs in total. */
  xpForThisLevel: number;
  /** 0 to 1. */
  progress: number;
  /** Null once at MAX_LEVEL. */
  nextTier: Tier | null;
  levelsToNextTier: number;
}

export function tierForLevel(level: number): Tier {
  let current = TIERS[0];
  for (const t of TIERS) if (level >= t.minLevel) current = t;
  return current;
}

export function nextTierAfter(level: number): Tier | null {
  return TIERS.find((t) => t.minLevel > level) ?? null;
}

export function progressionFromXp(xp: number): Progression {
  const safeXp = Math.max(0, Math.round(xp));

  let level = 1;
  let consumed = 0;
  while (level < MAX_LEVEL && consumed + xpForLevel(level) <= safeXp) {
    consumed += xpForLevel(level);
    level++;
  }

  const xpForThisLevel = xpForLevel(level);
  const xpIntoLevel = safeXp - consumed;
  const next = nextTierAfter(level);

  return {
    level,
    tier: tierForLevel(level),
    xp: safeXp,
    xpIntoLevel,
    xpForThisLevel,
    progress: level >= MAX_LEVEL ? 1 : Math.min(1, xpIntoLevel / xpForThisLevel),
    nextTier: next,
    levelsToNextTier: next ? next.minLevel - level : 0,
  };
}

/** Convenience: progression straight from a student's activity history. */
export function progressionFromActivities(activities: ScorableActivity[]): Progression {
  return progressionFromXp(totalPoints(activities));
}

/** Short line under a rank badge, e.g. "8 levels to Silver". */
export function tierHint(p: Progression): string {
  if (!p.nextTier) return 'Top tier reached';
  const n = p.levelsToNextTier;
  return `${n} ${n === 1 ? 'level' : 'levels'} to ${p.nextTier.label}`;
}

export type { Tier, TierKey };
