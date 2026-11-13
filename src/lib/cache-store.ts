/**
 * src/lib/cache-store.ts
 * ─────────────────────────────────────────────────────────────────
 * Where the offline snapshot physically lives, on native.
 *
 * A real JSON file in the app's document directory. The web build uses
 * cache-store.web.ts instead, because expo-file-system's File/Paths API
 * has no web implementation: calling it there throws
 * "this.validatePath is not a function".
 * ─────────────────────────────────────────────────────────────────
 */
import { File, Paths } from 'expo-file-system';

const FILE_NAME = 'muvibe-cache.json';

function handle(): File {
  return new File(Paths.document, FILE_NAME);
}

export function readRaw(): string | null {
  try {
    const file = handle();
    if (!file.exists) return null;
    return file.textSync();
  } catch (error) {
    console.warn('[cache] read failed:', error);
    return null;
  }
}

export async function writeRaw(contents: string): Promise<void> {
  try {
    const file = handle();
    if (!file.exists) file.create();
    await file.write(contents);
  } catch (error) {
    console.warn('[cache] write failed:', error);
  }
}

export async function deleteRaw(): Promise<void> {
  try {
    const file = handle();
    if (file.exists) file.delete();
  } catch (error) {
    console.warn('[cache] delete failed:', error);
  }
}

/** Shown in diagnostics so it is obvious which backing store is in use. */
export const STORE_KIND = 'file';
