/**
 * src/lib/cache-store.web.ts
 * ─────────────────────────────────────────────────────────────────
 * Web counterpart of cache-store.ts.
 *
 * expo-file-system's File/Paths API is native only, so the browser keeps
 * the same JSON string in localStorage instead. Same contents, same key
 * structure, different shelf.
 *
 * Every call is guarded: localStorage throws in private mode and when
 * site data is blocked, and a missing cache must never break a render.
 * ─────────────────────────────────────────────────────────────────
 */
const STORAGE_KEY = 'muvibe-cache.json';

export function readRaw(): string | null {
  try {
    if (typeof localStorage === 'undefined') return null;
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    // Private mode or blocked site data. Behaving as "no cache" is correct.
    return null;
  }
}

export async function writeRaw(contents: string): Promise<void> {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(STORAGE_KEY, contents);
  } catch {
    // Quota or blocked storage. The snapshot is a convenience, not a need.
  }
}

export async function deleteRaw(): Promise<void> {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

export const STORE_KIND = 'localStorage';
