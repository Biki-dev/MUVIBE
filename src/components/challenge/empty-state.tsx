import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Palette, Radius, Spacing, Typography } from '@/constants/theme';
import { AppIcon } from '@/components/ui/icon';

interface EmptyStateProps {
  iconName: string;
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  iconName,
  title,
  message,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <View style={styles.iconCircle}>
        <AppIcon name={iconName} size={28} color={Palette.forest} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>

      {actionLabel && onAction && (
        <Pressable onPress={onAction} style={styles.actionBtn}>
          <Text style={styles.actionText}>{actionLabel}</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.space6,
    paddingHorizontal: Spacing.space4,
    backgroundColor: Palette.white,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Palette.border,
    marginVertical: Spacing.space2,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: Radius.full,
    backgroundColor: Palette.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.space3,
  },
  title: {
    ...Typography.cardHeading,
    color: Palette.ink,
    fontSize: 16,
    marginBottom: 4,
    textAlign: 'center',
  },
  message: {
    ...Typography.body,
    fontSize: 13,
    color: Palette.muted,
    textAlign: 'center',
    marginBottom: Spacing.space3,
    maxWidth: 280,
  },
  actionBtn: {
    backgroundColor: Palette.forest,
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: Radius.btn,
  },
  actionText: {
    ...Typography.supporting,
    fontSize: 12.5,
    fontWeight: '700',
    color: Palette.white,
  },
});
