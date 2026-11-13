import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Palette, Radius, Spacing, Typography } from '@/constants/theme';
import { AppIcon } from '@/components/ui/icon';

interface ProgressHeaderProps {
  currentStep: number;
  totalSteps?: number;
  title?: string;
  onBack?: () => void;
  onSkip?: () => void;
  showBack?: boolean;
  canSkip?: boolean;
}

export function ProgressHeader({
  currentStep,
  totalSteps = 6,
  title,
  onBack,
  onSkip,
  showBack = true,
  canSkip = false,
}: ProgressHeaderProps) {
  const router = useRouter();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (router.canGoBack()) {
      router.back();
    }
  };

  const progressPercent = Math.min(Math.max((currentStep / totalSteps) * 100, 0), 100);

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <View style={styles.leftContainer}>
          {showBack && (
            <Pressable
              onPress={handleBack}
              style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
              hitSlop={12}
              accessibilityLabel="Go back">
              <AppIcon name="arrow-back" size={20} color={Palette.ink} />
            </Pressable>
          )}
        </View>

        <View style={styles.centerContainer}>
          <Text style={styles.stepText}>
            Step {currentStep} of {totalSteps}
          </Text>
        </View>

        <View style={styles.rightContainer}>
          {canSkip && onSkip && (
            <Pressable
              onPress={onSkip}
              style={({ pressed }) => [styles.skipButton, pressed && styles.pressed]}
              hitSlop={12}>
              <Text style={styles.skipText}>Skip</Text>
            </Pressable>
          )}
        </View>
      </View>

      {/* Progress bar */}
      <View style={styles.track}>
        <View style={[styles.indicator, { width: `${progressPercent}%` }]} />
      </View>

      {title && <Text style={styles.headerTitle}>{title}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.space4,
    paddingTop: Spacing.space2,
    paddingBottom: Spacing.space3,
    backgroundColor: Palette.canvas,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 40,
    marginBottom: Spacing.space2,
  },
  leftContainer: {
    width: 44,
    alignItems: 'flex-start',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
  },
  rightContainer: {
    width: 44,
    alignItems: 'flex-end',
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: Radius.full,
    backgroundColor: Palette.white,
    borderWidth: 1,
    borderColor: Palette.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipButton: {
    paddingVertical: Spacing.space1,
    paddingHorizontal: Spacing.space2,
  },
  skipText: {
    ...Typography.supporting,
    color: Palette.muted,
    fontWeight: '600',
  },
  stepText: {
    ...Typography.supporting,
    fontSize: 12,
    fontWeight: '600',
    color: Palette.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  track: {
    height: 4,
    backgroundColor: Palette.border,
    borderRadius: Radius.full,
    overflow: 'hidden',
    width: '100%',
  },
  indicator: {
    height: '100%',
    backgroundColor: Palette.forest,
    borderRadius: Radius.full,
  },
  headerTitle: {
    ...Typography.sectionHeading,
    color: Palette.ink,
    marginTop: Spacing.space3,
  },
  pressed: {
    opacity: 0.7,
  },
});
