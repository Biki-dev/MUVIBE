import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Palette, Radius, Spacing, Typography } from '@/constants/theme';
import { ActivityRecord } from '@/types/activity';
import { StreakInfo } from '@/types/activity';

type DayState = 'completed' | 'missed' | 'today' | 'upcoming';

interface WeekDayItem {
  dayLabel: string;
  dateNumber: number;
  isToday: boolean;
  state: DayState;
}

const WEEKDAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

interface WeeklyCalendarProps {
  activities?: ActivityRecord[];
  streak?: StreakInfo;
}

export function WeeklyCalendar({ activities = [], streak }: WeeklyCalendarProps) {
  // Build week days using real activity data
  const now = new Date();
  const currentDay = now.getDay();
  const distanceToMonday = currentDay === 0 ? -6 : 1 - currentDay;

  const monday = new Date(now);
  monday.setDate(now.getDate() + distanceToMonday);
  monday.setHours(0, 0, 0, 0);

  const todayDateNumber = now.getDate();
  const todayMonth = now.getMonth();
  const todayYear = now.getFullYear();

  // Build a set of dates where activities occurred
  const activeDateSet = new Set<string>();
  for (const act of activities) {
    const d = new Date(act.startedAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    activeDateSet.add(key);
  }

  const weekDays: WeekDayItem[] = WEEKDAY_LABELS.map((label, index) => {
    const dayDate = new Date(monday);
    dayDate.setDate(monday.getDate() + index);

    const isToday =
      dayDate.getDate() === todayDateNumber &&
      dayDate.getMonth() === todayMonth &&
      dayDate.getFullYear() === todayYear;

    const isPast =
      !isToday && dayDate < new Date(todayYear, todayMonth, todayDateNumber, 0, 0, 0, 0);

    const dateKey = `${dayDate.getFullYear()}-${String(dayDate.getMonth() + 1).padStart(2, '0')}-${String(dayDate.getDate()).padStart(2, '0')}`;

    let state: DayState = 'upcoming';
    if (isToday) {
      state = activeDateSet.has(dateKey) ? 'completed' : 'today';
    } else if (isPast) {
      state = activeDateSet.has(dateKey) ? 'completed' : 'missed';
    } else {
      state = 'upcoming';
    }

    return {
      dayLabel: label,
      dateNumber: dayDate.getDate(),
      isToday,
      state,
    };
  });

  const completedThisWeek = weekDays.filter((d) => d.state === 'completed').length;
  const totalPastDays = weekDays.filter((d) => d.state !== 'upcoming').length;

  return (
    <View style={styles.container}>
      {/* Week label + stat */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.weekTitle}>This Week</Text>
          <Text style={styles.weekSubtitle}>
            {completedThisWeek}/{totalPastDays > 0 ? totalPastDays : 7} days active
          </Text>
        </View>
        {(streak?.currentStreak ?? 0) > 0 && (
          <View style={styles.streakPill}>
            <Text style={styles.streakText}>🔥 {streak?.currentStreak}d streak</Text>
          </View>
        )}
      </View>

      <View style={styles.daysRow}>
        {weekDays.map((item, index) => {
          const isCompleted = item.state === 'completed';
          const isMissed = item.state === 'missed';
          const isToday = item.isToday;

          return (
            <View key={index} style={styles.dayColumn}>
              <Text
                style={[
                  styles.dayLabel,
                  isToday && styles.dayLabelToday,
                ]}>
                {item.dayLabel}
              </Text>

              <View
                style={[
                  styles.dateCircle,
                  isCompleted && styles.dateCircleCompleted,
                  isMissed && styles.dateCircleMissed,
                  isToday && styles.dateCircleToday,
                ]}>
                <Text
                  style={[
                    styles.dateText,
                    isCompleted && styles.dateTextCompleted,
                    isMissed && styles.dateTextMissed,
                    isToday && styles.dateTextToday,
                  ]}>
                  {item.dateNumber}
                </Text>
              </View>

              <View style={styles.dotContainer}>
                {isCompleted && <View style={styles.completedDot} />}
                {isMissed && <View style={styles.missedDot} />}
                {isToday && <View style={styles.todayDot} />}
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
    backgroundColor: Palette.white,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Palette.border,
    paddingVertical: Spacing.space3,
    paddingHorizontal: Spacing.space3,
    marginBottom: Spacing.space4,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.space3,
  },
  weekTitle: {
    ...Typography.cardHeading,
    fontSize: 14,
    fontWeight: '700',
    color: Palette.ink,
  },
  weekSubtitle: {
    ...Typography.supporting,
    fontSize: 11.5,
    color: Palette.muted,
  },
  streakPill: {
    backgroundColor: Palette.forest,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  streakText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: Palette.lime,
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dayColumn: {
    alignItems: 'center',
    flex: 1,
  },
  dayLabel: {
    ...Typography.supporting,
    fontSize: 12,
    fontWeight: '600',
    color: Palette.muted,
    marginBottom: Spacing.space1 + 2,
  },
  dayLabelToday: {
    color: Palette.forest,
    fontWeight: '800',
  },
  dateCircle: {
    width: 36,
    height: 36,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  dateCircleCompleted: {
    backgroundColor: Palette.lime,
  },
  dateCircleMissed: {
    backgroundColor: Palette.surfaceSubtle,
  },
  dateCircleToday: {
    borderWidth: 2,
    borderColor: Palette.forest,
    backgroundColor: Palette.white,
  },
  dateText: {
    ...Typography.bodyBold,
    fontSize: 13,
    color: Palette.muted,
  },
  dateTextCompleted: {
    color: Palette.ink,
    fontWeight: '800',
  },
  dateTextMissed: {
    color: Palette.muted,
  },
  dateTextToday: {
    color: Palette.ink,
    fontWeight: '800',
  },
  dotContainer: {
    height: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  completedDot: {
    width: 4,
    height: 4,
    borderRadius: Radius.full,
    backgroundColor: Palette.forest,
  },
  missedDot: {
    width: 4,
    height: 4,
    borderRadius: Radius.full,
    backgroundColor: Palette.border,
  },
  todayDot: {
    width: 4,
    height: 4,
    borderRadius: Radius.full,
    backgroundColor: Palette.forest,
  },
});
