import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Palette, Radius, Spacing, Typography, FontFamily } from '@/constants/theme';
import { AppIcon } from '@/components/ui/icon';
import { ActivityRecord } from '@/types/activity';

interface TodayActivityProps {
  activities?: ActivityRecord[];
}

export function TodayActivity({ activities = [] }: TodayActivityProps) {
  const router = useRouter();

  // Filter only today's activities
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const todayActivities = activities.filter((a) => {
    const d = new Date(a.startedAt);
    const dStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    return dStr === todayStr;
  });

  // Aggregate today's stats
  let totalSteps = 0;
  let totalCalories = 0;
  let totalDistKm = 0;
  let totalDurationSec = 0;

  for (const a of todayActivities) {
    totalSteps += a.steps || 0;
    totalCalories += a.calories || 0;
    if (a.distanceKm) totalDistKm += a.distanceKm;
    totalDurationSec += a.durationSeconds || 0;
  }

  const totalMins = Math.round(totalDurationSec / 60);

  const hasActivity = todayActivities.length > 0;

  const stats = [
    {
      id: 'steps',
      label: 'Steps',
      value: totalSteps > 0 ? totalSteps.toLocaleString() : '0',
      unit: 'steps',
      iconName: 'footsteps-outline',
      filled: totalSteps > 0,
    },
    {
      id: 'calories',
      label: 'Calories',
      value: totalCalories > 0 ? totalCalories.toString() : '0',
      unit: 'kcal',
      iconName: 'flame-outline',
      filled: totalCalories > 0,
    },
    {
      id: 'distance',
      label: 'Distance',
      value: totalDistKm > 0 ? totalDistKm.toFixed(1) : '0',
      unit: 'km',
      iconName: 'navigate-outline',
      filled: totalDistKm > 0,
    },
    {
      id: 'active_time',
      label: 'Active Time',
      value: totalMins > 0 ? totalMins.toString() : '0',
      unit: 'min',
      iconName: 'time-outline',
      filled: totalMins > 0,
    },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.sectionTitle}>Today's Activity</Text>
          {hasActivity && (
            <Text style={styles.sessionCount}>
              {todayActivities.length} session{todayActivities.length > 1 ? 's' : ''} completed
            </Text>
          )}
        </View>
        <Pressable
          onPress={() => router.push('/(tabs)/activity' as any)}
          style={styles.viewAllBtn}
          hitSlop={8}>
          <Text style={styles.viewAllText}>See All</Text>
          <AppIcon name="arrow-forward" size={12} color={Palette.forest} />
        </Pressable>
      </View>

      {!hasActivity && (
        <View style={styles.emptyBanner}>
          <AppIcon name="sunny-outline" size={22} color={Palette.amber} />
          <View style={{ flex: 1 }}>
            <Text style={styles.emptyTitle}>No activity logged yet</Text>
            <Text style={styles.emptySubtext}>Tap "Start Activity" to begin your session</Text>
          </View>
          <Pressable
            onPress={() => router.push('/activity/running' as any)}
            style={styles.startBtn}>
            <Text style={styles.startBtnText}>Start</Text>
          </Pressable>
        </View>
      )}

      <View style={styles.grid}>
        {stats.map((stat) => (
          <View
            key={stat.id}
            style={[styles.statCard, stat.filled && styles.statCardActive]}>
            <View style={styles.cardHeader}>
              <View
                style={[
                  styles.iconContainer,
                  stat.filled && styles.iconContainerActive,
                ]}>
                <AppIcon
                  name={stat.iconName}
                  size={15}
                  color={stat.filled ? Palette.lime : Palette.muted}
                />
              </View>
              <Text style={[styles.statLabel, stat.filled && styles.statLabelActive]}>
                {stat.label}
              </Text>
            </View>

            <View style={styles.valueRow}>
              <Text style={[styles.statValue, !stat.filled && styles.statValueEmpty]}>
                {stat.value}
              </Text>
              <Text style={styles.statUnit}>{stat.unit}</Text>
            </View>
          </View>
        ))}
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
    alignItems: 'flex-start',
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
  sessionCount: {
    ...Typography.supporting,
    fontSize: 11.5,
    color: Palette.forest,
    marginTop: 2,
  },
  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingTop: 3,
  },
  viewAllText: {
    ...Typography.supporting,
    fontSize: 12.5,
    color: Palette.forest,
    fontWeight: '700',
    fontFamily: FontFamily.bold,
  },
  emptyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFF8E8',
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: '#F5E8C8',
    padding: Spacing.space3,
    marginBottom: Spacing.space3,
  },
  emptyTitle: {
    fontSize: 13,
    fontWeight: '700',
    fontFamily: FontFamily.bold,
    color: Palette.ink,
  },
  emptySubtext: {
    fontSize: 11.5,
    fontFamily: FontFamily.regular,
    color: Palette.muted,
    marginTop: 2,
  },
  startBtn: {
    backgroundColor: Palette.forest,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.sm,
  },
  startBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
    fontFamily: FontFamily.bold,
    color: Palette.white,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.space2 + 2,
  },
  statCard: {
    width: '48%',
    flexGrow: 1,
    backgroundColor: Palette.white,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Palette.border,
    padding: Spacing.space3 + 2,
    justifyContent: 'space-between',
    minHeight: 80,
  },
  statCardActive: {
    backgroundColor: Palette.forest,
    borderColor: Palette.forest,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginBottom: Spacing.space2,
  },
  iconContainer: {
    width: 26,
    height: 26,
    borderRadius: Radius.sm,
    backgroundColor: Palette.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainerActive: {
    backgroundColor: 'rgba(197, 243, 107, 0.2)',
  },
  statLabel: {
    ...Typography.supporting,
    color: Palette.muted,
    fontWeight: '600',
    fontFamily: FontFamily.medium,
    fontSize: 12,
  },
  statLabelActive: {
    color: Palette.lime,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  statValue: {
    ...Typography.stats,
    fontSize: 24,
    lineHeight: 30,
    color: Palette.white,
    fontWeight: '800',
    fontFamily: FontFamily.bold,
  },
  statValueEmpty: {
    color: Palette.muted,
    fontSize: 20,
    fontFamily: FontFamily.regular,
  },
  statUnit: {
    ...Typography.supporting,
    color: 'rgba(255,255,255,0.65)',
    fontWeight: '500',
    fontFamily: FontFamily.medium,
    fontSize: 11,
  },
});
