import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Palette, Radius, Spacing, Typography } from '@/constants/theme';
import { IndividualRankItem } from '@/types/community';
import { AppIcon } from '@/components/ui/icon';

interface LeaderboardRowProps {
  item: IndividualRankItem;
}

export function LeaderboardRow({ item }: LeaderboardRowProps) {
  const renderMovement = () => {
    if (item.movement === 'up') {
      return (
        <View style={styles.movementWrap}>
          <AppIcon name="arrow-up" size={11} color={Palette.forest} />
          {item.movementValue && (
            <Text style={styles.movementTextUp}>{item.movementValue}</Text>
          )}
        </View>
      );
    }
    if (item.movement === 'down') {
      return (
        <View style={styles.movementWrap}>
          <AppIcon name="arrow-down" size={11} color={Palette.coral} />
          {item.movementValue && (
            <Text style={styles.movementTextDown}>{item.movementValue}</Text>
          )}
        </View>
      );
    }
    return <Text style={styles.movementSame}>-</Text>;
  };

  return (
    <View style={[styles.row, item.isCurrentUser && styles.currentUserRow]}>
      {/* Rank number & movement indicator */}
      <View style={styles.rankBlock}>
        <Text style={[styles.rankText, item.isCurrentUser && styles.currentUserText]}>
          #{item.rank}
        </Text>
        {renderMovement()}
      </View>

      {/* Avatar */}
      <View style={[styles.avatarCircle, { backgroundColor: item.avatarColor }]}>
        <Text style={styles.avatarEmoji}>{item.avatarEmoji}</Text>
      </View>

      {/* Name and Department */}
      <View style={styles.infoBlock}>
        <View style={styles.nameRow}>
          <Text
            style={[styles.name, item.isCurrentUser && styles.currentUserName]}
            numberOfLines={1}>
            {item.name}
          </Text>
          {item.isCurrentUser && (
            <View style={styles.youBadge}>
              <Text style={styles.youBadgeText}>YOU</Text>
            </View>
          )}
        </View>
        <Text style={styles.subtext} numberOfLines={1}>
          {item.department} • {item.metricLabel}
        </Text>
      </View>

      {/* Points */}
      <View style={styles.pointsBlock}>
        <Text style={[styles.pointsText, item.isCurrentUser && styles.currentUserText]}>
          {item.points.toLocaleString()}
        </Text>
        <Text style={styles.pointsLabel}>pts</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Palette.white,
    paddingVertical: 10,
    paddingHorizontal: Spacing.space3,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Palette.border,
    marginBottom: 6,
    gap: 10,
  },
  currentUserRow: {
    backgroundColor: Palette.surfaceHighlight,
    borderColor: Palette.lime,
    borderWidth: 1.5,
  },
  rankBlock: {
    width: 38,
    alignItems: 'center',
  },
  rankText: {
    ...Typography.bodyBold,
    fontSize: 13.5,
    color: Palette.ink,
  },
  currentUserText: {
    color: Palette.forest,
    fontWeight: '800',
  },
  movementWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 1,
    marginTop: 1,
  },
  movementTextUp: {
    fontSize: 9.5,
    fontWeight: '700',
    color: Palette.forest,
  },
  movementTextDown: {
    fontSize: 9.5,
    fontWeight: '700',
    color: Palette.coral,
  },
  movementSame: {
    fontSize: 11,
    color: Palette.muted,
  },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmoji: {
    fontSize: 17,
  },
  infoBlock: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  name: {
    ...Typography.bodyBold,
    fontSize: 13.5,
    color: Palette.ink,
  },
  currentUserName: {
    color: Palette.forest,
  },
  youBadge: {
    backgroundColor: Palette.lime,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: Radius.full,
  },
  youBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: Palette.ink,
  },
  subtext: {
    ...Typography.supporting,
    fontSize: 11,
    color: Palette.muted,
    marginTop: 1,
  },
  pointsBlock: {
    alignItems: 'flex-end',
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
