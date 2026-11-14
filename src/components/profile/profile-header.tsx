import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Palette, Radius, Spacing, Typography, FontFamily } from '@/constants/theme';
import { AppIcon } from '@/components/ui/icon';

export function ProfileHeader() {
  const router = useRouter();

  return (
    <View style={styles.header}>
      <Text style={styles.pageTitle}>Profile</Text>

      {/* Settings lives on its own screen; this is the only way in. */}
      <Pressable
        onPress={() => router.push('/settings' as any)}
        hitSlop={10}
        style={({ pressed }) => [styles.gear, pressed && styles.gearPressed]}
        accessibilityRole="button"
        accessibilityLabel="Settings">
        <AppIcon name="settings-outline" size={20} color={Palette.ink} />
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
    fontFamily: FontFamily.bold,
  },
  gear: {
    width: 38,
    height: 38,
    borderRadius: Radius.full,
    backgroundColor: Palette.white,
    borderWidth: 1,
    borderColor: Palette.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gearPressed: {
    backgroundColor: Palette.surfaceSubtle,
  },
});
