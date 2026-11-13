import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Game, Palette, Typography, FontFamily } from '@/constants/theme';

/**
 * XP bar drawn as running-track lane markings: ten hard-edged segments
 * with gaps, not one smooth pill. A partially filled segment is clipped,
 * so the bar reads as a measured scale rather than a soft progress blob.
 */
interface XpBarProps {
  /** 0 to 1. */
  progress: number;
  color?: string;
  trackColor?: string;
  /** Shows "420 / 980 XP" under the bar. */
  xpIntoLevel?: number;
  xpForThisLevel?: number;
  compact?: boolean;
}

export function XpBar({
  progress,
  color = Palette.lime,
  trackColor = Palette.surfaceSubtle,
  xpIntoLevel,
  xpForThisLevel,
  compact = false,
}: XpBarProps) {
  const clamped = Math.max(0, Math.min(1, progress));
  const filled = clamped * Game.xpSegments;

  return (
    <View>
      <View style={[styles.track, compact && styles.trackCompact]}>
        {Array.from({ length: Game.xpSegments }).map((_, i) => {
          // How much of this one segment is filled: 1, a fraction, or 0.
          const amount = Math.max(0, Math.min(1, filled - i));
          return (
            <View
              key={i}
              style={[
                styles.segment,
                { backgroundColor: trackColor },
                compact && styles.segmentCompact,
              ]}>
              {amount > 0 && (
                <View
                  style={[
                    styles.fill,
                    { backgroundColor: color, width: `${amount * 100}%` },
                  ]}
                />
              )}
            </View>
          );
        })}
      </View>

      {xpIntoLevel != null && xpForThisLevel != null && (
        <Text style={styles.caption}>
          {xpIntoLevel.toLocaleString()} / {xpForThisLevel.toLocaleString()} XP
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    gap: 3,
    height: Game.barHeight,
  },
  trackCompact: {
    height: 6,
    gap: 2,
  },
  segment: {
    flex: 1,
    height: '100%',
    borderRadius: Game.barRadius,
    overflow: 'hidden',
  },
  segmentCompact: {
    borderRadius: 2,
  },
  fill: {
    height: '100%',
    borderRadius: Game.barRadius,
  },
  caption: {
    ...Typography.supporting,
    fontFamily: FontFamily.medium,
    fontSize: 11.5,
    color: Palette.muted,
    marginTop: 6,
    fontVariant: ['tabular-nums'],
  },
});
