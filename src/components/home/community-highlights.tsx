import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Palette, Radius, Spacing, Typography, FontFamily } from '@/constants/theme';
import { AppIcon } from '@/components/ui/icon';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/auth-context';

interface FeedItem {
  id: string;
  userId: string;
  userName: string;
  username: string;
  activityType: string;
  activityInfo: string;
  iconName: string;
  accentColor: string;
  timeAgo: string;
}

function getActivityIcon(type: string): { name: string; color: string } {
  switch (type) {
    case 'running':
      return { name: 'flash-outline', color: Palette.amber };
    case 'cycling':
      return { name: 'bicycle-outline', color: Palette.electricBlue };
    case 'walking':
      return { name: 'footsteps-outline', color: Palette.forest };
    case 'gym':
      return { name: 'barbell-outline', color: '#D4578F' };
    case 'yoga':
      return { name: 'body-outline', color: '#1AAC96' };
    case 'jump_rope':
      return { name: 'timer-outline', color: Palette.amber };
    default:
      return { name: 'pulse-outline', color: Palette.forest };
  }
}

function getTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.round(hrs / 24)}d ago`;
}

function formatActivityInfo(activity: any): string {
  const parts: string[] = [];
  if (activity.distance_km) parts.push(`${Number(activity.distance_km).toFixed(1)} km`);
  if (activity.steps) parts.push(`${Number(activity.steps).toLocaleString()} steps`);
  if (activity.calories) parts.push(`${activity.calories} kcal`);
  if (activity.duration_seconds) {
    const mins = Math.round(activity.duration_seconds / 60);
    if (mins > 0) parts.push(`${mins} min`);
  }
  return parts.length > 0 ? parts.slice(0, 2).join(' · ') : 'Activity';
}

export function CommunityHighlights() {
  const router = useRouter();
  const { user } = useAuth();
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);

  useEffect(() => {
    async function fetchFeed() {
      try {
        // Fetch recent activities from other campus athletes (excluding self)
        let query = supabase
          .from('activities')
          .select(`
            id,
            user_id,
            type,
            started_at,
            distance_km,
            steps,
            calories,
            duration_seconds,
            users!activities_user_id_fkey(id, full_name, username)
          `)
          .order('started_at', { ascending: false })
          .limit(20);

        if (user?.id) {
          query = query.neq('user_id', user.id);
        }

        const { data, error } = await query;
        if (error || !data) return;

        const items: FeedItem[] = data
          .filter((row: any) => row.users)
          .map((row: any): FeedItem => {
            const u = row.users;
            const { name: iconName, color: accentColor } = getActivityIcon(row.type);
            const displayName = u?.full_name || u?.username || 'Campus Athlete';
            return {
              id: row.id,
              userId: row.user_id,
              userName: displayName,
              username: u?.username || 'athlete',
              activityType: row.type,
              activityInfo: formatActivityInfo(row),
              iconName,
              accentColor,
              timeAgo: getTimeAgo(row.started_at),
            };
          });

        setFeedItems(items.slice(0, 10));
      } catch (err) {
        console.warn('[CommunityHighlights] fetch error:', err);
      }
    }

    fetchFeed();
  }, [user?.id]);

  if (feedItems.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>Campus Feed</Text>
        <Pressable
          onPress={() => router.push('/(tabs)/community' as any)}
          style={styles.seeAllBtn}
          hitSlop={8}>
          <Text style={styles.seeAllText}>Community</Text>
          <AppIcon name="arrow-forward" size={12} color={Palette.forest} />
        </Pressable>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        {feedItems.map((item) => {
          const initials = item.userName
            .split(' ')
            .map((n) => n[0])
            .join('')
            .slice(0, 2)
            .toUpperCase();

          return (
            <Pressable
              key={item.id}
              onPress={() =>
                router.push({
                  pathname: '/profile/user',
                  params: { id: item.userId },
                } as any)
              }
              style={({ pressed }) => [styles.feedCard, pressed && styles.feedCardPressed]}>
              {/* Avatar initial */}
              <View style={[styles.avatarCircle, { backgroundColor: item.accentColor + '22' }]}>
                <Text style={[styles.avatarText, { color: item.accentColor }]}>{initials}</Text>
              </View>

              {/* Name + activity */}
              <View style={styles.infoBlock}>
                <Text style={styles.userName} numberOfLines={1}>
                  {item.userName}
                </Text>
                <View style={styles.activityRow}>
                  <AppIcon name={item.iconName} size={12} color={item.accentColor} />
                  <Text style={styles.activityType}>
                    {item.activityType.charAt(0).toUpperCase() + item.activityType.slice(1)}
                  </Text>
                </View>
                <Text style={styles.activityInfo} numberOfLines={1}>
                  {item.activityInfo}
                </Text>
              </View>

              {/* Time */}
              <Text style={styles.timeAgo}>{item.timeAgo}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.space5,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.space3,
  },
  sectionTitle: {
    ...Typography.sectionHeading,
    color: Palette.ink,
    fontSize: 16,
    fontWeight: '700',
    fontFamily: FontFamily.bold,
  },
  seeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  seeAllText: {
    ...Typography.supporting,
    color: Palette.forest,
    fontWeight: '700',
    fontFamily: FontFamily.bold,
    fontSize: 12.5,
  },
  scrollContent: {
    gap: Spacing.space2 + 2,
    paddingRight: Spacing.space4,
  },
  feedCard: {
    width: 180,
    backgroundColor: Palette.white,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Palette.border,
    padding: Spacing.space3,
    gap: 6,
  },
  feedCardPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  avatarText: {
    fontSize: 13,
    fontWeight: '800',
    fontFamily: FontFamily.bold,
  },
  infoBlock: {
    gap: 2,
  },
  userName: {
    fontSize: 13,
    fontWeight: '700',
    fontFamily: FontFamily.bold,
    color: Palette.ink,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  activityType: {
    fontSize: 11,
    fontWeight: '700',
    fontFamily: FontFamily.bold,
    color: Palette.muted,
  },
  activityInfo: {
    fontSize: 11.5,
    fontFamily: FontFamily.regular,
    color: Palette.muted,
  },
  timeAgo: {
    fontSize: 10.5,
    color: Palette.muted,
    fontWeight: '500',
    fontFamily: FontFamily.medium,
    marginTop: 2,
  },
});
