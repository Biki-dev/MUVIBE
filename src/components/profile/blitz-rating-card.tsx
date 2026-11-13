/**
 * src/components/profile/blitz-rating-card.tsx
 * ─────────────────────────────────────────────────────────────────
 * Blitz rating on the profile: current Elo, bracket, and the win
 * record behind it. Reads the on-device store, so it shows a real
 * number or an honest empty state, never a placeholder rating.
 * ─────────────────────────────────────────────────────────────────
 */

import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { FontFamily, Palette, Radius, Spacing, Typography } from '@/constants/theme';
import { AppIcon } from '@/components/ui/icon';
import { useAuth } from '@/context/auth-context';
import { BlitzRating, EMPTY_RATING, eloBracket, getRating } from '@/services/blitz-elo';

export function BlitzRatingCard() {
  const { user } = useAuth();
  const [rating, setRating] = useState<BlitzRating>(EMPTY_RATING);

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      getRating(user?.id).then((r) => {
        if (alive) setRating(r);
      });
      return () => {
        alive = false;
      };
    }, [user?.id])
  );

  const bracket = eloBracket(rating.elo);
  const played = rating.bouts > 0;
  const winRate = played ? Math.round((rating.wins / rating.bouts) * 100) : 0;
  const toNext = bracket.next ? bracket.next - rating.elo : 0;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <AppIcon name="flash" size={16} color={Palette.forest} />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.title}>Blitz Rating</Text>
          <Text style={styles.subtitle}>Head to head run and walk bouts</Text>
        </View>
      </View>

      <View style={styles.eloRow}>
        <View style={styles.eloBlock}>
          <Text style={styles.eloValue}>{rating.elo}</Text>
          <Text style={styles.eloUnit}>Elo</Text>
        </View>
        <View style={styles.bracketPill}>
          <Text style={styles.bracketText}>{bracket.name}</Text>
        </View>
      </View>

      {played ? (
        <>
          <View style={styles.statRow}>
            <View style={styles.statCell}>
              <Text style={styles.statValue}>{rating.wins}</Text>
              <Text style={styles.statLabel}>Won</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statCell}>
              <Text style={styles.statValue}>{rating.losses}</Text>
              <Text style={styles.statLabel}>Lost</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statCell}>
              <Text style={styles.statValue}>{winRate}%</Text>
              <Text style={styles.statLabel}>Win rate</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statCell}>
              <Text style={styles.statValue}>{rating.peakElo}</Text>
              <Text style={styles.statLabel}>Peak</Text>
            </View>
          </View>

          <Text style={styles.footNote}>
            {bracket.next
              ? `${toNext} Elo to ${eloBracket(bracket.next).name}`
              : 'Top bracket reached'}
            {' · '}
            {rating.bouts} bout{rating.bouts === 1 ? '' : 's'} played
          </Text>
        </>
      ) : (
        <Text style={styles.emptyNote}>
          No bouts yet. Win a Blitz on the Challenges tab to move this number.
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Palette.white,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Palette.border,
    padding: Spacing.space4,
    marginBottom: Spacing.space4,
    gap: Spacing.space3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.space3,
  },
  headerIcon: {
    width: 34,
    height: 34,
    borderRadius: Radius.sm,
    backgroundColor: Palette.lime,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
  },
  title: {
    ...Typography.cardHeading,
    color: Palette.ink,
  },
  subtitle: {
    ...Typography.supporting,
    color: Palette.muted,
  },

  eloRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  eloBlock: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  eloValue: {
    ...Typography.stats,
    color: Palette.forest,
  },
  eloUnit: {
    ...Typography.supporting,
    color: Palette.muted,
  },
  bracketPill: {
    paddingHorizontal: Spacing.space3,
    paddingVertical: 5,
    borderRadius: Radius.full,
    backgroundColor: Palette.surfaceSubtle,
  },
  bracketText: {
    fontSize: 12,
    fontFamily: FontFamily.bold,
    fontWeight: '700',
    color: Palette.forest,
  },

  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.space3,
    borderRadius: Radius.sm,
    backgroundColor: Palette.surfaceHighlight,
  },
  statCell: {
    flex: 1,
    alignItems: 'center',
    gap: 1,
  },
  statDivider: {
    width: 1,
    alignSelf: 'stretch',
    backgroundColor: Palette.border,
  },
  statValue: {
    ...Typography.bodyBold,
    fontSize: 17,
    color: Palette.ink,
  },
  statLabel: {
    ...Typography.supporting,
    fontSize: 11,
    color: Palette.muted,
  },
  footNote: {
    ...Typography.supporting,
    color: Palette.muted,
  },
  emptyNote: {
    ...Typography.supporting,
    color: Palette.muted,
  },
});
