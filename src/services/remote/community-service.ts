/**
 * src/services/community-service.ts
 * ─────────────────────────────────────────────────────────────────
 * Supabase-backed Community Data Service.
 *
 * Provides:
 * - Community clubs list & user joined clubs.
 * - Campus Club Leaderboard (which club is doing best campus-wide).
 * - Club-specific Member Leaderboard (full stats: points, km, workouts, steps).
 * - Reddit-like Club Discussions (posts, upvotes/downvotes, comments, images & links).
 * - Club-specific Challenges.
 * - Realtime subscriptions.
 * ─────────────────────────────────────────────────────────────────
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import {
  CommunityClub,
  ClubMemberRankItem,
  ClubDiscussionPost,
  ClubPostComment,
} from '@/types/community';
import { Challenge } from '@/types/challenge';
import { fetchAllChallenges } from '@/services/challenge-service';

const CLUBS_CACHE_KEY = '@muvibe_clubs_cache_v2';
const LOCAL_JOINED_CLUBS_KEY = '@muvibe_local_joined_clubs_v2';

// ── Default Fallback Seed Clubs (Offline / Pre-migration) ──────────
const FALLBACK_CLUBS: CommunityClub[] = [
  {
    id: 'club_aec_runners',
    name: 'AEC Campus Runners',
    category: 'running',
    categoryLabel: 'Running & Strides',
    institution: 'Assam Engineering College (AEC)',
    description: 'Daily morning track intervals, campus loops, and weekend 10K road runs.',
    longDescription:
      'AEC Campus Runners unites sprint athletes, marathoners, and recreational joggers across all engineering departments. We run morning loops around campus grounds, host hill sprint drills at Jalukbari slopes, and represent AEC at state university athletics meets.',
    meetingLocation: 'Hostel 4 Ground & Main Campus Pavilion',
    memberCount: 0,
    joined: false,
    featured: true,
    coverColor: '#18352D',
    interests: ['Morning 5K', 'Track Intervals', 'Half Marathon', 'Tempo Runs'],
    totalPoints: 4850,
    totalDistanceKm: 1240.5,
    totalActivities: 312,
  },
  {
    id: 'club_campus_cyclists',
    name: 'Highway Pedalers Cycling Club',
    category: 'cycling',
    categoryLabel: 'Cycling & Touring',
    institution: 'Assam Engineering College (AEC)',
    description: 'Weekend highway tours, campus time-trials, and endurance gravel rides.',
    longDescription:
      'Highway Pedalers is AEC’s premier cycling collective. From early morning Deepor Beel scenic rides to Saraighat bridge sprints, we welcome road bikes, MTBs, and fixies. We advocate for green campus commuting and road safety.',
    meetingLocation: 'Main College Gate / Mechanical Dept Porch',
    memberCount: 0,
    joined: false,
    featured: false,
    coverColor: '#162C25',
    interests: ['Highway Tours', 'Endurance 50K', 'Bicycle Commuting', 'Hill Climbs'],
    totalPoints: 4210,
    totalDistanceKm: 3180.0,
    totalActivities: 248,
  },
  {
    id: 'club_power_forge',
    name: 'Iron Forge Gym & Fitness',
    category: 'gym_fitness',
    categoryLabel: 'Strength & Conditioning',
    institution: 'Assam Engineering College (AEC)',
    description: 'Calisthenics, powerlifting, functional HIIT, and hostel courtyard workouts.',
    longDescription:
      'Dedicated to building functional strength, athletic conditioning, and clean nutrition habits on campus. We organize quarterly bench/squat/deadlift form clinics, hostel pull-up showdowns, and open HIIT circuits.',
    meetingLocation: 'College Gymnasium & Hostel 3 Open Courtyard',
    memberCount: 0,
    joined: false,
    featured: false,
    coverColor: '#25443B',
    interests: ['Powerlifting', 'Calisthenics', 'HIIT', 'Mobility & Hypertrophy'],
    totalPoints: 3920,
    totalDistanceKm: 450.0,
    totalActivities: 410,
  },
  {
    id: 'club_shuttle_smash',
    name: 'Shuttle Smash Badminton Guild',
    category: 'sports',
    categoryLabel: 'Badminton & Racket Sports',
    institution: 'Assam Engineering College (AEC)',
    description: 'Competitive singles/doubles rallies, ladder matches, and weekend tournaments.',
    longDescription:
      'AEC Badminton Guild runs regular weekly court sessions, internal ladder rankings, and collegiate championship preparation on wooden indoor courts.',
    meetingLocation: 'Indoor Sports Hall Court 1 & 2',
    memberCount: 0,
    joined: false,
    featured: false,
    coverColor: '#1F3A30',
    interests: ['Singles Ladder', 'Doubles Tactics', 'Footwork Drills', 'Tournaments'],
    totalPoints: 3360,
    totalDistanceKm: 210.0,
    totalActivities: 275,
  },
  {
    id: 'club_trail_blazers',
    name: 'Brahmaputra Trail Hikers',
    category: 'adventure',
    categoryLabel: 'Adventure & Trekking',
    institution: 'Assam Engineering College (AEC)',
    description: 'Weekend hill ridge treks, nature runs, and eco-conservation trail hikes.',
    longDescription:
      'Explore the breathtaking hills, riverfronts, and reserved forest trails surrounding our campus. We organize monthly group hikes, leave-no-trace campus cleanup marches, and outdoor orientation for freshers.',
    meetingLocation: 'Nilachal Foothills & Campus Lake Pavilion',
    memberCount: 0,
    joined: false,
    featured: false,
    coverColor: '#142821',
    interests: ['Hill Treks', 'Trail Running', 'Eco Cleanup', 'Outdoor Navigation'],
    totalPoints: 3150,
    totalDistanceKm: 890.0,
    totalActivities: 140,
  },
  {
    id: 'club_zenith_yoga',
    name: 'Zenith Mindfulness & Yoga',
    category: 'yoga_wellness',
    categoryLabel: 'Yoga & Wellness',
    institution: 'Assam Engineering College (AEC)',
    description: 'Sunrise Hatha flows, breathwork, sports recovery, and stress resilience sessions.',
    longDescription:
      'Mindfulness meets physical conditioning. Zenith provides students and faculty a space to decompress, build core balance, and recover from intense exams and physical training through guided yogic postures and pranayama.',
    meetingLocation: 'Open Air Amphitheatre / Lakeview Lawn',
    memberCount: 0,
    joined: false,
    featured: false,
    coverColor: '#1D332B',
    interests: ['Hatha Yoga', 'Pranayama', 'Mobility Recovery', 'Mental Wellness'],
    totalPoints: 2840,
    totalDistanceKm: 180.0,
    totalActivities: 195,
  },
];

function formatDate(isoStr: string): string {
  const diff = Date.now() - new Date(isoStr).getTime();
  const mins = Math.floor(diff / (1000 * 60));
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(isoStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

// ── 1. Fetch All Clubs & User Joined Clubs ─────────────────────────
export async function fetchCommunityClubs(
  userId?: string
): Promise<{ clubs: CommunityClub[]; myClubs: CommunityClub[] }> {
  if (!isSupabaseConfigured) {
    try {
      const rawJoined = await AsyncStorage.getItem(LOCAL_JOINED_CLUBS_KEY);
      const joinedIds: string[] = rawJoined ? JSON.parse(rawJoined) : [];
      const updated = FALLBACK_CLUBS.map((c) => ({
        ...c,
        joined: joinedIds.includes(c.id),
        memberCount: joinedIds.includes(c.id) ? 1 : 0,
      }));
      return {
        clubs: updated,
        myClubs: updated.filter((c) => c.joined),
      };
    } catch {
      return { clubs: FALLBACK_CLUBS, myClubs: [] };
    }
  }

  try {
    // Fetch clubs from Supabase
    const { data: dbClubs, error } = await supabase
      .from('clubs')
      .select('*')
      .order('total_points', { ascending: false });

    if (error || !dbClubs || dbClubs.length === 0) {
      return { clubs: FALLBACK_CLUBS, myClubs: [] };
    }

    // Fetch members count & check if user is joined
    const { data: allMembers } = await supabase
      .from('club_members')
      .select('club_id, user_id');

    const memberCountByClub = new Map<string, number>();
    const userJoinedClubIds = new Set<string>();

    (allMembers || []).forEach((m) => {
      memberCountByClub.set(m.club_id, (memberCountByClub.get(m.club_id) || 0) + 1);
      if (userId && m.user_id === userId) {
        userJoinedClubIds.add(m.club_id);
      }
    });

    const parsedClubs: CommunityClub[] = dbClubs.map((row) => {
      const memberCount = memberCountByClub.get(row.id) || 0;
      const joined = userJoinedClubIds.has(row.id);

      return {
        id: row.id,
        name: row.name,
        category: row.category as CommunityClub['category'],
        categoryLabel: row.category_label,
        institution: row.institution,
        description: row.description,
        longDescription: row.long_description,
        meetingLocation: row.meeting_location,
        coverColor: row.cover_color,
        interests: row.interests || [],
        memberCount,
        joined,
        featured: row.total_points > 4000,
        totalPoints: Number(row.total_points ?? 0),
        totalDistanceKm: Number(row.total_distance_km ?? 0),
        totalActivities: Number(row.total_activities ?? 0),
      };
    });

    await AsyncStorage.setItem(CLUBS_CACHE_KEY, JSON.stringify(parsedClubs));

    return {
      clubs: parsedClubs,
      myClubs: parsedClubs.filter((c) => c.joined),
    };
  } catch (err) {
    console.error('[community-service] fetchCommunityClubs error:', err);
    return { clubs: FALLBACK_CLUBS, myClubs: [] };
  }
}

// ── 2. Campus Clubs Leaderboard (Shows which club is doing best) ───
export async function fetchCommunityClubsLeaderboard(): Promise<CommunityClub[]> {
  const { clubs } = await fetchCommunityClubs();
  // Sorted by totalPoints descending
  return [...clubs].sort((a, b) => b.totalPoints - a.totalPoints);
}

// ── 3. Club Member Leaderboard (Competitive ranking within a club) ──
export async function fetchClubLeaderboard(
  clubId: string,
  currentUserId?: string
): Promise<ClubMemberRankItem[]> {
  if (!isSupabaseConfigured) {
    return [];
  }

  try {
    const { data: members, error } = await supabase
      .from('club_members')
      .select('id, club_id, user_id, role, points, distance_km, activities_count, steps')
      .eq('club_id', clubId)
      .order('points', { ascending: false });

    if (error || !members || members.length === 0) {
      return [];
    }

    // Fetch user profiles for avatars & names
    const userIds = members.map((m) => m.user_id);
    const { data: users } = await supabase
      .from('users')
      .select('id, full_name, username, avatar_url')
      .in('id', userIds);

    const usersMap = new Map<string, any>();
    (users || []).forEach((u) => usersMap.set(u.id, u));

    const colors = ['#C5F36B', '#5279F6', '#E8A34A', '#E56C67', '#9B51E0'];
    const emojis = ['🏃', '🚴', '🏋️', '🧘', '🧗', '🏸'];

    return members.map((m, idx) => {
      const u = usersMap.get(m.user_id);
      return {
        rank: idx + 1,
        userId: m.user_id,
        name: u?.full_name || 'Club Athlete',
        username: u?.username || 'athlete',
        role: (m.role as 'admin' | 'member') || 'member',
        avatarColor: colors[idx % colors.length],
        avatarEmoji: emojis[idx % emojis.length],
        points: Number(m.points ?? 0),
        distanceKm: Number(m.distance_km ?? 0),
        activitiesCount: Number(m.activities_count ?? 0),
        steps: Number(m.steps ?? 0),
        isCurrentUser: currentUserId ? m.user_id === currentUserId : false,
      };
    });
  } catch (err) {
    console.error('[community-service] fetchClubLeaderboard error:', err);
    return [];
  }
}

// ── 4. Join / Leave Club ───────────────────────────────────────────
export async function joinClubInDB(clubId: string, userId: string): Promise<boolean> {
  if (!isSupabaseConfigured) {
    try {
      const raw = await AsyncStorage.getItem(LOCAL_JOINED_CLUBS_KEY);
      const list: string[] = raw ? JSON.parse(raw) : [];
      if (!list.includes(clubId)) {
        list.push(clubId);
        await AsyncStorage.setItem(LOCAL_JOINED_CLUBS_KEY, JSON.stringify(list));
      }
    } catch {}
    return true;
  }

  try {
    const { error } = await supabase
      .from('club_members')
      .upsert(
        {
          club_id: clubId,
          user_id: userId,
          role: 'member',
          points: 10, // Welcome points
          distance_km: 0,
          activities_count: 0,
          steps: 0,
        },
        { onConflict: 'club_id,user_id' }
      );

    if (error) {
      console.warn('[community-service] joinClub error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('[community-service] joinClub exception:', err);
    return false;
  }
}

export async function leaveClubInDB(clubId: string, userId: string): Promise<boolean> {
  if (!isSupabaseConfigured) {
    try {
      const raw = await AsyncStorage.getItem(LOCAL_JOINED_CLUBS_KEY);
      if (raw) {
        const list = JSON.parse(raw).filter((id: string) => id !== clubId);
        await AsyncStorage.setItem(LOCAL_JOINED_CLUBS_KEY, JSON.stringify(list));
      }
    } catch {}
    return true;
  }

  try {
    const { error } = await supabase
      .from('club_members')
      .delete()
      .eq('club_id', clubId)
      .eq('user_id', userId);

    if (error) {
      console.warn('[community-service] leaveClub error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('[community-service] leaveClub exception:', err);
    return false;
  }
}

// ── 5. Reddit-like Club Discussions ────────────────────────────────

export async function fetchClubPosts(
  clubId: string,
  userId?: string
): Promise<ClubDiscussionPost[]> {
  if (!isSupabaseConfigured) {
    return [];
  }

  try {
    // 1. Fetch posts
    const { data: posts, error } = await supabase
      .from('club_posts')
      .select('*')
      .eq('club_id', clubId)
      .order('created_at', { ascending: false });

    if (error || !posts || posts.length === 0) {
      return [];
    }

    const postIds = posts.map((p) => p.id);
    const authorIds = Array.from(new Set(posts.map((p) => p.user_id)));

    // 2. Fetch author profiles
    const { data: authors } = await supabase
      .from('users')
      .select('id, full_name, username, avatar_url')
      .in('id', authorIds);

    const authorsMap = new Map<string, any>();
    (authors || []).forEach((a) => authorsMap.set(a.id, a));

    // 3. Fetch user votes if logged in
    let userVotesMap = new Map<string, 1 | -1>();
    if (userId) {
      const { data: votes } = await supabase
        .from('club_post_votes')
        .select('post_id, vote_type')
        .eq('user_id', userId)
        .in('post_id', postIds);

      (votes || []).forEach((v) => {
        userVotesMap.set(v.post_id, v.vote_type as 1 | -1);
      });
    }

    // 4. Fetch comment counts
    const { data: comments } = await supabase
      .from('club_post_comments')
      .select('post_id');

    const commentsCountMap = new Map<string, number>();
    (comments || []).forEach((c) => {
      commentsCountMap.set(c.post_id, (commentsCountMap.get(c.post_id) || 0) + 1);
    });

    const colors = ['#C5F36B', '#5279F6', '#E8A34A', '#E56C67', '#9B51E0'];

    return posts.map((p, idx) => {
      const author = authorsMap.get(p.user_id);
      const userVote = userVotesMap.get(p.id) || 0;
      const upvotes = Number(p.upvotes ?? 0);
      const downvotes = Number(p.downvotes ?? 0);
      const score = upvotes - downvotes;

      return {
        id: p.id,
        clubId: p.club_id,
        userId: p.user_id,
        authorName: author?.full_name || 'Club Member',
        authorUsername: author?.username || 'member',
        authorAvatarColor: colors[idx % colors.length],
        title: p.title,
        content: p.content,
        imageUrl: p.image_url || undefined,
        linkUrl: p.link_url || undefined,
        upvotes,
        downvotes,
        score,
        userVote,
        commentsCount: commentsCountMap.get(p.id) || 0,
        createdAt: p.created_at,
        formattedDate: formatDate(p.created_at),
      };
    });
  } catch (err) {
    console.error('[community-service] fetchClubPosts error:', err);
    return [];
  }
}

export async function createClubPost(
  clubId: string,
  userId: string,
  data: {
    title: string;
    content: string;
    imageUrl?: string;
    linkUrl?: string;
  }
): Promise<boolean> {
  if (!isSupabaseConfigured) return false;

  try {
    const { error } = await supabase.from('club_posts').insert({
      club_id: clubId,
      user_id: userId,
      title: data.title.trim(),
      content: data.content.trim(),
      image_url: data.imageUrl?.trim() || null,
      link_url: data.linkUrl?.trim() || null,
      upvotes: 1, // Author automatic upvote
      downvotes: 0,
    });

    if (error) {
      console.warn('[community-service] createClubPost error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('[community-service] createClubPost exception:', err);
    return false;
  }
}

export async function voteClubPost(
  postId: string,
  userId: string,
  voteType: 1 | -1
): Promise<{ score: number; userVote: 1 | -1 | 0 } | null> {
  if (!isSupabaseConfigured) return null;

  try {
    // Check existing vote
    const { data: existing } = await supabase
      .from('club_post_votes')
      .select('vote_type')
      .eq('post_id', postId)
      .eq('user_id', userId)
      .maybeSingle();

    let newVote: 1 | -1 | 0 = voteType;

    if (existing) {
      if (existing.vote_type === voteType) {
        // Toggling off vote
        await supabase
          .from('club_post_votes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', userId);
        newVote = 0;
      } else {
        // Switching vote (e.g. from -1 to 1)
        await supabase
          .from('club_post_votes')
          .update({ vote_type: voteType })
          .eq('post_id', postId)
          .eq('user_id', userId);
      }
    } else {
      // New vote
      await supabase.from('club_post_votes').insert({
        post_id: postId,
        user_id: userId,
        vote_type: voteType,
      });
    }

    // Recompute total upvotes and downvotes for this post
    const { data: allVotes } = await supabase
      .from('club_post_votes')
      .select('vote_type')
      .eq('post_id', postId);

    let upvotes = 0;
    let downvotes = 0;
    (allVotes || []).forEach((v) => {
      if (v.vote_type === 1) upvotes++;
      if (v.vote_type === -1) downvotes++;
    });

    await supabase
      .from('club_posts')
      .update({ upvotes, downvotes })
      .eq('id', postId);

    return { score: upvotes - downvotes, userVote: newVote };
  } catch (err) {
    console.error('[community-service] voteClubPost error:', err);
    return null;
  }
}

// ── 6. Club Post Comments ──────────────────────────────────────────
export async function fetchPostComments(postId: string): Promise<ClubPostComment[]> {
  if (!isSupabaseConfigured) return [];

  try {
    const { data: comments, error } = await supabase
      .from('club_post_comments')
      .select('*')
      .eq('post_id', postId)
      .order('created_at', { ascending: true });

    if (error || !comments) return [];

    const userIds = Array.from(new Set(comments.map((c) => c.user_id)));
    const { data: users } = await supabase
      .from('users')
      .select('id, full_name, username')
      .in('id', userIds);

    const usersMap = new Map<string, any>();
    (users || []).forEach((u) => usersMap.set(u.id, u));
    const colors = ['#C5F36B', '#5279F6', '#E8A34A', '#E56C67'];

    return comments.map((c, idx) => {
      const u = usersMap.get(c.user_id);
      return {
        id: c.id,
        postId: c.post_id,
        userId: c.user_id,
        authorName: u?.full_name || 'Athlete',
        authorUsername: u?.username || 'student',
        authorAvatarColor: colors[idx % colors.length],
        content: c.content,
        createdAt: c.created_at,
        formattedDate: formatDate(c.created_at),
      };
    });
  } catch (err) {
    console.error('[community-service] fetchPostComments error:', err);
    return [];
  }
}

export async function createPostComment(
  postId: string,
  userId: string,
  content: string
): Promise<boolean> {
  if (!isSupabaseConfigured || !content.trim()) return false;

  try {
    const { error } = await supabase.from('club_post_comments').insert({
      post_id: postId,
      user_id: userId,
      content: content.trim(),
    });

    return !error;
  } catch (err) {
    console.error('[community-service] createPostComment error:', err);
    return false;
  }
}

// ── 7. Club-specific Challenges ────────────────────────────────────
export async function fetchClubChallenges(
  clubId: string,
  userId?: string
): Promise<Challenge[]> {
  const allChallenges = await fetchAllChallenges(userId);
  // Match challenges with club_id or category matching the club
  return allChallenges.filter((ch: any) => {
    return (
      ch.clubId === clubId ||
      ch.id === 'ch_featured_01' ||
      (clubId === 'club_aec_runners' && (ch.id === 'ch_step_hunter' || ch.id === 'ch_weekend_10k')) ||
      (clubId === 'club_campus_cyclists' && ch.id === 'ch_cycling_100k') ||
      (clubId === 'club_trail_blazers' && ch.id === 'ch_marathon_prep')
    );
  });
}

// ── 8. Real-time Subscription ──────────────────────────────────────
export function subscribeToCommunity(onUpdate: () => void): () => void {
  if (!isSupabaseConfigured) return () => {};

  try {
    const channelId = `comm_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const channel = supabase
      .channel(channelId)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'clubs' }, () => {
        onUpdate();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'club_members' }, () => {
        onUpdate();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'club_posts' }, () => {
        onUpdate();
      })
      .subscribe();

    return () => {
      try {
        supabase.removeChannel(channel);
      } catch {}
    };
  } catch (err) {
    console.warn('[community-service] subscribe error:', err);
    return () => {};
  }
}
