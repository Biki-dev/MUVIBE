import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Palette, Radius, Spacing, Typography } from '@/constants/theme';
import { AppIcon } from '@/components/ui/icon';
import { Challenge } from '@/types/challenge';

interface ChallengeCardProps {
  challenge: Challenge;
  onJoin: (id: string) => void;
}

export function ChallengeCard({ challenge, onJoin }: ChallengeCardProps) {
  const router = useRouter();
  const isJoined = challenge.status === 'active';

  const handleCardPress = () => {
    router.push(`/challenge/${challenge.id}` as any);
  };

  const handleJoinPress = () => {
    if (!isJoined) {
      onJoin(challenge.id);
    }
  };

  const difficultyColors = {
    beginner: { bg: 'rgba(197, 243, 107, 0.25)', text: Palette.forest },
    intermediate: { bg: 'rgba(82, 121, 246, 0.12)', text: Palette.electricBlue },
    advanced: { bg: 'rgba(229, 108, 103, 0.15)', text: Palette.coral },
  };

  const diffStyle = difficultyColors[challenge.difficulty] || difficultyColors.beginner;

  const categoryLabels = {
    for_you: 'For You',
    individual: 'Individual',
    squad: 'Squad',
    campus: 'Campus',
  };

  return (
    <Pressable
      onPress={handleCardPress}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}>
      {/* Top Header: Category & Difficulty Badges + Reward */}
      <View style={styles.topRow}>
        <View style={styles.badgeGroup}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{categoryLabels[challenge.category] || 'Challenge'}</Text>
          </View>
          <View style={[styles.diffBadge, { backgroundColor: diffStyle.bg }]}>
            <Text style={[styles.diffText, { color: diffStyle.text }]}>
              {challenge.difficulty.charAt(0).toUpperCase() + challenge.difficulty.slice(1)}
            </Text>
          </View>
        </View>

        <View style={styles.rewardTag}>
          <AppIcon name="trophy-outline" size={12} color={Palette.amber} />
          <Text style={styles.rewardText}>+{challenge.rewardPoints} pts</Text>
        </View>
      </View>

      {/* Title & Goal */}
      <Text style={styles.title}>{challenge.title}</Text>
      <View style={styles.goalRow}>
        <AppIcon name="flag-outline" size={14} color={Palette.forest} />
        <Text style={styles.goalText}>Goal: {challenge.goalFormatted}</Text>
      </View>

      {/* Meta Stats Row */}
      <View style={styles.metaRow}>
        <View style={styles.metaItem}>
          <AppIcon name="calendar-outline" size={13} color={Palette.muted} />
          <Text style={styles.metaText}>{challenge.durationDays} days</Text>
        </View>

        <View style={styles.metaDot} />

        <View style={styles.metaItem}>
          <AppIcon name="people-outline" size={13} color={Palette.muted} />
          <Text style={styles.metaText}>
            {challenge.participantsCount.toLocaleString()} {challenge.category === 'squad' ? 'squads' : 'joined'}
          </Text>
        </View>

        <View style={styles.metaDot} />

        <View style={styles.metaItem}>
          <AppIcon name="time-outline" size={13} color={Palette.muted} />
          <Text style={styles.metaText}>
            {challenge.isStarted
              ? `${challenge.remainingDays}d left`
              : `Starts ${new Date(challenge.startDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`}
          </Text>
        </View>
      </View>

      {/* Bottom Action Footer */}
      <View style={styles.footer}>
        <Text style={styles.viewDetailsText}>View Details</Text>

        <Pressable
          onPress={handleJoinPress}
          style={[
            styles.joinBtn,
            isJoined ? styles.joinBtnActive : styles.joinBtnIdle,
          ]}>
          {isJoined ? (
            <>
              <AppIcon name="checkmark" size={13} color={Palette.white} />
              <Text style={styles.joinBtnTextActive}>Joined</Text>
            </>
          ) : (
            <>
              <AppIcon name="add" size={13} color={Palette.ink} />
              <Text style={styles.joinBtnTextIdle}>Join</Text>
            </>
          )}
        </Pressable>
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
    padding: Spacing.space3 + 2,
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
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.space2,
  },
  badgeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  categoryBadge: {
    backgroundColor: Palette.surfaceSubtle,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  categoryText: {
    ...Typography.supporting,
    fontSize: 11,
    fontWeight: '600',
    color: Palette.muted,
  },
  diffBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  diffText: {
    ...Typography.supporting,
    fontSize: 11,
    fontWeight: '700',
  },
  rewardTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Palette.surfaceHighlight,
    paddingHorizontal: 8,
    paddingVertical: 3,
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
  title: {
    ...Typography.cardHeading,
    fontSize: 16,
    color: Palette.ink,
    marginBottom: 4,
  },
  goalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: Spacing.space2 + 2,
  },
  goalText: {
    ...Typography.body,
    fontSize: 13,
    color: Palette.forest,
    fontWeight: '600',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingBottom: Spacing.space2 + 2,
    borderBottomWidth: 1,
    borderBottomColor: Palette.surfaceSubtle,
    marginBottom: Spacing.space2,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  metaText: {
    ...Typography.supporting,
    fontSize: 11.5,
    color: Palette.muted,
  },
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: Radius.full,
    backgroundColor: Palette.borderDark,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 2,
  },
  viewDetailsText: {
    ...Typography.supporting,
    fontSize: 12,
    fontWeight: '600',
    color: Palette.forest,
  },
  joinBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: Radius.btn,
  },
  joinBtnIdle: {
    backgroundColor: Palette.lime,
  },
  joinBtnActive: {
    backgroundColor: Palette.forest,
  },
  joinBtnTextIdle: {
    ...Typography.supporting,
    fontSize: 12,
    fontWeight: '700',
    color: Palette.ink,
  },
  joinBtnTextActive: {
    ...Typography.supporting,
    fontSize: 12,
    fontWeight: '700',
    color: Palette.white,
  },
});
