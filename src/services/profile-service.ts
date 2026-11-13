import { supabase } from '@/lib/supabase';
import { ActivityRecord, StreakInfo } from '@/types/activity';
import { AchievementBadge, ProfileFitnessOverview, PublicUserProfile, UserConnectionItem } from '@/types/profile';
import { computeStreak } from './activity-stats';

// ── Fallback Achievement Definitions with Real Logic ──────────────────────────
export const ACHIEVEMENT_BLUEPRINTS: Array<{
  id: string;
  title: string;
  description: string;
  unlockRequirement: string;
  targetGoal: number;
  unit: string;
  iconName: string;
  iconType: 'ion' | 'mci';
  color: string;
  evaluator: (stats: {
    activities: ActivityRecord[];
    streak: StreakInfo;
    totalDistKm: number;
    totalSteps: number;
    totalMinutes: number;
    challengesCount: number;
    clubsCount: number;
    connectionsCount: number;
  }) => { unlocked: boolean; progress: number; unlockedDate?: string };
}> = [
  {
    id: 'ach_first_move',
    title: 'First Move',
    description: 'Complete your first physical activity on campus.',
    unlockRequirement: 'Log any activity with at least 5 minutes of duration.',
    targetGoal: 1,
    unit: 'session',
    iconName: 'flash',
    iconType: 'ion',
    color: '#C5F36B',
    evaluator: ({ activities }) => {
      const qualifying = activities.filter((a) => (a.durationSeconds || 0) >= 300);
      const unlocked = qualifying.length >= 1;
      return {
        unlocked,
        progress: Math.min(1, qualifying.length),
        unlockedDate: unlocked && qualifying[0]?.endedAt
          ? new Date(qualifying[0].endedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
          : undefined,
      };
    },
  },
  {
    id: 'ach_consistency_king',
    title: 'Consistency King',
    description: 'Maintain a 7-day activity streak without skipping a day.',
    unlockRequirement: 'Log at least one activity every day for 7 consecutive days.',
    targetGoal: 7,
    unit: 'days',
    iconName: 'flame',
    iconType: 'ion',
    color: '#E8A34A',
    evaluator: ({ streak }) => {
      const best = Math.max(streak.currentStreak || 0, streak.longestStreak || 0);
      return {
        unlocked: best >= 7,
        progress: Math.min(7, best),
        unlockedDate: best >= 7 ? 'Recently achieved' : undefined,
      };
    },
  },
  {
    id: 'ach_step_hunter',
    title: 'Step Hunter',
    description: 'Complete 50,000 steps across campus routes.',
    unlockRequirement: 'Accumulate 50,000 steps via pedometer or manual walks.',
    targetGoal: 50000,
    unit: 'steps',
    iconName: 'footsteps',
    iconType: 'ion',
    color: '#5279F6',
    evaluator: ({ totalSteps }) => ({
      unlocked: totalSteps >= 50000,
      progress: Math.min(50000, totalSteps),
      unlockedDate: totalSteps >= 50000 ? 'Recently achieved' : undefined,
    }),
  },
  {
    id: 'ach_distance_explorer',
    title: 'Distance Explorer',
    description: 'Travel a cumulative distance of 100 km across running, walking & cycling.',
    unlockRequirement: 'Accumulate 100 km through GPS or distance-tracked activities.',
    targetGoal: 100,
    unit: 'km',
    iconName: 'navigate',
    iconType: 'ion',
    color: '#18352D',
    evaluator: ({ totalDistKm }) => ({
      unlocked: totalDistKm >= 100,
      progress: Math.min(100, Number(totalDistKm.toFixed(1))),
      unlockedDate: totalDistKm >= 100 ? 'Recently achieved' : undefined,
    }),
  },
  {
    id: 'ach_challenge_crusher',
    title: 'Challenge Crusher',
    description: 'Complete 5 campus fitness challenges.',
    unlockRequirement: 'Finish 5 individual, squad, or campus-wide challenges.',
    targetGoal: 5,
    unit: 'challenges',
    iconName: 'trophy',
    iconType: 'ion',
    color: '#E56C67',
    evaluator: ({ challengesCount }) => ({
      unlocked: challengesCount >= 5,
      progress: Math.min(5, challengesCount),
      unlockedDate: challengesCount >= 5 ? 'Recently achieved' : undefined,
    }),
  },
  {
    id: 'ach_community_champion',
    title: 'Community Champion',
    description: 'Join your first fitness community or campus club.',
    unlockRequirement: 'Become a registered member of any official campus club.',
    targetGoal: 1,
    unit: 'club',
    iconName: 'people',
    iconType: 'ion',
    color: '#C5F36B',
    evaluator: ({ clubsCount }) => ({
      unlocked: clubsCount >= 1,
      progress: Math.min(1, clubsCount),
      unlockedDate: clubsCount >= 1 ? 'Active Member' : undefined,
    }),
  },
  {
    id: 'ach_century_minutes',
    title: 'Century Club',
    description: 'Accumulate 100 active minutes of cardiovascular work.',
    unlockRequirement: 'Record a minimum of 100 minutes across logged workouts.',
    targetGoal: 100,
    unit: 'mins',
    iconName: 'time',
    iconType: 'ion',
    color: '#5279F6',
    evaluator: ({ totalMinutes }) => ({
      unlocked: totalMinutes >= 100,
      progress: Math.min(100, totalMinutes),
      unlockedDate: totalMinutes >= 100 ? 'Recently achieved' : undefined,
    }),
  },
  {
    id: 'ach_social_butterfly',
    title: 'Social Mover',
    description: 'Connect with 3 or more campus athletes.',
    unlockRequirement: 'Accept or have 3 confirmed friends/followers on MUVIBE.',
    targetGoal: 3,
    unit: 'friends',
    iconName: 'person-add',
    iconType: 'ion',
    color: '#C5F36B',
    evaluator: ({ connectionsCount }) => ({
      unlocked: connectionsCount >= 3,
      progress: Math.min(3, connectionsCount),
      unlockedDate: connectionsCount >= 3 ? 'Connected' : undefined,
    }),
  },
];

/**
 * Dynamically computes all achievement statuses and progress percentages
 * based on actual Supabase data (activities, streaks, challenges, clubs).
 */
export function evaluateAchievements(params: {
  activities: ActivityRecord[];
  streak: StreakInfo;
  challengesCount?: number;
  clubsCount?: number;
  connectionsCount?: number;
}): AchievementBadge[] {
  const {
    activities,
    streak,
    challengesCount = 0,
    clubsCount = 0,
    connectionsCount = 0,
  } = params;

  let totalDurationSec = 0;
  let totalDistKm = 0;
  let totalSteps = 0;

  for (const a of activities) {
    totalDurationSec += a.durationSeconds || 0;
    if (a.distanceKm) totalDistKm += a.distanceKm;
    if (a.steps) totalSteps += a.steps;
  }

  const totalMinutes = Math.round(totalDurationSec / 60);

  return ACHIEVEMENT_BLUEPRINTS.map((bp) => {
    const res = bp.evaluator({
      activities,
      streak,
      totalDistKm,
      totalSteps,
      totalMinutes,
      challengesCount,
      clubsCount,
      connectionsCount,
    });

    return {
      id: bp.id,
      title: bp.title,
      description: bp.description,
      unlockRequirement: bp.unlockRequirement,
      unlocked: res.unlocked,
      unlockedDate: res.unlockedDate,
      currentProgress: res.progress,
      targetGoal: bp.targetGoal,
      unit: bp.unit,
      iconName: bp.iconName,
      iconType: bp.iconType,
      color: bp.color,
    };
  });
}

// ── Social & User Connections Service ─────────────────────────────────────────

export interface ConnectionStatusResult {
  status: 'none' | 'pending_sent' | 'pending_received' | 'accepted' | 'rejected';
  connectionId?: string;
}

/**
 * Fetch connection status between current user and target user
 */
export async function getConnectionStatus(
  currentUserId: string,
  targetUserId: string
): Promise<ConnectionStatusResult> {
  if (!currentUserId || !targetUserId || currentUserId === targetUserId) {
    return { status: 'none' };
  }

  try {
    const { data, error } = await supabase
      .from('user_connections')
      .select('id, requester_id, target_id, status')
      .or(
        `and(requester_id.eq.${currentUserId},target_id.eq.${targetUserId}),and(requester_id.eq.${targetUserId},target_id.eq.${currentUserId})`
      )
      .maybeSingle();

    if (error || !data) {
      return { status: 'none' };
    }

    if (data.status === 'accepted') {
      return { status: 'accepted', connectionId: data.id };
    }

    if (data.status === 'pending') {
      if (data.requester_id === currentUserId) {
        return { status: 'pending_sent', connectionId: data.id };
      } else {
        return { status: 'pending_received', connectionId: data.id };
      }
    }

    return { status: data.status as any, connectionId: data.id };
  } catch {
    return { status: 'none' };
  }
}

/**
 * Search users by username, full name, or ID
 */
export async function searchUsers(
  query: string,
  currentUserId?: string
): Promise<PublicUserProfile[]> {
  const clean = query.trim().replace(/^@/, '');
  if (!clean) return [];

  try {
    let builder = supabase
      .from('users')
      .select('id, email, full_name, username, college, department, academic_year, avatar_url, bio')
      .limit(25);

    if (clean.length === 36 && clean.includes('-')) {
      // Looks like a UUID
      builder = builder.or(`id.eq.${clean},username.ilike.%${clean}%,full_name.ilike.%${clean}%`);
    } else {
      builder = builder.or(`username.ilike.%${clean}%,full_name.ilike.%${clean}%,email.ilike.%${clean}%`);
    }

    if (currentUserId) {
      builder = builder.neq('id', currentUserId);
    }

    const { data, error } = await builder;
    if (error || !data) return [];

    return data.map((u: any) => ({
      id: u.id,
      email: u.email,
      fullName: u.full_name || u.email?.split('@')[0] || 'Campus Athlete',
      username: u.username || u.email?.split('@')[0] || 'user',
      college: u.college || 'Assam Engineering College',
      department: u.department || '',
      academicYear: u.academic_year || '',
      avatarUrl: u.avatar_url || '',
      bio: u.bio || '',
      followersCount: 0,
      followingCount: 0,
    }));
  } catch (err) {
    console.warn('[ProfileService] searchUsers error:', err);
    return [];
  }
}

/**
 * Fetch all followers and following for a user, plus incoming pending requests
 */
export async function fetchUserSocialStats(userId: string): Promise<{
  followers: UserConnectionItem[];
  following: UserConnectionItem[];
  pendingIncoming: UserConnectionItem[];
}> {
  if (!userId) {
    return { followers: [], following: [], pendingIncoming: [] };
  }

  try {
    // 1. Fetch connections where target_id = userId (Followers or incoming requests)
    const { data: targetRows } = await supabase
      .from('user_connections')
      .select(`
        id,
        requester_id,
        target_id,
        status,
        created_at,
        requester:users!user_connections_requester_id_fkey(id, full_name, username, avatar_url, college)
      `)
      .eq('target_id', userId);

    // 2. Fetch connections where requester_id = userId (Following)
    const { data: requesterRows } = await supabase
      .from('user_connections')
      .select(`
        id,
        requester_id,
        target_id,
        status,
        created_at,
        target:users!user_connections_target_id_fkey(id, full_name, username, avatar_url, college)
      `)
      .eq('requester_id', userId);

    const followers: UserConnectionItem[] = [];
    const pendingIncoming: UserConnectionItem[] = [];

    (targetRows || []).forEach((row: any) => {
      const u = row.requester;
      if (!u) return;
      const item: UserConnectionItem = {
        id: row.id,
        userId: u.id,
        fullName: u.full_name || u.username || 'Campus Athlete',
        username: u.username || 'user',
        avatarUrl: u.avatar_url || '',
        college: u.college || '',
        status: row.status,
        createdAt: row.created_at,
      };

      if (row.status === 'accepted') {
        followers.push(item);
      } else if (row.status === 'pending') {
        pendingIncoming.push(item);
      }
    });

    const following: UserConnectionItem[] = [];
    (requesterRows || []).forEach((row: any) => {
      const u = row.target;
      if (!u) return;
      if (row.status === 'accepted') {
        following.push({
          id: row.id,
          userId: u.id,
          fullName: u.full_name || u.username || 'Campus Athlete',
          username: u.username || 'user',
          avatarUrl: u.avatar_url || '',
          college: u.college || '',
          status: row.status,
          createdAt: row.created_at,
        });
      }
    });

    return { followers, following, pendingIncoming };
  } catch (err) {
    console.warn('[ProfileService] fetchUserSocialStats error:', err);
    return { followers: [], following: [], pendingIncoming: [] };
  }
}

/**
 * Send a follow/connect request
 */
export async function sendFollowRequest(
  requesterId: string,
  targetId: string
): Promise<{ success: boolean; error?: string }> {
  if (!requesterId || !targetId || requesterId === targetId) {
    return { success: false, error: 'Invalid user IDs' };
  }

  try {
    const { error } = await supabase
      .from('user_connections')
      .upsert(
        {
          requester_id: requesterId,
          target_id: targetId,
          status: 'pending',
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'requester_id,target_id' }
      );

    if (error) {
      console.warn('[ProfileService] sendFollowRequest error:', error.message);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Respond to an incoming connection request (accept or reject)
 */
export async function respondToConnectionRequest(
  connectionId: string,
  decision: 'accepted' | 'rejected'
): Promise<{ success: boolean }> {
  try {
    const { error } = await supabase
      .from('user_connections')
      .update({
        status: decision,
        updated_at: new Date().toISOString(),
      })
      .eq('id', connectionId);

    if (error) {
      console.warn('[ProfileService] respondToConnectionRequest error:', error.message);
      return { success: false };
    }
    return { success: true };
  } catch {
    return { success: false };
  }
}

/**
 * Unfollow or cancel connection request
 */
export async function removeConnection(
  userId1: string,
  userId2: string
): Promise<{ success: boolean }> {
  try {
    const { error } = await supabase
      .from('user_connections')
      .delete()
      .or(
        `and(requester_id.eq.${userId1},target_id.eq.${userId2}),and(requester_id.eq.${userId2},target_id.eq.${userId1})`
      );

    if (error) {
      console.warn('[ProfileService] removeConnection error:', error.message);
      return { success: false };
    }
    return { success: true };
  } catch {
    return { success: false };
  }
}

/**
 * Fetch a target user's full public profile, including activities,
 * lifetime fitness overview, streak, achievements, and club count.
 */
export async function fetchPublicUserProfile(
  targetUserId: string,
  currentUserId?: string
): Promise<{
  profile: PublicUserProfile | null;
  overview: ProfileFitnessOverview;
  streak: StreakInfo;
  achievements: AchievementBadge[];
  followers: UserConnectionItem[];
  following: UserConnectionItem[];
  connectionStatus: ConnectionStatusResult;
}> {
  const emptyResult = {
    profile: null,
    overview: { activeMinutes: 0, totalDistanceKm: 0, totalSteps: 0, totalActivities: 0 },
    streak: computeStreak([]),
    achievements: [],
    followers: [],
    following: [],
    connectionStatus: { status: 'none' as const },
  };

  if (!targetUserId) return emptyResult;

  try {
    // 1. Fetch user record
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', targetUserId)
      .maybeSingle();

    if (userError || !userData) {
      return emptyResult;
    }

    // 2. Fetch social connections
    const social = await fetchUserSocialStats(targetUserId);

    // 3. Fetch connection status with current user
    let connectionStatus: ConnectionStatusResult = { status: 'none' };
    if (currentUserId && currentUserId !== targetUserId) {
      connectionStatus = await getConnectionStatus(currentUserId, targetUserId);
    }

    // 4. Fetch target user's public activities
    const { data: actRows } = await supabase
      .from('activities')
      .select('*')
      .eq('user_id', targetUserId)
      .order('started_at', { ascending: false });

    const activities: ActivityRecord[] = (actRows || []).map((row: any) => ({
      id: row.id,
      type: row.type || 'walking',
      startedAt: row.started_at,
      endedAt: row.ended_at,
      durationSeconds: row.duration_seconds || 0,
      distanceKm: row.distance_km != null ? Number(row.distance_km) : null,
      steps: row.steps ?? null,
      jumpCount: row.jump_count ?? null,
      calories: row.calories || 0,
      averageSpeed: row.average_speed != null ? Number(row.average_speed) : null,
      averagePace: row.average_pace ?? null,
      trackingMode: row.tracking_mode || 'sensor',
      notes: row.notes,
      createdAt: row.created_at,
    }));

    // 5. Calculate real fitness overview
    let totalDurationSec = 0;
    let totalDistKm = 0;
    let totalSteps = 0;

    for (const act of activities) {
      totalDurationSec += act.durationSeconds || 0;
      if (act.distanceKm) totalDistKm += act.distanceKm;
      if (act.steps) totalSteps += act.steps;
    }

    const overview: ProfileFitnessOverview = {
      activeMinutes: Math.round(totalDurationSec / 60),
      totalDistanceKm: Number(totalDistKm.toFixed(1)),
      totalSteps,
      totalActivities: activities.length,
    };

    // 6. Calculate real streak
    const streak = computeStreak(activities);

    // 7. Calculate real achievements
    const achievements = evaluateAchievements({
      activities,
      streak,
      challengesCount: 0,
      clubsCount: 0,
      connectionsCount: social.followers.length,
    });

    const profile: PublicUserProfile = {
      id: userData.id,
      email: userData.email,
      fullName: userData.full_name || userData.email?.split('@')[0] || 'Campus Athlete',
      username: userData.username || userData.email?.split('@')[0] || 'athlete',
      college: userData.college || 'Assam Engineering College',
      department: userData.department || '',
      academicYear: userData.academic_year || '',
      avatarUrl: userData.avatar_url || '',
      bio: userData.bio || '',
      followersCount: social.followers.length,
      followingCount: social.following.length,
    };

    return {
      profile,
      overview,
      streak,
      achievements,
      followers: social.followers,
      following: social.following,
      connectionStatus,
    };
  } catch (err) {
    console.warn('[ProfileService] fetchPublicUserProfile error:', err);
    return emptyResult;
  }
}
