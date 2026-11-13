import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Palette, Radius, Spacing, Typography } from '@/constants/theme';
import { AppIcon } from '@/components/ui/icon';
import { Challenge } from '@/types/challenge';

interface ActiveChallengeCardProps {
  challenge: Challenge;
}

export function ActiveChallengeCard({ challenge }: ActiveChallengeCardProps) {
  const router = useRouter();

  const handlePress = () => {
    router.push(`/challenge/${challenge.id}` as any);
  };

  const percentage = Math.min(
    100,
    Math.round((challenge.progress / challenge.goal) * 100)
  );

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={styles.titleWrap}>
          <Text style={styles.title}>{challenge.title}</Text>
          <Text style={styles.categoryText}>
            {challenge.category.toUpperCase()} • {challenge.remainingDays} DAYS REMAINING
          </Text>
        </View>

        <View style={styles.rewardTag}>
          <AppIcon name="trophy-outline" size={13} color={Palette.amber} />
          <Text style={styles.rewardText}>+{challenge.rewardPoints} pts</Text>
        </View>
      </View>

      {/* Progress Stats */}
      <View style={styles.progressLabelRow}>
        <Text style={styles.progressLabel}>Your Progress</Text>
        <Text style={styles.progressValue}>
          <Text style={styles.progressHighlight}>
            {challenge.progress.toLocaleString()}
          </Text>
          {' / '}
          {challenge.goal.toLocaleString()} {challenge.goalUnit}
        </Text>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressBarTrack}>
        <View style={[styles.progressBarFill, { width: `${percentage}%` }]} />
      </View>

      {/* Percentage & Action Row */}
      <View style={styles.footer}>
        <Text style={styles.percentageText}>{percentage}% Completed</Text>

        <View style={styles.actionWrap}>
          <Text style={styles.actionText}>View Details</Text>
          <AppIcon name="arrow-forward" size={13} color={Palette.forest} />
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Palette.white,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Palette.border,
    padding: Spacing.space4,
    marginBottom: Spacing.space3,
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
    elevation: 1,
  },
  cardPressed: {
    backgroundColor: Palette.surfaceHighlight,
    transform: [{ scale: 0.995 }],
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: Spacing.space3,
  },
  titleWrap: {
    flex: 1,
    paddingRight: 8,
  },
  title: {
    ...Typography.cardHeading,
    fontSize: 16,
    color: Palette.ink,
    marginBottom: 2,
  },
  categoryText: {
    ...Typography.supporting,
    fontSize: 10.5,
    fontWeight: '700',
    color: Palette.muted,
    letterSpacing: 0.4,
  },
  rewardTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Palette.surfaceHighlight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  rewardText: {
    ...Typography.supporting,
    fontSize: 11.5,
    fontWeight: '700',
    color: Palette.ink,
  },
  progressLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressLabel: {
    ...Typography.supporting,
    fontSize: 12,
    color: Palette.muted,
    fontWeight: '500',
  },
  progressValue: {
    ...Typography.supporting,
    fontSize: 12,
    color: Palette.muted,
  },
  progressHighlight: {
    fontWeight: '700',
    color: Palette.ink,
  },
  progressBarTrack: {
    height: 8,
    borderRadius: Radius.full,
    backgroundColor: Palette.surfaceSubtle,
    overflow: 'hidden',
    marginBottom: Spacing.space2 + 2,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Palette.forest,
    borderRadius: Radius.full,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
  },
  percentageText: {
    ...Typography.supporting,
    fontSize: 12,
    fontWeight: '600',
    color: Palette.forest,
  },
  actionWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionText: {
    ...Typography.supporting,
    fontSize: 12,
    fontWeight: '700',
    color: Palette.forest,
  },
});
