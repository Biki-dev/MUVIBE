/**
 * Community highlights, from Supabase, with a read-only offline snapshot.
 */
import { withSnapshot } from '@/lib/offline-cache';
import * as remote from './remote/highlights-service';
import { CommunityHighlight } from '@/types/highlights';

export function fetchCommunityHighlights(limit?: number): Promise<CommunityHighlight[]> {
  return withSnapshot('highlights', () => remote.fetchCommunityHighlights(limit));
}

export function subscribeToHighlights(onUpdate: () => void): () => void {
  return remote.subscribeToHighlights(onUpdate);
}
