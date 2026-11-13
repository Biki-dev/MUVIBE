import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Palette, Radius, Spacing, Typography } from '@/constants/theme';
import { AppIcon } from '@/components/ui/icon';
import { Challenge } from '@/types/challenge';

interface CompletedChallengeCardProps {
  challenge: Challenge;
}

export function CompletedChallengeCard({ challenge }: CompletedChallengeCardProps) {
  const router = useRouter();

  const handlePress = () => {
    router.push(`/challenge/${challenge.id}` as any);
  };

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}>
      <View style={styles.headerRow}>
        <View style={styles.titleWrap}>
          <Text style={styles.title}>{challenge.title}</Text>
          <Text style={styles.completedDate}>
            {challenge.completedDate || 'Completed recently'}
          </Text>
        </View>

        <View style={styles.completedBadge}>
          <AppIcon name="checkmark-circle" size={14} color={Palette.forest} />
          <Text style={styles.completedBadgeText}>Completed</Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCol}>
          <Text style={styles.statLabel}>Final Achievement</Text>
          <Text style={styles.statValue}>{challenge.goalFormatted}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.statCol}>
          <Text style={styles.statLabel}>Points Earned</Text>
          <View style={styles.pointsWrap}>
            <AppIcon name="trophy" size={14} color={Palette.amber} />
            <Text style={styles.pointsValue}>+{challenge.rewardPoints} pts</Text>
          </View>
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
  completedDate: {
    ...Typography.supporting,
    fontSize: 11.5,
    color: Palette.muted,
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(197, 243, 107, 0.35)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  completedBadgeText: {
    ...Typography.supporting,
    fontSize: 11,
    fontWeight: '700',
    color: Palette.forest,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Palette.surfaceHighlight,
    borderRadius: Radius.sm,
    padding: Spacing.space3,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  statCol: {
    flex: 1,
  },
  statLabel: {
    ...Typography.supporting,
    fontSize: 11,
    color: Palette.muted,
    marginBottom: 2,
  },
  statValue: {
    ...Typography.bodyBold,
    fontSize: 13,
    color: Palette.ink,
  },
  pointsWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  pointsValue: {
    ...Typography.bodyBold,
    fontSize: 13,
    color: Palette.forest,
  },
  divider: {
    width: 1,
    height: 24,
    backgroundColor: Palette.border,
    marginHorizontal: 12,
  },
});
