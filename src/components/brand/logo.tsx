import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { Palette, Radius, Spacing, Typography, FontFamily } from '@/constants/theme';
import { AppIcon } from '@/components/ui/icon';

interface FitConnectLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showTagline?: boolean;
  animatedLine?: boolean;
  style?: ViewStyle;
}

export function FitConnectLogo({
  size = 'md',
  showTagline = true,
  animatedLine = false,
  style,
}: FitConnectLogoProps) {
  const dotOffset = useSharedValue(0);
  const pulseScale = useSharedValue(1);

  useEffect(() => {
    if (animatedLine) {
      dotOffset.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 900, easing: Easing.inOut(Easing.cubic) }),
          withTiming(0, { duration: 900, easing: Easing.inOut(Easing.cubic) })
        ),
        -1,
        true
      );
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.3, { duration: 450, easing: Easing.ease }),
          withTiming(1.0, { duration: 450, easing: Easing.ease })
        ),
        -1,
        true
      );
    }
  }, [animatedLine]);

  const movingDotStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateX: dotOffset.value * 70 - 35,
        },
        {
          scale: pulseScale.value,
        },
      ],
    };
  });

  const isLg = size === 'lg';
  const isSm = size === 'sm';

  const badgeSize = isLg ? 76 : isSm ? 40 : 56;
  const iconSize = isLg ? 36 : isSm ? 20 : 28;

  return (
    <View style={[styles.container, style]}>
      {/* Sporty Minimalist Emblem */}
      <View
        style={[
          styles.badge,
          { width: badgeSize, height: badgeSize, borderRadius: isLg ? 24 : 16 },
        ]}>
        <View style={styles.badgeInner}>
          <AppIcon name="flash" size={iconSize} color={Palette.lime} />
        </View>
        <View style={styles.limeCorner} />
      </View>

      {/* Brand Name */}
      <View style={styles.textContainer}>
        <View style={styles.brandNameRow}>
          <Text
            style={[
              styles.brandText,
              isLg && styles.brandTextLg,
              isSm && styles.brandTextSm,
            ]}>
            Fit<Text style={styles.brandAccent}>Connect</Text>
          </Text>
        </View>

        {showTagline && (
          <Text
            style={[
              styles.tagline,
              isLg && styles.taglineLg,
              isSm && styles.taglineSm,
            ]}>
            Move together. Grow together.
          </Text>
        )}
      </View>

      {/* Minimal animated activity line or moving dot */}
      {animatedLine && (
        <View style={styles.activityLineContainer}>
          <View style={styles.activityLineTrack}>
            <Animated.View style={[styles.movingDot, movingDotStyle]} />
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    backgroundColor: Palette.forest,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
    shadowColor: Palette.forest,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  badgeInner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  limeCorner: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 18,
    height: 18,
    borderRadius: Radius.full,
    backgroundColor: Palette.lime,
  },
  textContainer: {
    alignItems: 'center',
    marginTop: Spacing.space3,
  },
  brandNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandText: {
    ...Typography.pageTitle,
    fontSize: 26,
    color: Palette.forest,
    fontWeight: '800',
    fontFamily: FontFamily.bold,
    letterSpacing: -0.5,
  },
  brandTextLg: {
    fontSize: 32,
    fontFamily: FontFamily.regular,
    lineHeight: 38,
  },
  brandTextSm: {
    fontSize: 18,
    fontFamily: FontFamily.regular,
    lineHeight: 22,
  },
  brandAccent: {
    color: Palette.ink,
    fontWeight: '800',
    fontFamily: FontFamily.bold,
  },
  tagline: {
    ...Typography.body,
    fontSize: 14,
    color: Palette.muted,
    marginTop: Spacing.space1,
    fontWeight: '500',
    fontFamily: FontFamily.medium,
    textAlign: 'center',
  },
  taglineLg: {
    fontSize: 15,
    fontFamily: FontFamily.regular,
  },
  taglineSm: {
    fontSize: 12,
    fontFamily: FontFamily.regular,
  },
  activityLineContainer: {
    marginTop: Spacing.space6,
    alignItems: 'center',
    justifyContent: 'center',
    width: 120,
    height: 20,
  },
  activityLineTrack: {
    width: 90,
    height: 3,
    backgroundColor: Palette.surfaceSubtle,
    borderRadius: 2,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  movingDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: Palette.lime,
    borderWidth: 1.5,
    borderColor: Palette.forest,
    position: 'absolute',
  },
});
