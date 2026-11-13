import React from 'react';
import { View, StyleSheet, ViewStyle, Pressable, StyleProp } from 'react-native';
import { Palette, Radius, Spacing } from '@/constants/theme';

export type CardVariant = 'white' | 'forest' | 'highlight' | 'subtle';

interface CardProps {
  children: React.ReactNode;
  variant?: CardVariant;
  largeRadius?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

export function Card({
  children,
  variant = 'white',
  largeRadius = false,
  onPress,
  style,
}: CardProps) {
  const cardStyles = [
    styles.card,
    styles[variant],
    largeRadius ? styles.largeRadius : styles.standardRadius,
    style,
  ];

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [...cardStyles, pressed && styles.pressed]}>
        {children}
      </Pressable>
    );
  }

  return <View style={cardStyles}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    padding: Spacing.space4,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  standardRadius: {
    borderRadius: Radius.card, // 18px
  },
  largeRadius: {
    borderRadius: Radius.lg, // 24px
  },
  white: {
    backgroundColor: Palette.white,
    borderColor: Palette.border,
  },
  forest: {
    backgroundColor: Palette.forest,
    borderColor: Palette.borderDark,
  },
  highlight: {
    backgroundColor: Palette.surfaceHighlight,
    borderColor: Palette.lime,
  },
  subtle: {
    backgroundColor: Palette.surfaceSubtle,
    borderColor: Palette.border,
  },
  pressed: {
    opacity: 0.93,
    transform: [{ scale: 0.995 }],
  },
});
