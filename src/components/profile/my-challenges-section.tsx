import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Palette, Radius, Spacing, Typography, FontFamily } from '@/constants/theme';
import { AppIcon } from '@/components/ui/icon';
import { useChallenges } from '@/context/challenge-context';

export function MyChallengesSection() {
  const router = useRouter();
  const { activeChallenges, completedChallenges } = useChallenges();

  const totalPointsEarned = completedChallenges.reduce(
    (sum, c) => sum + c.rewardPoints,
    0
  );

  const displayChallenges = [...activeChallenges, ...completedChallenges].slice(0, 2);

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.headerBlock}>
          <Text style={styles.title}>My Challenges</Text>
          <Text style={styles.subtitle}>Goals you are conquering.</Text>
        </View>

        <Pressable
          onPress={() => router.push('/(tabs)/challenges' as any)}
          style={styles.viewAllBtn}
          hitSlop={8}>
          <Text style={styles.viewAllText}>View All</Text>
          <AppIcon name="arrow-forward" size={13} color={Palette.forest} />
        </Pressable>
      </View>

      {/* Summary Row */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryCol}>
          <Text style={styles.summaryNum}>{activeChallenges.length}</Text>
          <Text style={styles.summaryLabel}>Active</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.summaryCol}>
          <Text style={styles.summaryNum}>{completedChallenges.length}</Text>
          <Text style={styles.summaryLabel}>Completed</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.summaryCol}>
          <Text style={[styles.summaryNum, { color: Palette.forest }]}>
            +{totalPointsEarned}
          </Text>
          <Text style={styles.summaryLabel}>Points Earned</Text>
        </View>
      </View>

      {/* Challenge Cards */}
      {displayChallenges.length > 0 ? (
        <View style={styles.cardsList}>
          {displayChallenges.map((ch) => {
            const isCompleted = ch.status === 'completed';
            const percentage = Math.min(
              100,
              Math.round((ch.progress / ch.goal) * 100)
            );

            return (
              <Pressable
                key={ch.id}
                onPress={() => router.push(`/challenge/${ch.id}` as any)}
                style={({ pressed }) => [styles.challengeCard, pressed && styles.cardPressed]}>
                <View style={styles.chTopRow}>
                  <Text style={styles.chTitle}>{ch.title}</Text>
                  <View
                    style={[
                      styles.statusBadge,
                      isCompleted ? styles.statusBadgeDone : styles.statusBadgeActive,
                    ]}>
                    <Text
                      style={[
                        styles.statusText,
                        isCompleted ? styles.statusTextDone : styles.statusTextActive,
                      ]}>
                      {isCompleted ? 'Completed' : 'Active'}
                    </Text>
                  </View>
                </View>

                <View style={styles.progressRow}>
                  <Text style={styles.progressText}>
                    {ch.progress.toLocaleString()} / {ch.goal.toLocaleString()} {ch.goalUnit}
                  </Text>
                  <Text style={styles.progressPercent}>{percentage}%</Text>
                </View>

                <View style={styles.progressTrack}>
                  <View
                    style={[
                      styles.progressFill,
                      { width: `${percentage}%` },
                      isCompleted && styles.progressFillDone,
                    ]}
                  />
                </View>
              </Pressable>
            );
          })}
        </View>
      ) : (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>You haven't joined any challenges yet.</Text>
          <Pressable
            onPress={() => router.push('/(tabs)/challenges' as any)}
            style={styles.exploreBtn}>
            <Text style={styles.exploreText}>Explore Challenges</Text>
          </Pressable>
        </View>
      )}
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
  headerBlock: {
    flex: 1,
    paddingRight: 8,
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
  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingVertical: 4,
  },
  viewAllText: {
    ...Typography.supporting,
    fontSize: 12,
    fontWeight: '700',
    fontFamily: FontFamily.bold,
    color: Palette.forest,
  },
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Palette.white,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Palette.border,
    paddingVertical: Spacing.space3,
    paddingHorizontal: Spacing.space4,
    marginBottom: Spacing.space3,
  },
  summaryCol: {
    flex: 1,
    alignItems: 'center',
  },
  summaryNum: {
    ...Typography.stats,
    fontSize: 20,
    color: Palette.ink,
  },
  summaryLabel: {
    ...Typography.supporting,
    fontSize: 11,
    color: Palette.muted,
    marginTop: 2,
  },
  divider: {
    width: 1,
    height: 28,
    backgroundColor: Palette.border,
  },
  cardsList: {
    gap: 8,
  },
  challengeCard: {
    backgroundColor: Palette.white,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Palette.border,
    padding: Spacing.space3 + 2,
  },
  cardPressed: {
    backgroundColor: Palette.surfaceHighlight,
  },
  chTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.space2,
  },
  chTitle: {
    ...Typography.bodyBold,
    fontSize: 14,
    color: Palette.ink,
    flex: 1,
    paddingRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  statusBadgeActive: {
    backgroundColor: Palette.surfaceSubtle,
  },
  statusBadgeDone: {
    backgroundColor: 'rgba(197, 243, 107, 0.3)',
  },
  statusText: {
    ...Typography.supporting,
    fontSize: 10.5,
    fontWeight: '700',
    fontFamily: FontFamily.bold,
  },
  statusTextActive: {
    color: Palette.muted,
  },
  statusTextDone: {
    color: Palette.forest,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressText: {
    ...Typography.supporting,
    fontSize: 11.5,
    color: Palette.muted,
  },
  progressPercent: {
    ...Typography.supporting,
    fontSize: 11.5,
    fontWeight: '700',
    fontFamily: FontFamily.bold,
    color: Palette.forest,
  },
  progressTrack: {
    height: 6,
    borderRadius: Radius.full,
    backgroundColor: Palette.surfaceSubtle,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Palette.forest,
    borderRadius: Radius.full,
  },
  progressFillDone: {
    backgroundColor: Palette.lime,
  },
  emptyBox: {
    backgroundColor: Palette.white,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Palette.border,
    padding: Spacing.space4,
    alignItems: 'center',
  },
  emptyText: {
    ...Typography.body,
    fontSize: 13,
    color: Palette.muted,
    marginBottom: Spacing.space3,
  },
  exploreBtn: {
    backgroundColor: Palette.forest,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: Radius.btn,
  },
  exploreText: {
    ...Typography.supporting,
    fontSize: 12,
    fontWeight: '700',
    fontFamily: FontFamily.bold,
    color: Palette.white,
  },
});
