import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Palette, Radius, Spacing, Typography } from '@/constants/theme';
import { AppIcon } from '@/components/ui/icon';
import { ProfileFitnessOverview } from '@/types/profile';

interface FitnessOverviewProps {
  overview: ProfileFitnessOverview;
}

export function FitnessOverview({ overview }: FitnessOverviewProps) {
  const cards = [
    {
      id: 'minutes',
      label: 'Active Minutes',
      value: overview.activeMinutes.toLocaleString(),
      unit: 'min',
      iconName: 'time-outline',
    },
    {
      id: 'distance',
      label: 'Total Distance',
      value: overview.totalDistanceKm.toFixed(1),
      unit: 'km',
      iconName: 'navigate-outline',
    },
    {
      id: 'steps',
      label: 'Total Steps',
      value: overview.totalSteps.toLocaleString(),
      unit: 'steps',
      iconName: 'footsteps-outline',
    },
    {
      id: 'activities',
      label: 'Activities',
      value: overview.totalActivities.toString(),
      unit: 'logged',
      iconName: 'checkmark-circle-outline',
    },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.headerBlock}>
        <Text style={styles.title}>Fitness Overview</Text>
        <Text style={styles.subtitle}>Your progress at a glance.</Text>
      </View>

      <View style={styles.grid}>
        {cards.map((card) => (
          <View key={card.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.iconWrap}>
                <AppIcon name={card.iconName} size={15} color={Palette.forest} />
              </View>
              <Text style={styles.cardLabel}>{card.label}</Text>
            </View>

            <View style={styles.valueRow}>
              <Text style={styles.cardValue}>{card.value}</Text>
              <Text style={styles.cardUnit}>{card.unit}</Text>
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
  headerBlock: {
    marginBottom: Spacing.space3,
  },
  title: {
    ...Typography.sectionHeading,
    color: Palette.ink,
    marginBottom: 2,
  },
  subtitle: {
    ...Typography.body,
    fontSize: 13,
    color: Palette.muted,
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
    minHeight: 84,
    justifyContent: 'space-between',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginBottom: Spacing.space2,
  },
  iconWrap: {
    width: 26,
    height: 26,
    borderRadius: Radius.sm,
    backgroundColor: Palette.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardLabel: {
    ...Typography.supporting,
    fontSize: 11.5,
    fontWeight: '500',
    color: Palette.muted,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  cardValue: {
    ...Typography.stats,
    fontSize: 22,
    color: Palette.ink,
    letterSpacing: -0.5,
  },
  cardUnit: {
    ...Typography.supporting,
    fontSize: 11.5,
    color: Palette.muted,
  },
});
