import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { Palette, Radius, Spacing, Typography } from '@/constants/theme';

export type BadgeVariant = 'lime' | 'forest' | 'neutral' | 'blue' | 'amber' | 'coral';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function Badge({
  label,
  variant = 'neutral',
  icon,
  style,
  textStyle,
}: BadgeProps) {
  return (
    <View style={[styles.badge, styles[variant], style]}>
      {icon && <View style={styles.icon}>{icon}</View>}
      <Text style={[styles.text, styles[`text_${variant}`], textStyle]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.space2 + 2,
    paddingVertical: Spacing.space1,
    borderRadius: Radius.full,
    alignSelf: 'flex-start',
  },
  icon: {
    marginRight: Spacing.space1,
  },
  text: {
    ...Typography.supporting,
    fontSize: 11.5,
    fontWeight: '600',
  },
  lime: {
    backgroundColor: Palette.lime,
  },
  text_lime: {
    color: Palette.ink,
  },
  forest: {
    backgroundColor: Palette.forest,
  },
  text_forest: {
    color: Palette.white,
  },
  neutral: {
    backgroundColor: Palette.surfaceSubtle,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  text_neutral: {
    color: Palette.ink,
  },
  blue: {
    backgroundColor: 'rgba(82, 121, 246, 0.12)',
  },
  text_blue: {
    color: Palette.electricBlue,
  },
  amber: {
    backgroundColor: 'rgba(232, 163, 74, 0.15)',
  },
  text_amber: {
    color: '#8A5812',
  },
  coral: {
    backgroundColor: 'rgba(229, 108, 103, 0.12)',
  },
  text_coral: {
    color: Palette.coral,
  },
});
