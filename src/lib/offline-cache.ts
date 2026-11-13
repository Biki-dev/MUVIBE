/**
 * src/lib/offline-cache.ts
 * ─────────────────────────────────────────────────────────────────
 * Read-only offline snapshot.
 *
 * Supabase is the only source of truth. After every successful fetch the
 * result is written to a JSON file on the device, and if a later fetch
 * fails, the last good copy is served instead so the screens still have
 * something to show.
 *
 * This is a cache, not a database. Nothing is ever written here by the
 * user, nothing syncs back, and anything served from it is flagged stale
 * so the UI can say so.
 *
 * One file, muvibe-cache.json, namespaced by key. Small enough that a
 * whole-file rewrite is cheaper than juggling many files.
 * ─────────────────────────────────────────────────────────────────
 */
import { readRaw, writeRaw, deleteRaw } from './cache-store';

/** Bump to invalidate every entry after a shape change. */
const CACHE_VERSION = 1;

export type CacheKey =
  | 'activities'
  | 'challenges'
  | 'clubs'
  | 'highlights'
  | 'leaderboard.individual'
  | 'leaderboard.guild'
  | 'nearby'
  | 'peer-challenges'
  | 'profile'
  | 'squads'
  | 'squad-quests';

interface Entry<T = unknown> {
  value: T;
  savedAt: string;
}

interface CacheFile {
  version: number;
  entries: Record<string, Entry>;
}

const EMPTY: CacheFile = { version: CACHE_VERSION, entries: {} };

/**
 * Held in memory so reads during a render are instant and so a burst of
 * writes does not hit the disk once per call.
 */
let memory: CacheFile | null = null;
let writeTimer: ReturnType<typeof setTimeout> | null = null;
let writing = false;

function load(): CacheFile {
  if (memory) return memory;

  try {
    const raw = readRaw();
    if (!raw) {
      memory = { ...EMPTY, entries: {} };
      return memory;
    }
    const parsed = JSON.parse(raw) as CacheFile;
    memory =
      parsed && parsed.version === CACHE_VERSION && parsed.entries
        ? parsed
        : { ...EMPTY, entries: {} };
  } catch (error) {
    console.warn('[cache] could not read snapshot, starting empty:', error);
    memory = { ...EMPTY, entries: {} };
  }
  return memory;
}

/** Coalesces writes: several fetches landing together cost one disk write. */
function scheduleFlush(): void {
  if (writeTimer) return;
  writeTimer = setTimeout(() => {
    writeTimer = null;
    flush();
  }, 400);
}

async function flush(): Promise<void> {
  if (writing || !memory) return;
  writing = true;
  try {
    await writeRaw(JSON.stringify(memory));
  } catch (error) {
    console.warn('[cache] could not write snapshot:', error);
  } finally {
    writing = false;
  }
}

export function readSnapshot<T>(key: CacheKey): { value: T; savedAt: string } | null {
  const entry = load().entries[key];
  if (!entry) return null;
  return { value: entry.value as T, savedAt: entry.savedAt };
}

export function writeSnapshot<T>(key: CacheKey, value: T): void {
  const file = load();
  file.entries[key] = { value, savedAt: new Date().toISOString() };
  scheduleFlush();
}

export async function clearSnapshot(): Promise<void> {
  memory = { ...EMPTY, entries: {} };
  await deleteRaw();
}

/** What the UI shows in a "last updated" line. */
export interface Freshness {
  isStale: boolean;
  savedAt: string | null;
}

let lastFreshness: Freshness = { isStale: false, savedAt: null };

export function getFreshness(): Freshness {
  return lastFreshness;
}

/**
 * Fetch from Supabase, falling back to the snapshot.
 *
 * `isEmpty` decides whether a successful-but-empty response should still
 * overwrite a good snapshot. Without it, one request returning [] during a
 * flaky moment would wipe the offline copy.
 */
export async function withSnapshot<T>(
  key: CacheKey,
  fetcher: () => Promise<T>,
  options: { isEmpty?: (value: T) => boolean } = {}
): Promise<T> {
  const isEmpty = options.isEmpty ?? ((v: T) => Array.isArray(v) && v.length === 0);

  try {
    const fresh = await fetcher();
    const cached = readSnapshot<T>(key);

    if (isEmpty(fresh) && cached) {
      // Keep the better copy rather than replacing it with nothing.
      lastFreshness = { isStale: true, savedAt: cached.savedAt };
      return cached.value;
    }

    writeSnapshot(key, fresh);
    lastFreshness = { isStale: false, savedAt: new Date().toISOString() };
    return fresh;
  } catch (error) {
    const cached = readSnapshot<T>(key);
    if (cached) {
      console.warn(`[cache] serving "${key}" from the offline snapshot:`, error);
      lastFreshness = { isStale: true, savedAt: cached.savedAt };
      return cached.value;
    }
    lastFreshness = { isStale: true, savedAt: null };
    throw error;
  }
}

/** Human readable age for a stale banner. */
export function describeAge(savedAt: string | null): string {
  if (!savedAt) return 'never synced';
  const mins = Math.round((Date.now() - new Date(savedAt).getTime()) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}
