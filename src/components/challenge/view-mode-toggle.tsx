import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Palette, Radius, Spacing, Typography } from '@/constants/theme';

export type ChallengeViewMode = 'discover' | 'my_challenges';

interface ViewModeToggleProps {
  mode: ChallengeViewMode;
  onModeChange: (mode: ChallengeViewMode) => void;
  activeCount: number;
}

export function ViewModeToggle({
  mode,
  onModeChange,
  activeCount,
}: ViewModeToggleProps) {
  return (
    <View style={styles.container}>
      <Pressable
        onPress={() => onModeChange('discover')}
        style={[styles.toggleBtn, mode === 'discover' && styles.toggleBtnActive]}>
        <Text
          style={[styles.toggleText, mode === 'discover' && styles.toggleTextActive]}>
          Discover
        </Text>
      </Pressable>

      <Pressable
        onPress={() => onModeChange('my_challenges')}
        style={[styles.toggleBtn, mode === 'my_challenges' && styles.toggleBtnActive]}>
        <Text
          style={[
            styles.toggleText,
            mode === 'my_challenges' && styles.toggleTextActive,
          ]}>
          My Challenges
        </Text>
        {activeCount > 0 && (
          <View
            style={[
              styles.countBadge,
              mode === 'my_challenges' ? styles.countBadgeActive : styles.countBadgeInactive,
            ]}>
            <Text
              style={[
                styles.countText,
                mode === 'my_challenges' ? styles.countTextActive : styles.countTextInactive,
              ]}>
              {activeCount}
            </Text>
          </View>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: Palette.surfaceSubtle,
    borderRadius: Radius.btn,
    padding: 3,
    marginBottom: Spacing.space4,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  toggleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: Radius.sm,
    gap: 6,
  },
  toggleBtnActive: {
    backgroundColor: Palette.white,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
    elevation: 2,
  },
  toggleText: {
    ...Typography.supporting,
    fontSize: 13,
    fontWeight: '600',
    color: Palette.muted,
  },
  toggleTextActive: {
    color: Palette.forest,
    fontWeight: '700',
  },
  countBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: Radius.full,
  },
  countBadgeActive: {
    backgroundColor: Palette.forest,
  },
  countBadgeInactive: {
    backgroundColor: Palette.border,
  },
  countText: {
    fontSize: 11,
    fontWeight: '700',
  },
  countTextActive: {
    color: Palette.lime,
  },
  countTextInactive: {
    color: Palette.muted,
  },
});
