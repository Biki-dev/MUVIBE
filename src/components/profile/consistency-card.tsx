import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Palette, Radius, Spacing, Typography, FontFamily } from '@/constants/theme';
import { AppIcon } from '@/components/ui/icon';
import { StreakInfo } from '@/types/activity';

interface ConsistencyCardProps {
  streak: StreakInfo;
}

const WEEKDAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export function ConsistencyCard({ streak }: ConsistencyCardProps) {
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
      const isToday =
        status === 'today' ||
        (status === 'completed' && index === (currentDay === 0 ? 6 : currentDay - 1));

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
      <Text style={styles.sectionTitle}>Your Consistency</Text>

      <View style={styles.card}>
        {/* Streak Numbers */}
        <View style={styles.statsRow}>
          <View style={styles.statCol}>
            <Text style={styles.statLabel}>CURRENT STREAK</Text>
            <View style={styles.valueRow}>
              <Text style={styles.statNum}>{streak.currentStreak || 7}</Text>
              <Text style={styles.statUnit}>DAYS</Text>
            </View>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.statCol}>
            <Text style={styles.statLabel}>LONGEST STREAK</Text>
            <View style={styles.valueRow}>
              <Text style={styles.statNum}>{streak.longestStreak || 18}</Text>
              <Text style={styles.statUnit}>DAYS</Text>
            </View>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.statCol}>
            <Text style={styles.statLabel}>TOTAL ACTIVE</Text>
            <View style={styles.valueRow}>
              <Text style={styles.statNum}>{streak.totalActiveDays || 42}</Text>
              <Text style={styles.statUnit}>DAYS</Text>
            </View>
          </View>
        </View>

        {/* Compact Weekly Calendar */}
        <View style={styles.calendarTrack}>
          <Text style={styles.trackHeading}>Current Week</Text>
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
                      <AppIcon name="checkmark" size={12} color={Palette.white} />
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
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: Spacing.space3,
    borderBottomWidth: 1,
    borderBottomColor: Palette.surfaceSubtle,
  },
  statCol: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    ...Typography.supporting,
    fontSize: 9.5,
    fontWeight: '700',
    fontFamily: FontFamily.bold,
    color: Palette.muted,
    letterSpacing: 0.5,
    marginBottom: 4,
    textAlign: 'center',
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 3,
  },
  statNum: {
    ...Typography.stats,
    fontSize: 20,
    color: Palette.ink,
  },
  statUnit: {
    ...Typography.supporting,
    fontSize: 10,
    fontWeight: '700',
    fontFamily: FontFamily.bold,
    color: Palette.muted,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: Palette.border,
  },
  calendarTrack: {
    marginTop: Spacing.space3,
  },
  trackHeading: {
    ...Typography.supporting,
    fontSize: 11,
    fontWeight: '600',
    fontFamily: FontFamily.medium,
    color: Palette.muted,
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
    width: 30,
    height: 30,
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
    fontSize: 11,
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
