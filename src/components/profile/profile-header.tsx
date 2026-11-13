import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Palette, Spacing, Typography } from '@/constants/theme';
import { AppIcon } from '@/components/ui/icon';

export function ProfileHeader() {
  const router = useRouter();

  return (
    <View style={styles.header}>
      <Text style={styles.pageTitle}>Profile</Text>
      <Pressable
        onPress={() => router.push('/settings' as any)}
        style={styles.settingsButton}
        hitSlop={10}
        accessibilityLabel="Open settings">
        <AppIcon name="settings-outline" size={22} color={Palette.forest} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.space3,
    marginBottom: Spacing.space2,
  },
  pageTitle: {
    ...Typography.pageTitle,
    color: Palette.forest,
    letterSpacing: -0.5,
    fontWeight: '800',
  },
  settingsButton: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: Palette.white,
    borderWidth: 1,
    borderColor: Palette.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
