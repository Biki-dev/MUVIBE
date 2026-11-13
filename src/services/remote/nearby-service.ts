/**
 * src/services/remote/nearby-service.ts
 * ─────────────────────────────────────────────────────────────────
 * Near Me, backed by Supabase (signed-in users).
 * Requires supabase/migrations/004_nearby_presence.sql.
 *
 * Nearby lookup pulls visible presence rows inside a bounding box and
 * finishes the distance filter client-side; fine at campus scale.
 * ─────────────────────────────────────────────────────────────────
 */
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { ActivityType } from '@/types/activity';
import {
  Coordinates,
  MyPresence,
  NearbyStudent,
  NewPeerChallenge,
  PeerChallenge,
  PeerChallengeStatus,
} from '@/types/nearby';
import {
  avatarFor,
  distanceKm,
  formatPeerGoal,
  minutesSince,
  remainingDays,
} from '@/services/nearby-shared';

const listeners = new Set<() => void>();
function ping() {
  listeners.forEach((fn) => fn());
}

async function me(): Promise<string | null> {
  if (!isSupabaseConfigured) return null;
  const { data } = await supabase.auth.getSession();
  return data.session?.user.id ?? null;
}

/* ── presence ──────────────────────────────────────────────────── */

export async function getMyPresence(): Promise<MyPresence> {
  const userId = await me();
  if (!userId) return { visible: false, statusText: null, coords: null, updatedAt: null };

  const { data } = await supabase.from('user_presence').select('*').eq('user_id', userId).maybeSingle();
  if (!data) return { visible: false, statusText: null, coords: null, updatedAt: null };
  return {
    visible: Boolean(data.visible),
    statusText: data.status_text ?? null,
    coords: { latitude: Number(data.latitude), longitude: Number(data.longitude) },
    updatedAt: data.updated_at,
  };
}

export async function setMyPresence(
  coords: Coordinates,
  statusText: string | null,
  lastActivityType: ActivityType | null
): Promise<void> {
  const userId = await me();
  if (!userId) return;
  await supabase.from('user_presence').upsert({
    user_id: userId,
    latitude: coords.latitude,
    longitude: coords.longitude,
    visible: true,
    status_text: statusText,
    last_activity_type: lastActivityType,
    updated_at: new Date().toISOString(),
  });
  ping();
}

export async function clearMyPresence(): Promise<void> {
  const userId = await me();
  if (!userId) return;
  await supabase.from('user_presence').delete().eq('user_id', userId);
  ping();
}

/* ── nearby list ───────────────────────────────────────────────── */

export async function fetchNearby(origin: Coordinates, radiusKm: number): Promise<NearbyStudent[]> {
  const userId = await me();
  if (!userId) return [];

  // ~1 degree latitude is 111 km; longitude shrinks with latitude.
  const dLat = radiusKm / 111;
  const dLon = radiusKm / (111 * Math.cos((origin.latitude * Math.PI) / 180));

  const { data: presence } = await supabase
    .from('user_presence')
    .select('user_id, latitude, longitude, status_text, updated_at, last_activity_type')
    .eq('visible', true)
    .neq('user_id', userId)
    .gte('latitude', origin.latitude - dLat)
    .lte('latitude', origin.latitude + dLat)
    .gte('longitude', origin.longitude - dLon)
    .lte('longitude', origin.longitude + dLon);

  if (!presence || presence.length === 0) return [];

  const ids = presence.map((p) => p.user_id);
  const [{ data: profiles }, { data: challenges }] = await Promise.all([
    supabase.from('nearby_profiles').select('*').in('id', ids),
    supabase
      .from('peer_challenges')
      .select('id, challenger_id, challengee_id, status')
      .in('status', ['pending', 'accepted'])
      .or(`challenger_id.eq.${userId},challengee_id.eq.${userId}`),
  ]);

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));
  const openWith = new Map<string, string>();
  (challenges ?? []).forEach((c) => {
    const other = c.challenger_id === userId ? c.challengee_id : c.challenger_id;
    if (!openWith.has(other)) openWith.set(other, c.id);
  });

  return presence
    .map((p, idx): NearbyStudent => {
      const prof = profileMap.get(p.user_id);
      const avatar = avatarFor(idx, p.last_activity_type);
      return {
        id: p.user_id,
        name: prof?.full_name || 'Student',
        username: prof?.username || 'student',
        department: prof?.department || '',
        academicYear: prof?.academic_year || '',
        avatarColor: avatar.color,
        avatarIcon: avatar.icon,
        distanceKm: distanceKm(origin, { latitude: Number(p.latitude), longitude: Number(p.longitude) }),
        statusText: p.status_text ?? null,
        // Other users' raw activity rows are not readable under RLS; the
        // presence row carries the last activity type instead.
        lastActivity: p.last_activity_type
          ? { type: p.last_activity_type as ActivityType, distanceKm: null, steps: null, durationSeconds: 0, endedAt: p.updated_at }
          : null,
        lastSeenMinutes: minutesSince(p.updated_at),
        isDemo: false,
        openChallengeId: openWith.get(p.user_id) ?? null,
      };
    })
    .filter((s) => s.distanceKm <= radiusKm)
    .sort((a, b) => a.distanceKm - b.distanceKm);
}

