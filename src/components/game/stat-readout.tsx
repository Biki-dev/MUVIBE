import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Game, Palette, Typography, FontFamily } from '@/constants/theme';

/**
 * Scoreboard readout: a stencilled label over a large tabular numeral,
 * separated by a rule. Left aligned and flat, so a row of these reads
 * like a scoreboard rather than a grid of identical bubble cards.
 */
interface StatReadoutProps {
  label: string;
  value: string | number;
  unit?: string;
  accent?: string;
  /** Dark surface, for use inside the forest hero card. */
  onDark?: boolean;
  style?: ViewStyle;
}

export function StatReadout({
  label,
  value,
  unit,
  accent,
  onDark = false,
  style,
}: StatReadoutProps) {
  const labelColor = onDark ? 'rgba(245, 247, 242, 0.55)' : Palette.muted;
  const valueColor = accent ?? (onDark ? Palette.white : Palette.ink);
  const ruleColor = onDark ? 'rgba(245, 247, 242, 0.15)' : Palette.border;

  return (
    <View style={[styles.wrap, style]}>
      <Text style={[styles.label, { color: labelColor }]}>{label}</Text>
      <View style={[styles.rule, { backgroundColor: ruleColor }]} />
      <View style={styles.valueRow}>
        <Text style={[styles.value, { color: valueColor }]}>{value}</Text>
        {unit ? <Text style={[styles.unit, { color: labelColor }]}>{unit}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
  },
  label: {
    ...Typography.supporting,
    fontFamily: FontFamily.medium,
    fontSize: Game.stencil.fontSize,
    letterSpacing: Game.stencil.letterSpacing,
    textTransform: Game.stencil.textTransform,
    marginBottom: 5,
  },
  rule: {
    height: 1,
    marginBottom: 7,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 3,
  },
  value: {
    fontFamily: FontFamily.bold,
    fontSize: 26,
    lineHeight: 30,
    letterSpacing: -0.8,
    fontVariant: ['tabular-nums'],
  },
  unit: {
    ...Typography.supporting,
    fontFamily: FontFamily.medium,
    fontSize: 11.5,
  },
});
