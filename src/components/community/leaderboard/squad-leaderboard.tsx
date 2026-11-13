import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Palette, Radius, Spacing, Typography } from '@/constants/theme';
import { SquadRankItem } from '@/types/community';
import { AppIcon } from '@/components/ui/icon';

interface SquadLeaderboardProps {
  squads: SquadRankItem[];
}

export function SquadLeaderboard({ squads }: SquadLeaderboardProps) {
  return (
    <View style={styles.container}>
      {squads.map((squad) => (
        <View
          key={squad.id}
          style={[styles.card, squad.isUserSquad && styles.userSquadCard]}>
          <View style={styles.headerRow}>
            <View style={styles.rankBadge}>
              <Text style={styles.rankNum}>#{squad.rank}</Text>
            </View>

            <View style={styles.nameBlock}>
              <View style={styles.titleRow}>
                <Text style={styles.squadName} numberOfLines={1}>
                  {squad.name}
                </Text>
                {squad.isUserSquad && (
                  <View style={styles.yourSquadBadge}>
                    <Text style={styles.yourSquadText}>YOUR SQUAD</Text>
                  </View>
                )}
              </View>
              <Text style={styles.subtext}>
                {squad.memberCount} members • {squad.totalActivityFormatted}
              </Text>
            </View>

            <View style={styles.pointsWrap}>
              <View style={styles.pointsRow}>
                <AppIcon name="trophy" size={13} color={Palette.amber} />
                <Text style={styles.pointsText}>{squad.totalPoints.toLocaleString()}</Text>
              </View>
              <Text style={styles.pointsLabel}>pts</Text>
            </View>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.space4,
  },
  card: {
    backgroundColor: Palette.white,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Palette.border,
    padding: Spacing.space3 + 2,
    marginBottom: Spacing.space3,
  },
  userSquadCard: {
    borderColor: Palette.lime,
    borderWidth: 1.5,
    backgroundColor: Palette.surfaceHighlight,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  rankBadge: {
    width: 32,
    height: 32,
    borderRadius: Radius.full,
    backgroundColor: Palette.forest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankNum: {
    ...Typography.bodyBold,
    fontSize: 12.5,
    color: Palette.white,
  },
  nameBlock: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  squadName: {
    ...Typography.cardHeading,
    fontSize: 14.5,
    color: Palette.ink,
  },
  yourSquadBadge: {
    backgroundColor: Palette.lime,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: Radius.full,
  },
  yourSquadText: {
    fontSize: 9,
    fontWeight: '800',
    color: Palette.ink,
  },
  subtext: {
    ...Typography.supporting,
    fontSize: 11.5,
    color: Palette.muted,
    marginTop: 1,
  },
  pointsWrap: {
    alignItems: 'flex-end',
  },
  pointsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  pointsText: {
    ...Typography.bodyBold,
    fontSize: 14,
    color: Palette.ink,
  },
  pointsLabel: {
    ...Typography.supporting,
    fontSize: 10,
    color: Palette.muted,
  },
});
