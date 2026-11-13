/**
 * src/services/challenge-service.ts
 * ─────────────────────────────────────────────────────────────────
 * Supabase-backed Challenges & Real-time Progress Tracking Service.
 *
 * Requirements handled:
 * 1. Fetch challenge definitions from Supabase.
 * 2. Real participant count from challenge_participants table.
 * 3. All challenges measured strictly in 'steps' or 'distance_km'.
 * 4. Tracking judges:
 *    a) Is user joined?
 *    b) Has event started as of its start_date? (now >= start_date)
 * 5. Dynamic progress calculation from user's completed activities
 *    during the challenge active window.
 * 6. Completion & Reward awarding:
 *    When progress >= goal, marks challenge completed in DB
 *    and increments user's reward_points in public.users.
 * 7. Real-time subscription on challenge_participants and challenges.
 * ─────────────────────────────────────────────────────────────────
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { Challenge, ChallengeMeasurement, ChallengeStatus, ParticipantPreview } from '@/types/challenge';
import { INITIAL_CHALLENGES } from '@/constants/challenge-data';
import { getAllActivities } from '@/services/activity-storage';

const CACHE_KEY = '@muvibe_challenges_cache_v2';
const LOCAL_JOINED_KEY = '@muvibe_local_joined_challenges_v2';

// ── Helpers ───────────────────────────────────────────────────────
function calculateRemainingDays(endDateStr: string): number {
  const diff = new Date(endDateStr).getTime() - Date.now();
  if (diff <= 0) return 0;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function formatGoal(goal: number, unit: string): string {
  if (unit === 'steps') {
    return `${Math.round(goal).toLocaleString()} steps`;
  }
  return `${Number(goal.toFixed(1))} km`;
}

// ── AsyncStorage Cache ─────────────────────────────────────────────
async function readLocalCache(): Promise<Challenge[]> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    if (!raw) return INITIAL_CHALLENGES;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_CHALLENGES;
  } catch {
    return INITIAL_CHALLENGES;
  }
}

async function writeLocalCache(challenges: Challenge[]): Promise<void> {
  try {
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(challenges));
  } catch {
    // non-fatal
  }
}

// ── Award Points to User ──────────────────────────────────────────
async function awardPointsToUser(userId: string, points: number): Promise<void> {
  if (!points || points <= 0 || !isSupabaseConfigured) return;
  try {
    const { data: userRow } = await supabase
      .from('users')
      .select('reward_points')
      .eq('id', userId)
      .maybeSingle();

    const currentPoints = Number(userRow?.reward_points ?? 0);
    const newPoints = currentPoints + points;

    await supabase
      .from('users')
      .update({ reward_points: newPoints })
      .eq('id', userId);
  } catch (err) {
    console.warn('[challenge-service] awardPoints error:', err);
  }
}

// ── Public API: Fetch All Challenges ──────────────────────────────
export async function fetchAllChallenges(userId?: string): Promise<Challenge[]> {
  const now = new Date();

  // If Supabase not configured or no connection, use local cache
  if (!isSupabaseConfigured) {
    const local = await readLocalCache();
    return local.map((c) => {
      const isStarted = new Date(c.startDate) <= now;
      const remainingDays = calculateRemainingDays(c.endDate);
      return { ...c, isStarted, remainingDays };
    });
  }

  try {
    // 1. Fetch challenge definitions from Supabase
    const { data: dbChallenges, error: chErr } = await supabase
      .from('challenges')
      .select('*')
      .order('featured', { ascending: false });

    if (chErr || !dbChallenges || dbChallenges.length === 0) {
      console.warn('[challenge-service] fetch challenges fallback:', chErr?.message);
      return await readLocalCache();
    }

    // 2. Fetch all participants to count real participants per challenge
    const { data: allParticipants } = await supabase
      .from('challenge_participants')
      .select('challenge_id, user_id, status, progress, completed_at');

    // 3. Fetch user info for participants preview (avatars, names)
    const { data: participantUsers } = await supabase
      .from('users')
      .select('id, full_name, username, avatar_url');

    const usersMap = new Map<string, { name: string; username: string }>();
    (participantUsers || []).forEach((u) => {
      usersMap.set(u.id, {
        name: u.full_name || 'Student Athlete',
        username: u.username || 'student',
      });
    });

    // 4. Fetch logged-in user activities to calculate progress
    const activities = await getAllActivities();

    // Group participants by challenge_id
    const participantsByChallenge = new Map<string, any[]>();
    (allParticipants || []).forEach((p) => {
      const list = participantsByChallenge.get(p.challenge_id) || [];
      list.push(p);
      participantsByChallenge.set(p.challenge_id, list);
    });

    // 5. Build unified Challenge objects
    const result: Challenge[] = [];

    for (const row of dbChallenges) {
      const participants = participantsByChallenge.get(row.id) || [];
      const participantsCount = participants.length;

      const userRecord = userId
        ? participants.find((p) => p.user_id === userId)
        : null;

      const isJoined = !!userRecord;
      const isStarted = new Date(row.start_date) <= now;
      const remainingDays = calculateRemainingDays(row.end_date);
      const measurement: ChallengeMeasurement =
        row.measurement === 'distance_km' ? 'distance_km' : 'steps';

      let status: ChallengeStatus = 'not_joined';
      let progress = 0;
      let completedDate: string | undefined = undefined;

      if (isJoined) {
        if (userRecord.status === 'completed') {
          status = 'completed';
          progress = Number(row.goal);
          completedDate = userRecord.completed_at
            ? new Date(userRecord.completed_at).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
              })
            : 'Completed';
        } else if (isStarted) {
          // Calculate progress from activities logged between start_date and end_date
          const startMs = new Date(row.start_date).getTime();
          const endMs = new Date(row.end_date).getTime();

          const qualifyingActivities = activities.filter((act) => {
            const actMs = new Date(act.startedAt).getTime();
            return actMs >= startMs && actMs <= endMs;
          });

          if (measurement === 'steps') {
            progress = qualifyingActivities.reduce(
              (sum, a) => sum + (a.steps || 0),
              0
            );
          } else {
            const totalKm = qualifyingActivities.reduce(
              (sum, a) => sum + (a.distanceKm || 0),
              0
            );
            progress = Number(totalKm.toFixed(1));
          }

          // Check for completion
          if (progress >= Number(row.goal)) {
            status = 'completed';
            progress = Number(row.goal);
            completedDate = 'Completed today';

            // Mark completed in Supabase and award reward points
            if (userId) {
              const nowIso = new Date().toISOString();
              supabase
                .from('challenge_participants')
                .update({
                  status: 'completed',
                  progress: Number(row.goal),
                  completed_at: nowIso,
                })
                .eq('challenge_id', row.id)
                .eq('user_id', userId)
                .then(() => {
                  awardPointsToUser(userId, Number(row.reward_points || 0));
                });
            }
          } else {
            status = 'active';
            // Update progress in DB if changed
            if (userId && Number(userRecord.progress) !== progress) {
              supabase
                .from('challenge_participants')
                .update({ progress })
                .eq('challenge_id', row.id)
                .eq('user_id', userId)
                .then();
            }
          }
        } else {
          // Joined, but challenge has not started yet
          status = 'active';
          progress = 0;
        }
      }

      // Generate preview of joined participants
      const participantsPreview: ParticipantPreview[] = participants
        .slice(0, 4)
        .map((p, idx) => {
          const uInfo = usersMap.get(p.user_id) || {
            name: `Participant ${idx + 1}`,
            username: `athlete_${idx + 1}`,
          };
          const colors = ['#C5F36B', '#5279F6', '#E8A34A', '#E56C67'];
          const emojis = ['🏃', '🚴', '🚶', '🤸'];
          return {
            id: p.user_id,
            name: uInfo.name,
            username: uInfo.username,
            avatarColor: colors[idx % colors.length],
            avatarEmoji: emojis[idx % emojis.length],
          };
        });

      const challengeItem: Challenge = {
        id: row.id,
        title: row.title,
        category: row.category,
        difficulty: row.difficulty,
        description: row.description,
        goal: Number(row.goal),
        goalFormatted: formatGoal(Number(row.goal), row.goal_unit),
        goalUnit: row.goal_unit,
        measurement,
        durationDays: Math.ceil(
          (new Date(row.end_date).getTime() - new Date(row.start_date).getTime()) /
            (1000 * 60 * 60 * 24)
        ),
        participantsCount,
        rewardPoints: Number(row.reward_points ?? 0),
        progress,
        status,
        startDate: row.start_date,
        endDate: row.end_date,
        remainingDays,
        isStarted,
        featured: !!row.featured,
        coverGradient: {
          bg: row.cover_bg || '#18352D',
          accent: row.cover_accent || '#C5F36B',
          icon: row.cover_icon || 'flame',
        },
        rules: row.rules || [],
        eligibility: row.eligibility || 'Open to all students across campus.',
        participantsPreview,
        completedDate,
      };

      result.push(challengeItem);
    }

    await writeLocalCache(result);
    return result;
  } catch (err) {
    console.error('[challenge-service] fetchAllChallenges error:', err);
    return await readLocalCache();
  }
}

// ── Public API: Join Challenge ────────────────────────────────────
export async function joinChallengeInDB(
  challengeId: string,
  userId: string
): Promise<boolean> {
  if (!isSupabaseConfigured) {
    // Offline join: save to AsyncStorage
    try {
      const raw = await AsyncStorage.getItem(LOCAL_JOINED_KEY);
      const list = raw ? JSON.parse(raw) : [];
      if (!list.includes(challengeId)) {
        list.push(challengeId);
        await AsyncStorage.setItem(LOCAL_JOINED_KEY, JSON.stringify(list));
      }
    } catch {}
    return true;
  }

  try {
    const { error } = await supabase
      .from('challenge_participants')
      .upsert(
        {
          challenge_id: challengeId,
          user_id: userId,
          status: 'active',
          progress: 0,
          joined_at: new Date().toISOString(),
        },
        { onConflict: 'challenge_id,user_id' }
      );

    if (error) {
      console.warn('[challenge-service] joinChallenge error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('[challenge-service] joinChallenge exception:', err);
    return false;
  }
}

// ── Public API: Leave Challenge ───────────────────────────────────
export async function leaveChallengeInDB(
  challengeId: string,
  userId: string
): Promise<boolean> {
  if (!isSupabaseConfigured) {
    // Offline leave
    try {
      const raw = await AsyncStorage.getItem(LOCAL_JOINED_KEY);
      if (raw) {
        const list = JSON.parse(raw).filter((id: string) => id !== challengeId);
        await AsyncStorage.setItem(LOCAL_JOINED_KEY, JSON.stringify(list));
      }
    } catch {}
    return true;
  }

  try {
    const { error } = await supabase
      .from('challenge_participants')
      .delete()
      .eq('challenge_id', challengeId)
      .eq('user_id', userId);

    if (error) {
      console.warn('[challenge-service] leaveChallenge error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('[challenge-service] leaveChallenge exception:', err);
    return false;
  }
}

// ── Public API: Realtime Subscription ─────────────────────────────
export function subscribeToChallenges(onUpdate: () => void): () => void {
  if (!isSupabaseConfigured) {
    return () => {};
  }

  try {
    const channelId = `ch_sub_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const channel = supabase
      .channel(channelId)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'challenge_participants' },
        () => {
          onUpdate();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'challenges' },
        () => {
          onUpdate();
        }
      )
      .subscribe();

    return () => {
      try {
        supabase.removeChannel(channel);
      } catch {
        // non-fatal
      }
    };
  } catch (err) {
    console.warn('[challenge-service] subscribeToChallenges error:', err);
    return () => {};
  }
}
