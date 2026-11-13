import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Palette, Radius, Spacing, Typography, FontFamily } from '@/constants/theme';
import { AppIcon } from '@/components/ui/icon';
import { ClubMemberRankItem } from '@/types/community';

interface ClubLeaderboardTabProps {
  members: ClubMemberRankItem[];
  isJoined: boolean;
  onJoinPress: () => void;
}

export function ClubLeaderboardTab({ members, isJoined, onJoinPress }: ClubLeaderboardTabProps) {
  if (!isJoined) {
    return (
      <View style={styles.notJoinedContainer}>
        <View style={styles.lockIconCircle}>
          <AppIcon name="lock-closed" size={24} color={Palette.forest} />
        </View>
        <Text style={styles.notJoinedTitle}>Member Leaderboard Locked</Text>
        <Text style={styles.notJoinedSubtitle}>
          Join this club to compete with fellow members, track your club points, and climb the ranks!
        </Text>
      </View>
    );
  }

  if (!members || members.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <AppIcon name="trophy-outline" size={32} color={Palette.muted} />
        <Text style={styles.emptyTitle}>No Club Activity Yet</Text>
        <Text style={styles.emptySubtitle}>
          Log physical activities in MUVIBE to earn club points and claim the top rank!
        </Text>
      </View>
    );
  }

  const getRankBadge = (rank: number) => {
    if (rank === 1) return { bg: '#FEF3C7', color: '#D97706', label: '1ST' };
    if (rank === 2) return { bg: '#F1F5F9', color: '#64748B', label: '2ND' };
    if (rank === 3) return { bg: '#FFEDD5', color: '#C2410C', label: '3RD' };
    return { bg: Palette.surfaceSubtle, color: Palette.muted, label: `#${rank}` };
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.sectionHeading}>Club Member Standings</Text>
        <Text style={styles.memberCountNote}>{members.length} active athletes</Text>
      </View>

      <View style={styles.listCard}>
        {members.map((item, idx) => {
          const badge = getRankBadge(item.rank);
          const isTop3 = item.rank <= 3;

          return (
            <View
              key={item.userId}
              style={[
                styles.memberRow,
                idx > 0 && styles.rowBorder,
                item.isCurrentUser && styles.currentUserRow,
              ]}>
              {/* Rank Badge */}
              <View style={[styles.rankBox, { backgroundColor: badge.bg }]}>
                <Text style={[styles.rankText, { color: badge.color }]}>{badge.label}</Text>
              </View>

              {/* Avatar */}
              <View style={[styles.avatar, { backgroundColor: item.avatarColor }]}>
                <Text style={styles.avatarEmoji}>{item.avatarEmoji}</Text>
              </View>

              {/* Member Details */}
              <View style={styles.infoCol}>
                <View style={styles.nameRow}>
                  <Text style={styles.memberName} numberOfLines={1}>
                    {item.name}
                  </Text>
                  {item.role === 'admin' && (
                    <View style={styles.adminBadge}>
                      <Text style={styles.adminBadgeText}>LEAD</Text>
                    </View>
                  )}
                  {item.isCurrentUser && (
                    <View style={styles.youBadge}>
                      <Text style={styles.youBadgeText}>YOU</Text>
                    </View>
                  )}
                </View>

                {/* Full Stats Row */}
                <View style={styles.statsRow}>
                  <View style={styles.statChip}>
                    <AppIcon name="navigate-outline" size={11} color={Palette.forest} />
                    <Text style={styles.statChipText}>{item.distanceKm.toFixed(1)} km</Text>
                  </View>
                  <View style={styles.statChip}>
                    <AppIcon name="barbell-outline" size={11} color={Palette.electricBlue} />
                    <Text style={styles.statChipText}>{item.activitiesCount} logs</Text>
                  </View>
                  {item.steps > 0 && (
                    <View style={styles.statChip}>
                      <AppIcon name="footsteps-outline" size={11} color={Palette.muted} />
                      <Text style={styles.statChipText}>{item.steps.toLocaleString()}</Text>
                    </View>
                  )}
                </View>
              </View>

              {/* Points Score */}
              <View style={styles.pointsCol}>
                <Text style={[styles.pointsVal, isTop3 && styles.pointsValTop]}>
                  {item.points.toLocaleString()}
                </Text>
                <Text style={styles.pointsUnit}>club pts</Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: Spacing.space2,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.space3,
  },
  sectionHeading: {
    ...Typography.sectionHeading,
    fontSize: 16,
    color: Palette.ink,
  },
  memberCountNote: {
    ...Typography.supporting,
    fontSize: 12,
    color: Palette.muted,
  },
  listCard: {
    backgroundColor: Palette.white,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Palette.border,
    overflow: 'hidden',
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.space3,
    paddingVertical: Spacing.space3,
    gap: 10,
  },
  rowBorder: {
    borderTopWidth: 1,
    borderTopColor: Palette.border,
  },
  currentUserRow: {
    backgroundColor: 'rgba(197, 243, 107, 0.12)',
  },
  rankBox: {
    width: 32,
    height: 32,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankText: {
    ...Typography.bodyBold,
    fontSize: 11,
    fontWeight: '800',
    fontFamily: FontFamily.bold,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmoji: {
    fontSize: 18,
    fontFamily: FontFamily.regular,
  },
  infoCol: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  memberName: {
    ...Typography.cardHeading,
    fontSize: 13.5,
    color: Palette.ink,
    flexShrink: 1,
  },
  adminBadge: {
    backgroundColor: Palette.forest,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  adminBadgeText: {
    ...Typography.supporting,
    color: Palette.lime,
    fontSize: 9,
    fontWeight: '800',
    fontFamily: FontFamily.bold,
  },
  youBadge: {
    backgroundColor: Palette.lime,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  youBadgeText: {
    ...Typography.supporting,
    color: Palette.ink,
    fontSize: 9,
    fontWeight: '800',
    fontFamily: FontFamily.bold,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  statChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: Palette.surfaceHighlight,
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  statChipText: {
    ...Typography.supporting,
    fontSize: 10.5,
    color: Palette.ink,
    fontWeight: '600',
    fontFamily: FontFamily.medium,
  },
  pointsCol: {
    alignItems: 'flex-end',
    minWidth: 55,
  },
  pointsVal: {
    ...Typography.stats,
    fontSize: 15,
    color: Palette.ink,
  },
  pointsValTop: {
    color: Palette.forest,
    fontWeight: '800',
    fontFamily: FontFamily.bold,
  },
  pointsUnit: {
    ...Typography.supporting,
    fontSize: 10,
    color: Palette.muted,
  },
  notJoinedContainer: {
    backgroundColor: Palette.white,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Palette.border,
    padding: Spacing.space5,
    alignItems: 'center',
    marginVertical: Spacing.space3,
  },
  lockIconCircle: {
    width: 50,
    height: 50,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(24, 53, 45, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.space3,
  },
  notJoinedTitle: {
    ...Typography.sectionHeading,
    fontSize: 16,
    color: Palette.ink,
    marginBottom: 6,
    textAlign: 'center',
  },
  notJoinedSubtitle: {
    ...Typography.body,
    fontSize: 13,
    color: Palette.muted,
    textAlign: 'center',
    lineHeight: 18,
  },
  emptyContainer: {
    backgroundColor: Palette.white,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Palette.border,
    padding: Spacing.space5,
    alignItems: 'center',
    marginVertical: Spacing.space3,
  },
  emptyTitle: {
    ...Typography.cardHeading,
    fontSize: 15,
    color: Palette.ink,
    marginTop: Spacing.space2,
    marginBottom: 4,
  },
  emptySubtitle: {
    ...Typography.body,
    fontSize: 13,
    color: Palette.muted,
    textAlign: 'center',
  },
});
