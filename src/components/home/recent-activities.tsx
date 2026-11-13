import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Palette, Radius, Spacing, Typography, FontFamily } from '@/constants/theme';
import { AppIcon } from '@/components/ui/icon';
import { ActivityRecord } from '@/types/activity';

interface RecentActivitiesProps {
  activities?: ActivityRecord[];
}

const ACTIVITY_META: Record<
  string,
  { label: string; iconName: string; iconType: 'ion' | 'mci'; color: string; bg: string }
> = {
  running: { label: 'Running', iconName: 'run', iconType: 'mci', bg: Palette.forest, color: Palette.lime },
  walking: { label: 'Walking', iconName: 'walk', iconType: 'mci', bg: '#EEF7E0', color: Palette.forest },
  cycling: { label: 'Cycling', iconName: 'bicycle-outline', iconType: 'ion', bg: Palette.forest, color: Palette.lime },
  gym: { label: 'Gym', iconName: 'barbell-outline', iconType: 'ion', bg: '#EEF7E0', color: Palette.forest },
  yoga: { label: 'Yoga', iconName: 'body-outline', iconType: 'ion', bg: Palette.forest, color: Palette.lime },
  jump_rope: { label: 'Jump Rope', iconName: 'timer-outline', iconType: 'ion', bg: '#EEF7E0', color: Palette.forest },
  swimming: { label: 'Swimming', iconName: 'water-outline', iconType: 'ion', bg: Palette.forest, color: Palette.lime },
  other: { label: 'Activity', iconName: 'pulse-outline', iconType: 'ion', bg: '#EEF7E0', color: Palette.forest },
  hiking: { label: 'Hiking', iconName: 'trail-sign-outline', iconType: 'ion', bg: Palette.forest, color: Palette.lime },
};

function formatDuration(seconds: number): string {
  if (!seconds) return '0m';
  const mins = Math.round(seconds / 60);
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.round(diffMs / 60000);

  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffMins < 24 * 60) return `${Math.round(diffMins / 60)}h ago`;
  if (diffMins < 48 * 60) return 'Yesterday';

  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function RecentActivities({ activities = [] }: RecentActivitiesProps) {
  const router = useRouter();

  const recent = activities.slice(0, 5);

  if (recent.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>Recent Activities</Text>
        <Pressable
          onPress={() => router.push('/(tabs)/activity' as any)}
          style={styles.seeAllBtn}
          hitSlop={8}>
          <Text style={styles.seeAllText}>See All</Text>
          <AppIcon name="arrow-forward" size={12} color={Palette.forest} />
        </Pressable>
      </View>

      <View style={styles.list}>
        {recent.map((act) => {
          const meta = ACTIVITY_META[act.type] || ACTIVITY_META.other;

          const statParts: string[] = [];
          if (act.distanceKm) statParts.push(`${act.distanceKm.toFixed(1)} km`);
          if (act.steps) statParts.push(`${act.steps.toLocaleString()} steps`);
          if (act.calories) statParts.push(`${act.calories} kcal`);

          return (
            <View key={act.id} style={styles.activityRow}>
              <View style={[styles.iconCircle, { backgroundColor: meta.bg }]}>
                <AppIcon
                  name={meta.iconName}
                  type={meta.iconType}
                  size={18}
                  color={meta.color}
                />
              </View>

              <View style={styles.activityInfo}>
                <Text style={styles.activityType}>{meta.label}</Text>
                <Text style={styles.activityStats} numberOfLines={1}>
                  {statParts.length > 0
                    ? statParts.join(' · ')
                    : formatDuration(act.durationSeconds)}
                </Text>
              </View>

              <View style={styles.activityRight}>
                <Text style={styles.activityDuration}>
                  {formatDuration(act.durationSeconds)}
                </Text>
                <Text style={styles.activityDate}>{formatDate(act.startedAt)}</Text>
              </View>
            </View>
          );
        })}
      </View>
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
  list: {
    backgroundColor: Palette.white,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Palette.border,
    overflow: 'hidden',
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: Spacing.space3,
    paddingHorizontal: Spacing.space3,
    borderBottomWidth: 1,
    borderBottomColor: Palette.border,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityInfo: {
    flex: 1,
    gap: 2,
  },
  activityType: {
    fontSize: 13.5,
    fontWeight: '700',
    fontFamily: FontFamily.bold,
    color: Palette.ink,
  },
  activityStats: {
    fontSize: 11.5,
    fontFamily: FontFamily.regular,
    color: Palette.muted,
  },
  activityRight: {
    alignItems: 'flex-end',
    gap: 2,
  },
  activityDuration: {
    fontSize: 13,
    fontWeight: '700',
    fontFamily: FontFamily.bold,
    color: Palette.forest,
  },
  activityDate: {
    fontSize: 10.5,
    fontFamily: FontFamily.regular,
    color: Palette.muted,
  },
});
