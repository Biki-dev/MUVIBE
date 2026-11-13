import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Palette, Radius, Spacing, Typography } from '@/constants/theme';

type DayState = 'completed' | 'missed' | 'today' | 'upcoming';

interface WeekDayItem {
  dayLabel: string;
  dateNumber: number;
  isToday: boolean;
  state: DayState;
  fullDate: Date;
}

const WEEKDAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export function WeeklyCalendar() {
  const weekDays: WeekDayItem[] = useMemo(() => {
    const now = new Date();
    // Monday-based calculation (Sunday = 0 in JS Date)
    const currentDay = now.getDay();
    const distanceToMonday = currentDay === 0 ? -6 : 1 - currentDay;

    const monday = new Date(now);
    monday.setDate(now.getDate() + distanceToMonday);
    monday.setHours(0, 0, 0, 0);

    const todayDateNumber = now.getDate();
    const todayMonth = now.getMonth();
    const todayYear = now.getFullYear();

    // Mock history for past days to demonstrate states:
    // e.g., Mon = completed, Tue = completed, Wed = missed, Thu = completed, Fri = completed
    const mockPastStates: Record<number, 'completed' | 'missed'> = {
      0: 'completed', // Mon
      1: 'completed', // Tue
      2: 'missed',    // Wed
      3: 'completed', // Thu
      4: 'completed', // Fri
      5: 'completed', // Sat
      6: 'missed',    // Sun
    };

    return WEEKDAY_LABELS.map((label, index) => {
      const dayDate = new Date(monday);
      dayDate.setDate(monday.getDate() + index);

      const isToday =
        dayDate.getDate() === todayDateNumber &&
        dayDate.getMonth() === todayMonth &&
        dayDate.getFullYear() === todayYear;

      const isPast =
        !isToday &&
        dayDate <
          new Date(todayYear, todayMonth, todayDateNumber, 0, 0, 0, 0);

      let state: DayState = 'upcoming';
      if (isToday) {
        state = 'today';
      } else if (isPast) {
        state = mockPastStates[index] || 'completed';
      } else {
        state = 'upcoming';
      }

      return {
        dayLabel: label,
        dateNumber: dayDate.getDate(),
        isToday,
        state,
        fullDate: dayDate,
      };
    });
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.daysRow}>
        {weekDays.map((item, index) => {
          const isCompleted = item.state === 'completed';
          const isMissed = item.state === 'missed';
          const isToday = item.isToday;

          return (
            <View key={index} style={styles.dayColumn}>
              {/* Weekday label */}
              <Text
                style={[
                  styles.dayLabel,
                  isToday && styles.dayLabelToday,
                ]}>
                {item.dayLabel}
              </Text>

              {/* Circular date element */}
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

              {/* Subtle status indicator dot */}
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
    marginBottom: Spacing.space5,
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
    fontWeight: '700',
  },
  dateCircle: {
    width: 38,
    height: 38,
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
    fontSize: 14,
    color: Palette.muted,
  },
  dateTextCompleted: {
    color: Palette.ink,
    fontWeight: '700',
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
