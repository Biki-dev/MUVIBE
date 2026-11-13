import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Palette, Radius, Spacing, Typography } from '@/constants/theme';
import { AppIcon } from '@/components/ui/icon';

interface QuickActionsProps {
  onLogActivity?: () => void;
  onStartChallenge?: () => void;
  onJoinCommunity?: () => void;
}

export function QuickActions({
  onLogActivity,
  onStartChallenge,
  onJoinCommunity,
}: QuickActionsProps) {
  const actions = [
    {
      id: 'log',
      label: 'Log Activity',
      iconName: 'add-outline',
      onPress: () => onLogActivity?.(),
    },
    {
      id: 'challenge',
      label: 'Start Challenge',
      iconName: 'trophy-outline',
      onPress: () => onStartChallenge?.(),
    },
    {
      id: 'community',
      label: 'Join Community',
      iconName: 'people-outline',
      onPress: () => onJoinCommunity?.(),
    },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Quick Actions</Text>

      <View style={styles.cardsRow}>
        {actions.map((action) => (
          <Pressable
            key={action.id}
            onPress={action.onPress}
            style={({ pressed }) => [
              styles.actionCard,
              pressed && styles.pressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel={action.label}>
            <View style={styles.iconCircle}>
              <AppIcon name={action.iconName} size={22} color={Palette.forest} />
            </View>
            <Text style={styles.actionLabel} numberOfLines={2}>
              {action.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.space5,
  },
  sectionTitle: {
    ...Typography.sectionHeading,
    color: Palette.ink,
    marginBottom: Spacing.space3,
  },
  cardsRow: {
    flexDirection: 'row',
    gap: Spacing.space3,
  },
  actionCard: {
    flex: 1,
    backgroundColor: Palette.white,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Palette.border,
    paddingVertical: Spacing.space3 + 2,
    paddingHorizontal: Spacing.space2,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 96,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: Radius.sm,
    backgroundColor: Palette.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.space2,
  },
  actionLabel: {
    ...Typography.supporting,
    fontSize: 12,
    fontWeight: '600',
    color: Palette.ink,
    textAlign: 'center',
    lineHeight: 16,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
});
