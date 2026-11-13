/**
 * src/services/remote/highlights-service.ts
 * ─────────────────────────────────────────────────────────────────
 * Community highlights from Supabase.
 *
 * RLS keeps other people's activity rows private, so the strip mixes
 * your own recent activities with the last activity type of people who
 * have made themselves visible in Near Me.
 * ─────────────────────────────────────────────────────────────────
 */
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { CommunityHighlight } from '@/types/highlights';
import { highlightFromActivity } from '@/services/highlights-shared';
import { Palette } from '@/constants/theme';

const listeners = new Set<() => void>();

export async function fetchCommunityHighlights(limit = 12): Promise<CommunityHighlight[]> {
  if (!isSupabaseConfigured) return [];

  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const me = sessionData.session?.user.id;
    if (!me) return [];

    const [{ data: mine }, { data: presence }] = await Promise.all([
      supabase
        .from('activities')
        .select('id, user_id, type, distance_km, steps, calories, duration_seconds, ended_at')
        .eq('user_id', me)
        .order('ended_at', { ascending: false })
        .limit(Math.ceil(limit / 2)),
      supabase
        .from('user_presence')
        .select('user_id, last_activity_type, updated_at')
        .eq('visible', true)
        .neq('user_id', me)
        .order('updated_at', { ascending: false })
        .limit(Math.floor(limit / 2)),
    ]);

    const out: CommunityHighlight[] = (mine ?? []).map((a, i) =>
      highlightFromActivity(
        {
          id: a.id,
          userId: a.user_id,
          name: null,
          username: null,
          type: a.type,
          distanceKm: a.distance_km,
          steps: a.steps,
          calories: a.calories,
          durationSeconds: a.duration_seconds,
          endedAt: a.ended_at,
        },
        i,
        true
      )
    );

    const otherIds = (presence ?? []).map((p) => p.user_id);
    if (otherIds.length > 0) {
      const { data: profiles } = await supabase
        .from('nearby_profiles')
        .select('id, full_name, username')
        .in('id', otherIds);
      const byId = new Map((profiles ?? []).map((p) => [p.id, p]));

      (presence ?? []).forEach((p, i) => {
        const prof = byId.get(p.user_id);
        const name = prof?.full_name?.split(' ')[0] || prof?.username || 'Student';
        out.push({
          id: `presence_${p.user_id}`,
          userId: p.user_id,
          name,
          initial: (name[0] || '?').toUpperCase(),
          metric: p.last_activity_type ? `was ${p.last_activity_type}` : 'nearby',
          icon: 'map-pin',
          accentColor: Palette.electricBlue,
          isMe: false,
        });
      });
    }

    return out.slice(0, limit);
  } catch (error) {
    console.error('[highlights] fetchCommunityHighlights failed:', error);
    return [];
  }
}

export function subscribeToHighlights(onUpdate: () => void): () => void {
  if (!isSupabaseConfigured) return () => {};
  listeners.add(onUpdate);
  const channel = supabase
    .channel(`highlights_${Date.now()}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'activities' }, onUpdate)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'user_presence' }, onUpdate)
    .subscribe();
  return () => {
    listeners.delete(onUpdate);
    try {
      supabase.removeChannel(channel);
    } catch {
      // non-fatal
    }
  };
}
