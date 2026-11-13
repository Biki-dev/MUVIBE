import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Palette, Typography, FontFamily, Tier } from '@/constants/theme';

/**
 * Rank plate: the level number stencilled on a clipped-corner shield.
 *
 * The notched corners are the motif that ties the gamified pieces
 * together, borrowed from team kit numbering rather than the usual
 * circular badge with a glow.
 */
interface RankPlateProps {
  level: number;
  tier: Tier;
  size?: number;
}

export function RankPlate({ level, tier, size = 64 }: RankPlateProps) {
  // Shield with the top two corners squared and the bottom drawn to a
  // shallow point, in a 100x110 box.
  const d = 'M6,0 H94 A6,6 0 0 1 100,6 V68 Q100,86 50,110 Q0,86 0,68 V6 A6,6 0 0 1 6,0 Z';
  const height = size * 1.1;

  return (
    <View style={[styles.wrap, { width: size, height }]}>
      <Svg width={size} height={height} viewBox="0 0 100 110">
        <Path d={d} fill={tier.color} />
        <Path d={d} fill="none" stroke={Palette.forest} strokeWidth={4} />
      </Svg>

      <View style={styles.content} pointerEvents="none">
        <Text style={[styles.lvl, { color: tier.onColor, fontSize: size * 0.17 }]}>LVL</Text>
        <Text style={[styles.number, { color: tier.onColor, fontSize: size * 0.48 }]}>
          {level}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: '12%',
  },
  lvl: {
    fontFamily: FontFamily.bold,
    letterSpacing: 1.2,
    opacity: 0.75,
    marginBottom: -2,
  },
  number: {
    fontFamily: FontFamily.bold,
    letterSpacing: -1,
    fontVariant: ['tabular-nums'],
  },
});

/** Inline tier label. Square-cut, not a rounded pill. */
export function TierChip({ tier, muted = false }: { tier: Tier; muted?: boolean }) {
  return (
    <View
      style={[
        chip.base,
        muted
          ? { backgroundColor: Palette.surfaceSubtle, borderColor: Palette.border }
          : { backgroundColor: tier.color, borderColor: tier.color },
      ]}>
      <Text
        style={[
          chip.text,
          { color: muted ? Palette.muted : tier.onColor },
        ]}>
        {tier.label}
      </Text>
    </View>
  );
}

const chip = StyleSheet.create({
  base: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  text: {
    ...Typography.supporting,
    fontFamily: FontFamily.bold,
    fontSize: 10.5,
    letterSpacing: 1.3,
    textTransform: 'uppercase',
  },
});
