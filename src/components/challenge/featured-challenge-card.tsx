import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Palette, Radius, Spacing, Typography } from '@/constants/theme';
import { AppIcon } from '@/components/ui/icon';
import { Challenge } from '@/types/challenge';

interface FeaturedChallengeCardProps {
  challenge: Challenge;
  onJoin: (id: string) => void;
}

export function FeaturedChallengeCard({
  challenge,
  onJoin,
}: FeaturedChallengeCardProps) {
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

  return (
    <Pressable
      onPress={handleCardPress}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}>
      {/* Top Banner Area with Pattern & Badges */}
      <View style={styles.banner}>
        <View style={styles.badgeRow}>
          <View style={styles.featuredBadge}>
            <AppIcon name="sparkles" size={12} color={Palette.ink} />
            <Text style={styles.featuredBadgeText}>FEATURED CHALLENGE</Text>
          </View>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryBadgeText}>Campus</Text>
          </View>
        </View>

        <Text style={styles.title}>{challenge.title}</Text>
        <Text style={styles.description} numberOfLines={2}>
          {challenge.description}
        </Text>
      </View>

      {/* Target & Reward Info Row */}
      <View style={styles.infoRow}>
        <View style={styles.infoCol}>
          <Text style={styles.infoLabel}>Goal</Text>
          <View style={styles.infoValueWrap}>
            <AppIcon name="flag-outline" size={14} color={Palette.forest} />
            <Text style={styles.infoValue}>{challenge.goalFormatted}</Text>
          </View>
        </View>

        <View style={styles.infoDivider} />

        <View style={styles.infoCol}>
          <Text style={styles.infoLabel}>Reward</Text>
          <View style={styles.infoValueWrap}>
            <AppIcon name="trophy-outline" size={14} color={Palette.amber} />
            <Text style={styles.infoValue}>{challenge.rewardPoints} points</Text>
          </View>
        </View>

        <View style={styles.infoDivider} />

        <View style={styles.infoCol}>
          <Text style={styles.infoLabel}>Ends</Text>
          <View style={styles.infoValueWrap}>
            <AppIcon name="time-outline" size={14} color={Palette.muted} />
            <Text style={styles.infoValue}>Sunday</Text>
          </View>
        </View>
      </View>

      {/* Action Footer */}
      <View style={styles.footer}>
        <View style={styles.participantsWrap}>
          <AppIcon name="people-outline" size={14} color={Palette.muted} />
          <Text style={styles.participantsText}>
            {challenge.participantsCount.toLocaleString()} participating
          </Text>
        </View>

        <Pressable
          onPress={handleJoinPress}
          style={[
            styles.joinButton,
            isJoined ? styles.joinButtonActive : styles.joinButtonIdle,
          ]}>
          {isJoined ? (
            <>
              <AppIcon name="checkmark" size={14} color={Palette.white} />
              <Text style={styles.joinTextActive}>Joined</Text>
            </>
          ) : (
            <>
              <AppIcon name="add" size={14} color={Palette.ink} />
              <Text style={styles.joinTextIdle}>Join Challenge</Text>
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
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Palette.border,
    overflow: 'hidden',
    marginBottom: Spacing.space5,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 2,
  },
  cardPressed: {
    transform: [{ scale: 0.995 }],
  },
  banner: {
    backgroundColor: Palette.forest,
    padding: Spacing.space4,
    paddingTop: Spacing.space4 + 2,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: Spacing.space2 + 2,
  },
  featuredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Palette.lime,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  featuredBadgeText: {
    ...Typography.supporting,
    fontSize: 10.5,
    fontWeight: '800',
    color: Palette.ink,
    letterSpacing: 0.5,
  },
  categoryBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  categoryBadgeText: {
    ...Typography.supporting,
    fontSize: 11,
    fontWeight: '600',
    color: Palette.white,
  },
  title: {
    ...Typography.pageTitle,
    fontSize: 22,
    lineHeight: 28,
    color: Palette.white,
    fontWeight: '800',
    marginBottom: 6,
  },
  description: {
    ...Typography.body,
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.85)',
    lineHeight: 18,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.space4,
    paddingVertical: Spacing.space3,
    backgroundColor: Palette.surfaceHighlight,
    borderBottomWidth: 1,
    borderBottomColor: Palette.border,
  },
  infoCol: {
    flex: 1,
  },
  infoLabel: {
    ...Typography.supporting,
    fontSize: 11,
    color: Palette.muted,
    marginBottom: 2,
  },
  infoValueWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  infoValue: {
    ...Typography.bodyBold,
    fontSize: 12.5,
    color: Palette.ink,
  },
  infoDivider: {
    width: 1,
    height: 24,
    backgroundColor: Palette.border,
    marginHorizontal: 4,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.space4,
    paddingVertical: Spacing.space3,
  },
  participantsWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  participantsText: {
    ...Typography.supporting,
    fontSize: 12,
    color: Palette.muted,
  },
  joinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: Radius.btn,
  },
  joinButtonIdle: {
    backgroundColor: Palette.lime,
  },
  joinButtonActive: {
    backgroundColor: Palette.forest,
  },
  joinTextIdle: {
    ...Typography.supporting,
    fontSize: 12.5,
    fontWeight: '700',
    color: Palette.ink,
  },
  joinTextActive: {
    ...Typography.supporting,
    fontSize: 12.5,
    fontWeight: '700',
    color: Palette.white,
  },
});
