import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Palette, Radius, Spacing, Typography } from '@/constants/theme';
import { AppIcon } from '@/components/ui/icon';
import { CommunityClub } from '@/types/community';

interface CampusClubsLeaderboardProps {
  clubs: CommunityClub[];
}

export function CampusClubsLeaderboard({ clubs }: CampusClubsLeaderboardProps) {
  const router = useRouter();

  if (!clubs || clubs.length === 0) {
    return null;
  }

  // Sorted by totalPoints descending
  const sorted = [...clubs].sort((a, b) => b.totalPoints - a.totalPoints);

  const getRankBadge = (rank: number) => {
    if (rank === 1) return { bg: '#FEF3C7', color: '#D97706', label: '1ST' };
    if (rank === 2) return { bg: '#F1F5F9', color: '#64748B', label: '2ND' };
    if (rank === 3) return { bg: '#FFEDD5', color: '#C2410C', label: '3RD' };
    return { bg: Palette.surfaceSubtle, color: Palette.muted, label: `#${rank}` };
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerBlock}>
        <View style={styles.titleRow}>
          <AppIcon name="trophy" size={18} color={Palette.forest} />
          <Text style={styles.title}>Campus Club Standings</Text>
        </View>
        <Text style={styles.subtitle}>
          Which club is moving the most? Real-time club rankings across campus.
        </Text>
      </View>

      <View style={styles.listCard}>
        {sorted.map((club, idx) => {
          const rank = idx + 1;
          const badge = getRankBadge(rank);
          const isTop3 = rank <= 3;

          return (
            <Pressable
              key={club.id}
              onPress={() => router.push(`/club/${club.id}` as any)}
              style={({ pressed }) => [
                styles.itemRow,
                idx > 0 && styles.itemBorder,
                pressed && styles.itemPressed,
              ]}>
              {/* Rank Badge */}
              <View style={[styles.rankBox, { backgroundColor: badge.bg }]}>
                <Text style={[styles.rankText, { color: badge.color }]}>{badge.label}</Text>
              </View>

              {/* Club Info */}
              <View style={styles.clubInfoWrap}>
                <View style={styles.clubNameRow}>
                  <Text style={styles.clubName} numberOfLines={1}>
                    {club.name}
                  </Text>
                  {club.joined && (
                    <View style={styles.joinedPill}>
                      <Text style={styles.joinedPillText}>Your Club</Text>
                    </View>
                  )}
                </View>

                <View style={styles.statsMetaRow}>
                  <Text style={styles.categoryText}>{club.categoryLabel}</Text>
                  <Text style={styles.dotSeparator}>•</Text>
                  <Text style={styles.metaStat}>{club.memberCount} members</Text>
                  <Text style={styles.dotSeparator}>•</Text>
                  <Text style={styles.metaStat}>{club.totalDistanceKm} km</Text>
                </View>
              </View>

              {/* Score / Points */}
              <View style={styles.scoreWrap}>
                <Text style={[styles.scoreValue, isTop3 && styles.scoreValueTop]}>
                  {club.totalPoints.toLocaleString()}
                </Text>
                <Text style={styles.scoreLabel}>pts</Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: Spacing.space5,
    marginBottom: Spacing.space6,
  },
  headerBlock: {
    marginBottom: Spacing.space3,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  title: {
    ...Typography.sectionHeading,
    color: Palette.ink,
  },
  subtitle: {
    ...Typography.body,
    fontSize: 13,
    color: Palette.muted,
  },
  listCard: {
    backgroundColor: Palette.white,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Palette.border,
    overflow: 'hidden',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.space3 + 2,
    paddingVertical: Spacing.space3,
    gap: 12,
  },
  itemBorder: {
    borderTopWidth: 1,
    borderTopColor: Palette.border,
  },
  itemPressed: {
    backgroundColor: Palette.surfaceHighlight,
  },
  rankBox: {
    width: 36,
    height: 36,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankText: {
    ...Typography.bodyBold,
    fontSize: 12,
    fontWeight: '800',
  },
  clubInfoWrap: {
    flex: 1,
  },
  clubNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 3,
  },
  clubName: {
    ...Typography.cardHeading,
    fontSize: 14,
    color: Palette.ink,
    flexShrink: 1,
  },
  joinedPill: {
    backgroundColor: 'rgba(197, 243, 107, 0.3)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: Radius.full,
  },
  joinedPillText: {
    ...Typography.supporting,
    fontSize: 10,
    fontWeight: '700',
    color: Palette.forest,
  },
  statsMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  categoryText: {
    ...Typography.supporting,
    fontSize: 11,
    color: Palette.forest,
    fontWeight: '600',
  },
  dotSeparator: {
    color: Palette.border,
    fontSize: 10,
  },
  metaStat: {
    ...Typography.supporting,
    fontSize: 11,
    color: Palette.muted,
  },
  scoreWrap: {
    alignItems: 'flex-end',
  },
  scoreValue: {
    ...Typography.stats,
    fontSize: 15,
    color: Palette.ink,
  },
  scoreValueTop: {
    color: Palette.forest,
    fontWeight: '800',
  },
  scoreLabel: {
    ...Typography.supporting,
    fontSize: 10,
    color: Palette.muted,
  },
});
