import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Palette, Radius, Spacing, Typography, FontFamily } from '@/constants/theme';
import { AppIcon } from '@/components/ui/icon';
import { StreakInfo } from '@/types/activity';

interface ActivityStreakSectionProps {
  streak: StreakInfo;
}

const WEEKDAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export function ActivityStreakSection({ streak }: ActivityStreakSectionProps) {
  const weekCalendarDays = useMemo(() => {
    const now = new Date();
    const currentDay = now.getDay();
    const distanceToMonday = currentDay === 0 ? -6 : 1 - currentDay;

    const monday = new Date(now);
    monday.setDate(now.getDate() + distanceToMonday);

    return WEEKDAY_LABELS.map((label, index) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + index);

      const status = streak.weekDayStatus[index] || 'upcoming';
      const isToday = status === 'today' || (status === 'completed' && index === (currentDay === 0 ? 6 : currentDay - 1));

      return {
        label,
        dateNumber: d.getDate(),
        status,
        isToday,
      };
    });
  }, [streak]);

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Your Streak</Text>

      <View style={styles.card}>
        {/* Streak Metrics Highlights Row */}
        <View style={styles.metricsRow}>
          <View style={styles.metricItem}>
            <View style={styles.metricHeader}>
              <AppIcon name="flame" size={16} color={Palette.forest} />
              <Text style={styles.metricLabel}>Current</Text>
            </View>
            <View style={styles.metricValueWrap}>
              <Text style={styles.metricValue}>{streak.currentStreak}</Text>
              <Text style={styles.metricUnit}>days</Text>
            </View>
          </View>

          <View style={styles.metricDivider} />

          <View style={styles.metricItem}>
            <View style={styles.metricHeader}>
              <AppIcon name="trophy-outline" size={16} color={Palette.forest} />
              <Text style={styles.metricLabel}>Best</Text>
            </View>
            <View style={styles.metricValueWrap}>
              <Text style={styles.metricValue}>{streak.longestStreak}</Text>
              <Text style={styles.metricUnit}>days</Text>
            </View>
          </View>

          <View style={styles.metricDivider} />

          <View style={styles.metricItem}>
            <View style={styles.metricHeader}>
              <AppIcon name="calendar-outline" size={16} color={Palette.forest} />
              <Text style={styles.metricLabel}>This Month</Text>
            </View>
            <View style={styles.metricValueWrap}>
              <Text style={styles.metricValue}>{streak.activeDaysThisMonth}</Text>
              <Text style={styles.metricUnit}>active</Text>
            </View>
          </View>
        </View>

        {/* Compact Weekly Activity Track */}
        <View style={styles.calendarTrack}>
          <Text style={styles.trackHeading}>This Week's Consistency</Text>
          <View style={styles.daysRow}>
            {weekCalendarDays.map((item, idx) => {
              const isCompleted = item.status === 'completed';
              const isMissed = item.status === 'missed';
              const isToday = item.isToday;

              return (
                <View key={idx} style={styles.dayCol}>
                  <Text style={[styles.dayLabel, isToday && styles.dayLabelToday]}>
                    {item.label}
                  </Text>
                  <View
                    style={[
                      styles.circle,
                      isCompleted && styles.circleCompleted,
                      isMissed && styles.circleMissed,
                      isToday && styles.circleToday,
                    ]}>
                    {isCompleted ? (
                      <AppIcon name="checkmark" size={13} color={Palette.white} />
                    ) : (
                      <Text
                        style={[
                          styles.dateNum,
                          isToday && styles.dateNumToday,
                          isMissed && styles.dateNumMissed,
                        ]}>
                        {item.dateNumber}
                      </Text>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.space5,
  },
  sectionTitle: {
    ...Typography.sectionHeading,
    color: Palette.ink,
    marginBottom: Spacing.space3,
  },
  card: {
    backgroundColor: Palette.white,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Palette.border,
    padding: Spacing.space4,
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingBottom: Spacing.space3,
    borderBottomWidth: 1,
    borderBottomColor: Palette.surfaceSubtle,
  },
  metricItem: {
    alignItems: 'center',
    flex: 1,
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  metricLabel: {
    ...Typography.supporting,
    fontSize: 11.5,
    color: Palette.muted,
    fontWeight: '500',
    fontFamily: FontFamily.medium,
  },
  metricValueWrap: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  metricValue: {
    ...Typography.stats,
    fontSize: 22,
    color: Palette.ink,
  },
  metricUnit: {
    ...Typography.supporting,
    fontSize: 11,
    color: Palette.muted,
  },
  metricDivider: {
    width: 1,
    height: 32,
    backgroundColor: Palette.border,
  },
  calendarTrack: {
    marginTop: Spacing.space3,
  },
  trackHeading: {
    ...Typography.supporting,
    fontSize: 11.5,
    color: Palette.muted,
    fontWeight: '600',
    fontFamily: FontFamily.medium,
    marginBottom: Spacing.space2,
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dayCol: {
    alignItems: 'center',
    flex: 1,
  },
  dayLabel: {
    ...Typography.supporting,
    fontSize: 11,
    color: Palette.muted,
    fontWeight: '500',
    fontFamily: FontFamily.medium,
    marginBottom: 4,
  },
  dayLabelToday: {
    color: Palette.forest,
    fontWeight: '700',
    fontFamily: FontFamily.bold,
  },
  circle: {
    width: 32,
    height: 32,
    borderRadius: Radius.full,
    backgroundColor: Palette.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleCompleted: {
    backgroundColor: Palette.forest,
  },
  circleMissed: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Palette.border,
  },
  circleToday: {
    borderWidth: 2,
    borderColor: Palette.forest,
    backgroundColor: Palette.white,
  },
  dateNum: {
    ...Typography.supporting,
    fontSize: 11.5,
    color: Palette.muted,
    fontWeight: '600',
    fontFamily: FontFamily.medium,
  },
  dateNumToday: {
    color: Palette.forest,
    fontWeight: '700',
    fontFamily: FontFamily.bold,
  },
  dateNumMissed: {
    color: Palette.borderDark || '#8A978E',
  },
});
