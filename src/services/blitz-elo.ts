/**
 * src/services/blitz-elo.ts
 * ─────────────────────────────────────────────────────────────────
 * Blitz rating, stored on the device.
 *
 * Elo lives locally rather than in Postgres because no migration has
 * added a column for it yet. Everything here is per device and per
 * signed-in user, so it survives app restarts but does not follow the
 * account to another phone. Move it to a `blitz_rating` column when
 * there is a migration to spare.
 * ─────────────────────────────────────────────────────────────────
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

/** Everyone starts level. 1500 is the usual Elo anchor. */
export const STARTING_ELO = 1500;

/** Largest swing one bout can cause, in either direction. */
const K_FACTOR = 24;

export interface BlitzRating {
  elo: number;
  bouts: number;
  wins: number;
  losses: number;
  draws: number;
  /** Highest Elo ever reached, so a bad run does not erase it. */
  peakElo: number;
}

export const EMPTY_RATING: BlitzRating = {
  elo: STARTING_ELO,
  bouts: 0,
  wins: 0,
  losses: 0,
  draws: 0,
  peakElo: STARTING_ELO,
};

function keyFor(userId: string | undefined): string {
  return `muvibe:blitz-rating:${userId ?? 'local'}`;
}

/**
 * Standard Elo. A win over a stronger rival moves the rating more than
 * a win over a weaker one, and the swing is capped by K_FACTOR.
 */
export function eloDelta(
  playerElo: number,
  opponentElo: number,
  won: boolean,
  drawn: boolean
): number {
  const expected = 1 / (1 + 10 ** ((opponentElo - playerElo) / 400));
  const actual = drawn ? 0.5 : won ? 1 : 0;
  return Math.round(K_FACTOR * (actual - expected));
}

/** Reads the stored rating, or a fresh one when nothing is saved yet. */
export async function getRating(userId?: string): Promise<BlitzRating> {
  try {
    const raw = await AsyncStorage.getItem(keyFor(userId));
    if (!raw) return { ...EMPTY_RATING };
    const parsed = JSON.parse(raw) as Partial<BlitzRating>;
    // Merge over the defaults so an older saved shape still loads.
    return { ...EMPTY_RATING, ...parsed };
  } catch {
    return { ...EMPTY_RATING };
  }
}

/** Applies one bout result and saves. Returns the rating afterwards. */
export async function recordBout(
  userId: string | undefined,
  opponentElo: number,
  won: boolean,
  drawn: boolean
): Promise<{ rating: BlitzRating; delta: number }> {
  const current = await getRating(userId);
  const delta = eloDelta(current.elo, opponentElo, won, drawn);
  const elo = Math.max(100, current.elo + delta);

  const next: BlitzRating = {
    elo,
    bouts: current.bouts + 1,
    wins: current.wins + (won && !drawn ? 1 : 0),
    losses: current.losses + (!won && !drawn ? 1 : 0),
    draws: current.draws + (drawn ? 1 : 0),
    peakElo: Math.max(current.peakElo, elo),
  };

  try {
    await AsyncStorage.setItem(keyFor(userId), JSON.stringify(next));
  } catch {
    // A failed write only costs this bout's history, so the result
    // the player just saw still stands.
  }
  return { rating: next, delta };
}

/** Bracket name for a rating. Used on the profile card. */
export function eloBracket(elo: number): { name: string; next: number | null } {
  if (elo < 1300) return { name: 'Rookie', next: 1300 };
  if (elo < 1450) return { name: 'Contender', next: 1450 };
  if (elo < 1600) return { name: 'Challenger', next: 1600 };
  if (elo < 1750) return { name: 'Elite', next: 1750 };
  return { name: 'Campus Apex', next: null };
}
