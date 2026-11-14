/**
 * src/components/ui/confirm-dialog.tsx
 * ─────────────────────────────────────────────────────────────────
 * A yes/no confirmation that works everywhere.
 *
 * `Alert.alert` is a no-op on React Native Web: the call returns and
 * nothing is shown, so a button whose whole action lives inside the
 * alert silently does nothing in a browser. This renders a real Modal
 * instead, which behaves the same on web, iOS and Android.
 * ─────────────────────────────────────────────────────────────────
 */

import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Palette, Radius, Spacing, Typography } from '@/constants/theme';

interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  message?: string;
  /** Label for the action itself, e.g. "Log Out". */
  confirmLabel?: string;
  cancelLabel?: string;
  /** Styles the confirm button as destructive. */
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}>
      {/* Tapping the backdrop cancels, as a system alert would. */}
      <Pressable style={styles.backdrop} onPress={onCancel}>
        {/* Swallow presses inside the card so they do not cancel. */}
        <Pressable style={styles.card} onPress={() => {}}>
          <Text style={styles.title}>{title}</Text>
          {message ? <Text style={styles.message}>{message}</Text> : null}

          <View style={styles.actions}>
            <Pressable
              style={({ pressed }) => [styles.btn, styles.cancelBtn, pressed && styles.pressed]}
              onPress={onCancel}
              accessibilityRole="button"
              accessibilityLabel={cancelLabel}>
              <Text style={styles.cancelText}>{cancelLabel}</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.btn,
                destructive ? styles.destructiveBtn : styles.confirmBtn,
                pressed && styles.pressed,
              ]}
              onPress={onConfirm}
              accessibilityRole="button"
              accessibilityLabel={confirmLabel}>
              <Text style={destructive ? styles.destructiveText : styles.confirmText}>
                {confirmLabel}
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: Palette.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.space5,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: Palette.white,
    borderRadius: Radius.card,
    padding: Spacing.space5,
    gap: Spacing.space2,
  },
  title: {
    ...Typography.sectionHeading,
    color: Palette.ink,
  },
  message: {
    ...Typography.body,
    color: Palette.muted,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.space3,
    marginTop: Spacing.space3,
  },
  btn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: Radius.btn,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtn: {
    borderWidth: 1,
    borderColor: Palette.border,
    backgroundColor: Palette.white,
  },
  cancelText: {
    ...Typography.bodyBold,
    color: Palette.ink,
  },
  confirmBtn: {
    backgroundColor: Palette.lime,
  },
  confirmText: {
    ...Typography.bodyBold,
    color: Palette.forest,
  },
  destructiveBtn: {
    backgroundColor: Palette.coral,
  },
  destructiveText: {
    ...Typography.bodyBold,
    color: Palette.white,
  },
  pressed: {
    opacity: 0.8,
  },
});
