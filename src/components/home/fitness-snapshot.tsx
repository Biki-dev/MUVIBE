import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Palette, Radius, Spacing, Typography } from '@/constants/theme';
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
      bg: Palette.forest,
      textColor: Palette.lime,
    },
    {
      id: 'calories',
      label: 'Energy Burned',
      value: totalCalories >= 1000 ? `${(totalCalories / 1000).toFixed(1)}k` : totalCalories.toString(),
      unit: 'kcal',
      iconName: 'flame',
      bg: Palette.amber,
      textColor: Palette.white,
    },
    {
      id: 'activities',
      label: 'Total Sessions',
      value: totalActivities.toString(),
      unit: 'logged',
      iconName: 'pulse',
      bg: Palette.electricBlue,
      textColor: Palette.white,
    },
    {
      id: 'time',
      label: 'Active Minutes',
      value: totalMinutes >= 60 ? `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m` : totalMinutes.toString(),
      unit: totalMinutes >= 60 ? 'this year' : 'mins',
      iconName: 'time',
      bg: '#1AAC96',
      textColor: Palette.white,
    },
  ];

  if (totalActivities === 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.sectionTitle}>Lifetime Overview</Text>
          <Text style={styles.subtitle}>
            {currentStreak > 0
              ? `🔥 ${currentStreak}-day streak · Best: ${longestStreak} days`
              : `Best streak: ${longestStreak} days`}
          </Text>
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
          <View key={card.id} style={[styles.card, { backgroundColor: card.bg }]}>
            <AppIcon name={card.iconName} size={18} color={card.textColor} />
            <Text style={[styles.cardValue, { color: card.textColor }]}>
              {card.value}
            </Text>
            <Text style={[styles.cardUnit, { color: card.textColor + 'CC' }]}>
              {card.unit}
            </Text>
            <Text style={[styles.cardLabel, { color: card.textColor + '99' }]}>
              {card.label}
            </Text>
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
  },
  subtitle: {
    fontSize: 11.5,
    color: Palette.muted,
    marginTop: 2,
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
    borderRadius: Radius.card,
    padding: Spacing.space3 + 2,
    minHeight: 90,
    justifyContent: 'space-between',
  },
  cardValue: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginTop: 4,
  },
  cardUnit: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 1,
  },
  cardLabel: {
    fontSize: 11,
    marginTop: 4,
  },
});
