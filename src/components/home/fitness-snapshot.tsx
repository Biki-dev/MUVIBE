import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Palette, Radius, Spacing, Typography, FontFamily } from '@/constants/theme';
import { AppIcon } from '@/components/ui/icon';

interface FitnessSnapshotProps {
  totalDistanceKm: number;
  totalCalories: number;
  totalActivities: number;
  totalMinutes: number;
  currentStreak: number;
  longestStreak: number;
}

export function FitnessSnapshot({
  totalDistanceKm,
  totalCalories,
  totalActivities,
  totalMinutes,
  currentStreak,
  longestStreak,
}: FitnessSnapshotProps) {
  const router = useRouter();

  const cards = [
    {
      id: 'distance',
      label: 'Total Distance',
      value: totalDistanceKm.toFixed(1),
      unit: 'km',
      iconName: 'navigate',
    },
    {
      id: 'calories',
      label: 'Energy Burned',
      value: totalCalories >= 1000 ? `${(totalCalories / 1000).toFixed(1)}k` : totalCalories.toString(),
      unit: 'kcal',
      iconName: 'flame',
    },
    {
      id: 'activities',
      label: 'Total Sessions',
      value: totalActivities.toString(),
      unit: 'logged',
      iconName: 'pulse',
    },
    {
      id: 'time',
      label: 'Active Minutes',
      value: totalMinutes >= 60 ? `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m` : totalMinutes.toString(),
      unit: totalMinutes >= 60 ? 'this year' : 'mins',
      iconName: 'time',
    },
  ];

  if (totalActivities === 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.sectionTitle}>Lifetime Overview</Text>
          {currentStreak > 0 ? (
            <View style={styles.streakSubtitleRow}>
              <AppIcon name="flame-outline" size={12} color={Palette.amber} />
              <Text style={styles.subtitle}>
                {currentStreak}-day streak · Best: {longestStreak} days
              </Text>
            </View>
          ) : (
            <Text style={styles.subtitle}>Best streak: {longestStreak} days</Text>
          )}
        </View>
        <Pressable
          onPress={() => router.push('/(tabs)/profile' as any)}
          style={styles.profileBtn}
          hitSlop={8}>
          <Text style={styles.profileBtnText}>Profile</Text>
          <AppIcon name="person-circle-outline" size={16} color={Palette.forest} />
        </Pressable>
      </View>

      <View style={styles.grid}>
        {cards.map((card) => (
          <View key={card.id} style={styles.card}>
            {/* Diagonal stripe accent overlay */}
            <View style={styles.stripeContainer} pointerEvents="none">
              <View style={[styles.diagonalStripe, styles.stripe1]} />
              <View style={[styles.diagonalStripe, styles.stripe2]} />
              <View style={[styles.diagonalStripe, styles.stripe3]} />
            </View>

            <View style={styles.cardContent}>
              <View style={styles.iconContainer}>
                <AppIcon name={card.iconName} size={15} color={Palette.forest} />
              </View>
              <View>
                <Text style={styles.cardValue}>{card.value}</Text>
                <Text style={styles.cardUnit}>{card.unit}</Text>
              </View>
              <Text style={styles.cardLabel}>{card.label}</Text>
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
  streakSubtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  subtitle: {
    fontSize: 11.5,
    fontFamily: FontFamily.regular,
    color: Palette.muted,
  },
  profileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingTop: 3,
  },
  profileBtnText: {
    ...Typography.supporting,
    color: Palette.forest,
    fontWeight: '700',
    fontFamily: FontFamily.bold,
    fontSize: 12.5,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.space2 + 2,
  },
  card: {
    width: '48%',
    flexGrow: 1,
    backgroundColor: Palette.white,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Palette.border,
    minHeight: 110,
    overflow: 'hidden',
  },
  stripeContainer: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 90,
    height: 90,
    overflow: 'hidden',
    opacity: 0.4,
  },
  diagonalStripe: {
    position: 'absolute',
    height: 2,
    backgroundColor: Palette.border,
    transform: [{ rotate: '-45deg' }],
  },
  stripe1: {
    top: 20,
    right: -25,
    width: 120,
  },
  stripe2: {
    top: 40,
    right: -25,
    width: 120,
  },
  stripe3: {
    top: 60,
    right: -25,
    width: 120,
  },
  cardContent: {
    padding: Spacing.space3 + 2,
    flex: 1,
    justifyContent: 'space-between',
  },
  iconContainer: {
    width: 28,
    height: 28,
    borderRadius: Radius.sm,
    backgroundColor: Palette.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardValue: {
    fontSize: 22,
    fontWeight: '800',
    fontFamily: FontFamily.bold,
    color: Palette.ink,
    letterSpacing: -0.5,
    marginTop: 6,
  },
  cardUnit: {
    fontSize: 11,
    fontWeight: '600',
    fontFamily: FontFamily.medium,
    color: Palette.muted,
    marginTop: 1,
  },
  cardLabel: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: FontFamily.medium,
    color: Palette.muted,
    marginTop: 4,
  },
});