/* ── peer challenges ───────────────────────────────────────────── */

export async function sendPeerChallenge(input: NewPeerChallenge): Promise<boolean> {
  const userId = await me();
  if (!userId || input.opponentId === userId) return false;
  const { error } = await supabase.from('peer_challenges').insert({
    challenger_id: userId,
    challengee_id: input.opponentId,
    measurement: input.measurement,
    goal: input.goal,
    duration_days: input.durationDays,
  });
  if (error) {
    console.warn('[nearby] sendPeerChallenge failed:', error.message);
    return false;
  }
  ping();
  return true;
}

export async function respondPeerChallenge(
  challengeId: string,
  response: 'accepted' | 'declined' | 'cancelled'
): Promise<boolean> {
  const userId = await me();
  if (!userId) return false;

  const { data: row } = await supabase
    .from('peer_challenges')
    .select('challenger_id, challengee_id, duration_days, status')
    .eq('id', challengeId)
    .maybeSingle();
  if (!row || row.status !== 'pending') return false;
  if (response === 'cancelled' && row.challenger_id !== userId) return false;
  if (response !== 'cancelled' && row.challengee_id !== userId) return false;

  const patch: Record<string, unknown> = { status: response };
  if (response === 'accepted') {
    const starts = new Date();
    patch.starts_at = starts.toISOString();
    patch.ends_at = new Date(starts.getTime() + row.duration_days * 86400000).toISOString();
  }
  const { error } = await supabase.from('peer_challenges').update(patch).eq('id', challengeId);
  if (error) return false;
  ping();
  return true;
}

export async function fetchMyPeerChallenges(): Promise<PeerChallenge[]> {
  const userId = await me();
  if (!userId) return [];

  const { data: rows } = await supabase
    .from('peer_challenges')
    .select('*')
    .or(`challenger_id.eq.${userId},challengee_id.eq.${userId}`)
    .order('created_at', { ascending: false });
  if (!rows || rows.length === 0) return [];

  const oppIds = Array.from(new Set(rows.map((r) => (r.challenger_id === userId ? r.challengee_id : r.challenger_id))));
  const { data: profiles } = await supabase.from('nearby_profiles').select('*').in('id', oppIds);
  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

  const result: PeerChallenge[] = [];
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const isMine = r.challenger_id === userId;
    const oppId = isMine ? r.challengee_id : r.challenger_id;
    const prof = profileMap.get(oppId);
    const avatar = avatarFor(i, null);
    let status = r.status as PeerChallengeStatus;
    let myProgress = 0;
    let opponentProgress = 0;

    if (status === 'accepted' || status === 'completed') {
      const { data: prog } = await supabase.rpc('peer_challenge_progress', { challenge_id: r.id });
      (prog ?? []).forEach((p: { user_id: string; progress: number }) => {
        if (p.user_id === userId) myProgress = Number(p.progress);
        else opponentProgress = Number(p.progress);
      });
      if (status === 'accepted' && r.ends_at && new Date(r.ends_at) < new Date()) {
        status = 'completed';
        await supabase.from('peer_challenges').update({ status }).eq('id', r.id);
      }
    }

    result.push({
      id: r.id,
      challengerId: r.challenger_id,
      challengeeId: r.challengee_id,
      opponent: {
        id: oppId,
        name: prof?.full_name || 'Student',
        username: prof?.username || 'student',
        avatarColor: avatar.color,
        avatarIcon: avatar.icon,
      },
      isMine,
      measurement: r.measurement,
      goal: Number(r.goal),
      goalFormatted: formatPeerGoal(Number(r.goal), r.measurement),
      durationDays: r.duration_days,
      status,
      createdAt: r.created_at,
      startsAt: r.starts_at,
      endsAt: r.ends_at,
      remainingDays: r.ends_at ? remainingDays(r.ends_at) : r.duration_days,
      myProgress,
      opponentProgress,
    });
  }
  return result;
}

export function subscribeToNearby(onUpdate: () => void): () => void {
  if (!isSupabaseConfigured) return () => {};
  listeners.add(onUpdate);
  const id = `nearby_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const channel = supabase
    .channel(id)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'user_presence' }, onUpdate)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'peer_challenges' }, onUpdate)
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
