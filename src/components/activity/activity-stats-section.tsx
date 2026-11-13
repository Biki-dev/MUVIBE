import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Palette, Radius, Spacing, Typography, FontFamily } from '@/constants/theme';
import { AppIcon } from '@/components/ui/icon';
import { ActivityStats, PeriodType } from '@/types/activity';
import { formatDuration } from '@/services/activity-stats';

interface ActivityStatsSectionProps {
  period: PeriodType;
  onPeriodChange: (p: PeriodType) => void;
  stats: ActivityStats;
}

const PERIODS: { key: PeriodType; label: string }[] = [
  { key: 'day', label: 'Day' },
  { key: 'week', label: 'Week' },
  { key: 'month', label: 'Month' },
];

export function ActivityStatsSection({
  period,
  onPeriodChange,
  stats,
}: ActivityStatsSectionProps) {
  const primaryCards = [
    {
      id: 'distance',
      label: 'Total Distance',
      value: stats.totalDistanceKm.toFixed(1),
      unit: 'km',
      iconName: 'navigate-outline',
    },
    {
      id: 'calories',
      label: 'Calories Burned',
      value: stats.totalCalories.toLocaleString(),
      unit: 'kcal',
      iconName: 'flame-outline',
    },
    {
      id: 'steps',
      label: 'Total Steps',
      value: stats.totalSteps.toLocaleString(),
      unit: 'steps',
      iconName: 'footsteps-outline',
    },
    {
      id: 'active_time',
      label: 'Active Time',
      value: formatDuration(stats.totalDurationSeconds),
      unit: '',
      iconName: 'time-outline',
    },
  ];

  const breakdownCards = [
    {
      id: 'running',
      label: 'Running',
      value: `${stats.runningDistanceKm.toFixed(1)} km`,
      iconName: 'run',
      iconType: 'mci' as const,
    },
    {
      id: 'walking',
      label: 'Walking',
      value: `${stats.walkingDistanceKm.toFixed(1)} km`,
      iconName: 'walk',
      iconType: 'mci' as const,
    },
    {
      id: 'cycling',
      label: 'Cycling',
      value: `${stats.cyclingDistanceKm.toFixed(1)} km`,
      iconName: 'bicycle-outline',
      iconType: 'ion' as const,
    },
    {
      id: 'sessions',
      label: 'Activities',
      value: `${stats.activityCount} logged`,
      iconName: 'checkmark-circle-outline',
      iconType: 'ion' as const,
    },
  ];

  return (
    <View style={styles.container}>
      {/* Section Title & Segmented Control */}
      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>Overview</Text>

        <View style={styles.segmentedContainer}>
          {PERIODS.map((item) => {
            const isActive = period === item.key;
            return (
              <Pressable
                key={item.key}
                onPress={() => onPeriodChange(item.key)}
                style={[
                  styles.segmentButton,
                  isActive && styles.segmentButtonActive,
                ]}>
                <Text
                  style={[
                    styles.segmentText,
                    isActive && styles.segmentTextActive,
                  ]}>
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Primary 2x2 Grid */}
      <View style={styles.primaryGrid}>
        {primaryCards.map((card) => (
          <View key={card.id} style={styles.primaryCard}>
            <View style={styles.cardHeader}>
              <View style={styles.iconContainer}>
                <AppIcon name={card.iconName} size={16} color={Palette.forest} />
              </View>
              <Text style={styles.cardLabel} numberOfLines={1}>
                {card.label}
              </Text>
            </View>

            <View style={styles.valueRow}>
              <Text style={styles.primaryValue}>{card.value}</Text>
              {card.unit ? <Text style={styles.primaryUnit}>{card.unit}</Text> : null}
            </View>
          </View>
        ))}
      </View>

      {/* Secondary Breakdown */}
      <View style={styles.breakdownContainer}>
        <Text style={styles.breakdownHeader}>Activity Breakdown</Text>
        <View style={styles.breakdownGrid}>
          {breakdownCards.map((item) => (
            <View key={item.id} style={styles.breakdownCard}>
              <View style={styles.breakdownIconWrap}>
                <AppIcon
                  name={item.iconName}
                  type={item.iconType}
                  size={15}
                  color={Palette.forest}
                />
              </View>
              <View style={styles.breakdownTextWrap}>
                <Text style={styles.breakdownLabel}>{item.label}</Text>
                <Text style={styles.breakdownValue}>{item.value}</Text>
              </View>
            </View>
          ))}
        </View>
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
  },
  segmentedContainer: {
    flexDirection: 'row',
    backgroundColor: Palette.surfaceSubtle,
    borderRadius: Radius.full,
    padding: 3,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  segmentButton: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: Radius.full,
  },
  segmentButtonActive: {
    backgroundColor: Palette.white,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    elevation: 1,
  },
  segmentText: {
    ...Typography.supporting,
    fontSize: 12,
    fontWeight: '500',
    fontFamily: FontFamily.medium,
    color: Palette.muted,
  },
  segmentTextActive: {
    color: Palette.forest,
    fontWeight: '700',
    fontFamily: FontFamily.bold,
  },
  primaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.space3,
    marginBottom: Spacing.space3,
  },
  primaryCard: {
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
  cardLabel: {
    ...Typography.supporting,
    color: Palette.muted,
    fontWeight: '500',
    fontFamily: FontFamily.medium,
    fontSize: 12,
    flexShrink: 1,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  primaryValue: {
    ...Typography.stats,
    fontSize: 22,
    color: Palette.ink,
    letterSpacing: -0.5,
  },
  primaryUnit: {
    ...Typography.supporting,
    color: Palette.muted,
    fontSize: 12,
  },
  breakdownContainer: {
    backgroundColor: Palette.white,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Palette.border,
    padding: Spacing.space3,
  },
  breakdownHeader: {
    ...Typography.supporting,
    fontWeight: '700',
    fontFamily: FontFamily.bold,
    color: Palette.muted,
    fontSize: 11.5,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.space2,
    paddingHorizontal: 4,
  },
  breakdownGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  breakdownCard: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '48%',
    flexGrow: 1,
    backgroundColor: Palette.surfaceHighlight,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Palette.border,
    paddingHorizontal: Spacing.space2 + 2,
    paddingVertical: Spacing.space2,
    gap: 8,
  },
  breakdownIconWrap: {
    width: 26,
    height: 26,
    borderRadius: 6,
    backgroundColor: Palette.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  breakdownTextWrap: {
    flex: 1,
  },
  breakdownLabel: {
    ...Typography.supporting,
    fontSize: 11,
    color: Palette.muted,
  },
  breakdownValue: {
    ...Typography.bodyBold,
    fontSize: 13,
    color: Palette.ink,
  },
});
