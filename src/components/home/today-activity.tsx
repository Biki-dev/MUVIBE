import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Palette, Radius, Spacing, Typography } from '@/constants/theme';
import { AppIcon } from '@/components/ui/icon';

interface ActivityStat {
  id: string;
  label: string;
  value: string;
  unit: string;
  iconName: string;
}

const STATS_DATA: ActivityStat[] = [
  {
    id: 'steps',
    label: 'Steps',
    value: '6,842',
    unit: 'steps',
    iconName: 'footsteps-outline',
  },
  {
    id: 'calories',
    label: 'Calories',
    value: '318',
    unit: 'kcal',
    iconName: 'flame-outline',
  },
  {
    id: 'distance',
    label: 'Distance',
    value: '4.7',
    unit: 'km',
    iconName: 'navigate-outline',
  },
  {
    id: 'active_time',
    label: 'Active Time',
    value: '52',
    unit: 'min',
    iconName: 'time-outline',
  },
];

export function TodayActivity() {
  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Today's Activity</Text>

      <View style={styles.grid}>
        {STATS_DATA.map((stat) => (
          <View key={stat.id} style={styles.statCard}>
            <View style={styles.cardHeader}>
              <View style={styles.iconContainer}>
                <AppIcon name={stat.iconName} size={16} color={Palette.forest} />
              </View>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>

            <View style={styles.valueRow}>
              <Text style={styles.statValue}>{stat.value}</Text>
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
  statCard: {
    width: '48%',
    flexGrow: 1,
    backgroundColor: Palette.white,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Palette.border,
    padding: Spacing.space3 + 2,
    justifyContent: 'space-between',
    minHeight: 88,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: Spacing.space2,
  },
  iconContainer: {
    width: 28,
    height: 28,
    borderRadius: Radius.sm,
    backgroundColor: Palette.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statLabel: {
    ...Typography.supporting,
    color: Palette.muted,
    fontWeight: '600',
    fontSize: 12.5,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  statValue: {
    ...Typography.stats,
    fontSize: 22,
    lineHeight: 28,
    color: Palette.ink,
  },
  statUnit: {
    ...Typography.supporting,
    color: Palette.muted,
    fontWeight: '500',
    fontSize: 12,
  },
});
