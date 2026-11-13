import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Palette, Radius, Spacing, Typography } from '@/constants/theme';
import { AppIcon } from '@/components/ui/icon';

interface MyRankingCardProps {
  rank: number;
  username: string;
  points: number;
  categoryLabel: string;
}

export function MyRankingCard({
  rank,
  username,
  points,
  categoryLabel,
}: MyRankingCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.leftCol}>
        <View style={styles.rankBadge}>
          <Text style={styles.rankText}>#{rank}</Text>
        </View>
        <View style={styles.textWrap}>
          <Text style={styles.title}>Your Ranking</Text>
          <Text style={styles.subtitle}>
            @{username} • {categoryLabel}
          </Text>
        </View>
      </View>

      <View style={styles.rightCol}>
        <View style={styles.pointsWrap}>
          <AppIcon name="trophy" size={14} color={Palette.amber} />
          <Text style={styles.pointsNumber}>{points.toLocaleString()}</Text>
        </View>
        <Text style={styles.pointsLabel}>campus pts</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Palette.forest,
    borderRadius: Radius.card,
    padding: Spacing.space3 + 2,
    marginTop: Spacing.space2,
    marginBottom: Spacing.space5,
    borderWidth: 1,
    borderColor: Palette.borderDark,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  leftCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rankBadge: {
    width: 36,
    height: 36,
    borderRadius: Radius.full,
    backgroundColor: Palette.lime,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankText: {
    ...Typography.bodyBold,
    fontSize: 14,
    color: Palette.ink,
    fontWeight: '800',
  },
  textWrap: {},
  title: {
    ...Typography.cardHeading,
    fontSize: 14,
    color: Palette.white,
    marginBottom: 2,
  },
  subtitle: {
    ...Typography.supporting,
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.75)',
  },
  rightCol: {
    alignItems: 'flex-end',
  },
  pointsWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  pointsNumber: {
    ...Typography.stats,
    fontSize: 18,
    color: Palette.lime,
  },
  pointsLabel: {
    ...Typography.supporting,
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.75)',
  },
});
