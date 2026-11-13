import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Palette, Radius, Spacing, Typography, FontFamily } from '@/constants/theme';
import { AppIcon } from '@/components/ui/icon';
import { ActivityRecord } from '@/types/activity';

interface ActivityHighlightsProps {
  activities?: ActivityRecord[];
}

export function ActivityHighlights({ activities = [] }: ActivityHighlightsProps) {
  const highlights = useMemo(() => {
    if (!activities || activities.length === 0) {
      return [
        {
          id: 'hl_fav',
          label: 'FAVOURITE ACTIVITY',
          value: 'None yet',
          sublabel: '0 sessions logged',
          iconName: 'fitness-outline',
        },
        {
          id: 'hl_longest',
          label: 'LONGEST DISTANCE',
          value: '0 km',
          sublabel: 'Awaiting your first run',
          iconName: 'navigate-outline',
        },
        {
          id: 'hl_duration',
          label: 'LONGEST SESSION',
          value: '0 mins',
          sublabel: 'Start moving today',
          iconName: 'timer-outline',
        },
        {
          id: 'hl_calories',
          label: 'TOTAL ENERGY',
          value: '0 kcal',
          sublabel: 'Lifetime burned',
          iconName: 'flame-outline',
        },
      ];
    }

    // 1. Most frequent activity
    const counts: Record<string, number> = {};
    let maxDist = 0;
    let maxDurationSec = 0;
    let totalCalories = 0;

    for (const a of activities) {
      const typeKey = a.type || 'Activity';
      counts[typeKey] = (counts[typeKey] || 0) + 1;
      if (a.distanceKm && a.distanceKm > maxDist) {
        maxDist = a.distanceKm;
      }
      if (a.durationSeconds && a.durationSeconds > maxDurationSec) {
        maxDurationSec = a.durationSeconds;
      }
      if (a.calories) {
        totalCalories += a.calories;
      }
    }

    let favType = 'Activity';
    let favCount = 0;
    for (const [t, c] of Object.entries(counts)) {
      if (c > favCount) {
        favType = t;
        favCount = c;
      }
    }

    const formattedFav = favType.charAt(0).toUpperCase() + favType.slice(1);
    const longestMins = Math.round(maxDurationSec / 60);

    return [
      {
        id: 'hl_fav',
        label: 'FAVOURITE ACTIVITY',
        value: formattedFav,
        sublabel: `${favCount} session${favCount === 1 ? '' : 's'}`,
        iconName: 'fitness-outline',
      },
      {
        id: 'hl_longest',
        label: 'LONGEST DISTANCE',
        value: `${maxDist.toFixed(1)} km`,
        sublabel: maxDist > 0 ? 'Personal best' : 'No distance logged',
        iconName: 'navigate-outline',
      },
      {
        id: 'hl_duration',
        label: 'LONGEST SESSION',
        value: `${longestMins} mins`,
        sublabel: longestMins > 0 ? 'Continuous movement' : 'Log a workout',
        iconName: 'timer-outline',
      },
      {
        id: 'hl_calories',
        label: 'TOTAL ENERGY',
        value: `${totalCalories.toLocaleString()} kcal`,
        sublabel: 'Lifetime calories burned',
        iconName: 'flame-outline',
      },
    ];
  }, [activities]);

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Activity Highlights</Text>

      <View style={styles.grid}>
        {highlights.map((item) => (
          <View key={item.id} style={styles.card}>
            <View style={styles.iconWrap}>
              <AppIcon name={item.iconName} size={15} color={Palette.forest} />
            </View>
            <Text style={styles.label}>{item.label}</Text>
            <Text style={styles.value}>{item.value}</Text>
            <Text style={styles.sublabel}>{item.sublabel}</Text>
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
  sectionTitle: {
    ...Typography.sectionHeading,
    color: Palette.ink,
    marginBottom: Spacing.space3,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.space3,
  },
  card: {
    width: '48%',
    flexGrow: 1,
    backgroundColor: Palette.white,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Palette.border,
    padding: Spacing.space3 + 2,
    minHeight: 90,
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: Radius.sm,
    backgroundColor: Palette.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  label: {
    ...Typography.supporting,
    fontSize: 9.5,
    fontWeight: '800',
    fontFamily: FontFamily.bold,
    color: Palette.forest,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  value: {
    ...Typography.cardHeading,
    fontSize: 16,
    color: Palette.ink,
    marginBottom: 1,
  },
  sublabel: {
    ...Typography.supporting,
    fontSize: 11,
    color: Palette.muted,
  },
});
