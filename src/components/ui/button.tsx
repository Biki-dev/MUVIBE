import React from 'react';
import {
  Pressable,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  View,
  StyleProp,
} from 'react-native';
import { Palette, Radius, Spacing, Typography } from '@/constants/theme';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'coral';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  fullWidth?: boolean;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
  style,
  textStyle,
  fullWidth = true,
}: ButtonProps) {
  const isInteractive = !disabled && !loading;

  return (
    <Pressable
      onPress={isInteractive ? onPress : undefined}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        styles[`size_${size}`],
        fullWidth && styles.fullWidth,
        pressed && isInteractive && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
      accessibilityRole="button"
      accessibilityState={{ disabled: !isInteractive }}>
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' ? Palette.ink : Palette.white}
        />
      ) : (
        <View style={styles.contentRow}>
          {icon && iconPosition === 'left' && <View style={styles.iconLeft}>{icon}</View>}
          <Text
            style={[
              styles.textBase,
              styles[`text_${variant}`],
              styles[`textSize_${size}`],
              textStyle,
            ]}>
            {label}
          </Text>
          {icon && iconPosition === 'right' && <View style={styles.iconRight}>{icon}</View>}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: Radius.btn, // 14px
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  fullWidth: {
    width: '100%',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconLeft: {
    marginRight: Spacing.space2,
  },
  iconRight: {
    marginLeft: Spacing.space2,
  },

  // Variants
  primary: {
    backgroundColor: Palette.lime,
  },
  secondary: {
    backgroundColor: Palette.forest,
  },
  outline: {
    backgroundColor: Palette.white,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  coral: {
    backgroundColor: Palette.coral,
  },

  // Sizes
  size_sm: {
    paddingVertical: Spacing.space2,
    paddingHorizontal: Spacing.space3,
    minHeight: 38,
  },
  size_md: {
    paddingVertical: Spacing.space3 + 1,
    paddingHorizontal: Spacing.space4,
    minHeight: 50,
  },
  size_lg: {
    paddingVertical: Spacing.space4,
    paddingHorizontal: Spacing.space5,
    minHeight: 56,
  },

  // Typography
  textBase: {
    ...Typography.bodyBold,
    textAlign: 'center',
  },
  textSize_sm: {
    fontSize: 13,
    fontWeight: '600',
  },
  textSize_md: {
    fontSize: 15,
    fontWeight: '600',
  },
  textSize_lg: {
    fontSize: 16,
    fontWeight: '700',
  },

  text_primary: {
    color: Palette.ink,
  },
  text_secondary: {
    color: Palette.white,
  },
  text_outline: {
    color: Palette.ink,
  },
  text_ghost: {
    color: Palette.muted,
  },
  text_coral: {
    color: Palette.white,
  },

  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.99 }],
  },
  disabled: {
    opacity: 0.45,
  },
});
