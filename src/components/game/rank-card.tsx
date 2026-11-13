import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Palette, Radius, Spacing, Typography, FontFamily, Game } from '@/constants/theme';
import { AppIcon } from '@/components/ui/icon';
import { RankPlate, TierChip } from './rank-plate';
import { XpBar } from './xp-bar';
import { StatReadout } from './stat-readout';
import { getAllActivities, subscribeToActivities } from '@/services/activity-storage';
import { computeStreak } from '@/services/activity-stats';
import { progressionFromActivities, tierHint, Progression } from '@/services/gamification';
import { ActivityRecord } from '@/types/activity';

/**
 * The one hero moment on Profile. Everything else on that screen stays
 * quiet so this card carries the weight: rank plate, tier, XP lane bar,
 * then a scoreboard row.
 *
 * XP is lifetime points from the same engine the leaderboards use, so a
 * level here can never disagree with a rank there.
 */
export function RankCard() {
  const [progression, setProgression] = useState<Progression | null>(null);
  const [streak, setStreak] = useState(0);
  const [totalActivities, setTotalActivities] = useState(0);

  const load = useCallback(async () => {
    const activities: ActivityRecord[] = await getAllActivities();

    setProgression(
      progressionFromActivities(
        activities.map((a) => ({
          startedAt: a.startedAt,
          durationSeconds: a.durationSeconds,
          distanceKm: a.distanceKm,
          steps: a.steps,
          calories: a.calories,
        }))
      )
    );
    setStreak(computeStreak(activities).currentStreak);
    setTotalActivities(activities.length);
  }, []);

  useEffect(() => {
    load();
    return subscribeToActivities(load);
  }, [load]);

  if (!progression) return null;

  const p = progression;

  return (
    <View style={styles.card}>
      {/* Lane stripe: a single flat accent edge, no gradient or glow. */}
      <View style={[styles.stripe, { backgroundColor: p.tier.color }]} />

      <View style={styles.top}>
        <RankPlate level={p.level} tier={p.tier} size={62} />

        <View style={styles.topText}>
          <View style={styles.tierRow}>
            <TierChip tier={p.tier} />
            {p.nextTier && (
              <Text style={styles.hint} numberOfLines={1}>
                {tierHint(p)}
              </Text>
            )}
          </View>

          <Text style={styles.xpTotal}>
            {p.xp.toLocaleString()}
            <Text style={styles.xpTotalUnit}> XP earned</Text>
          </Text>

          <XpBar
            progress={p.progress}
            color={p.tier.color}
            trackColor={Palette.borderDark}
            xpIntoLevel={p.xpIntoLevel}
            xpForThisLevel={p.xpForThisLevel}
          />
        </View>
      </View>

      <View style={styles.scoreboard}>
        <StatReadout label="Streak" value={streak} unit={streak === 1 ? 'day' : 'days'} onDark />
        <View style={styles.divider} />
        <StatReadout label="Sessions" value={totalActivities} onDark />
        <View style={styles.divider} />
        <StatReadout
          label="Next rank"
          value={p.nextTier ? p.nextTier.label : 'Max'}
          onDark
          accent={p.nextTier ? p.nextTier.color : Palette.lime}
        />
      </View>

      {streak >= 3 && (
        <View style={styles.streakNote}>
          <AppIcon name="flame" type="lucide" size={13} color={Palette.amber} />
          <Text style={styles.streakNoteText}>
            {streak} days running. Keep it alive to hold your multiplier.
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Palette.forest,
    borderRadius: Radius.lg,
    padding: Spacing.space4,
    paddingLeft: Spacing.space4 + 4,
    marginBottom: Spacing.space5,
    overflow: 'hidden',
  },
  stripe: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  top: {
    flexDirection: 'row',
    gap: Spacing.space4,
    alignItems: 'center',
    marginBottom: Spacing.space4,
  },
  topText: {
    flex: 1,
  },
  tierRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.space2,
    marginBottom: 6,
  },
  hint: {
    ...Typography.supporting,
    fontFamily: FontFamily.medium,
    fontSize: 11.5,
    color: 'rgba(245, 247, 242, 0.55)',
    flexShrink: 1,
  },
  xpTotal: {
    fontFamily: FontFamily.bold,
    fontSize: Game.numerals.fontSize,
    lineHeight: Game.numerals.lineHeight,
    letterSpacing: Game.numerals.letterSpacing,
    fontVariant: Game.numerals.fontVariant,
    color: Palette.white,
    marginBottom: Spacing.space2 + 2,
  },
  xpTotalUnit: {
    ...Typography.supporting,
    fontFamily: FontFamily.medium,
    fontSize: 12.5,
    letterSpacing: 0,
    color: 'rgba(245, 247, 242, 0.55)',
  },
  scoreboard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.space3,
    paddingTop: Spacing.space3,
    borderTopWidth: 1,
    borderTopColor: 'rgba(245, 247, 242, 0.12)',
  },
  divider: {
    width: 1,
    alignSelf: 'stretch',
    backgroundColor: 'rgba(245, 247, 242, 0.12)',
  },
  streakNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: Spacing.space3,
    paddingTop: Spacing.space3,
    borderTopWidth: 1,
    borderTopColor: 'rgba(245, 247, 242, 0.12)',
  },
  streakNoteText: {
    ...Typography.supporting,
    fontSize: 12,
    color: 'rgba(245, 247, 242, 0.75)',
    flexShrink: 1,
  },
});
