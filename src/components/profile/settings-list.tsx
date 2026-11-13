import React from 'react';
import { View, Text, StyleSheet, Pressable, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Palette, Radius, Spacing, Typography, FontFamily } from '@/constants/theme';
import { AppIcon } from '@/components/ui/icon';
import { useAuth } from '@/context/auth-context';

export function SettingsList() {
  const router = useRouter();
  const { logout } = useAuth();

  const handleLogout = () => {
    Alert.alert(
      'Log Out of MUVIBE?',
      'Are you sure you want to log out? Your recorded activity and streak data will remain safely stored on this device.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/auth' as any);
          },
        },
      ]
    );
  };

  const SETTINGS_SECTIONS = [
    {
      title: 'ACCOUNT',
      items: [
        {
          id: 'edit_profile',
          label: 'Edit Profile',
          sub: 'Name, avatar, bio & academic details',
          iconName: 'person-outline',
          onPress: () => router.push('/profile/edit' as any),
        },
        {
          id: 'personal_info',
          label: 'Personal Information',
          sub: 'Email, campus verification & student ID',
          iconName: 'id-card-outline',
          onPress: () => router.push('/settings' as any),
        },
      ],
    },
    {
      title: 'PREFERENCES',
      items: [
        {
          id: 'interests',
          label: 'Activity Interests',
          sub: 'Running, cycling, gym & sports preferences',
          iconName: 'heart-outline',
          onPress: () => router.push('/settings' as any),
        },
        {
          id: 'notifications',
          label: 'Notification Preferences',
          sub: 'Daily streak reminders & event alerts',
          iconName: 'notifications-outline',
          onPress: () => router.push('/settings' as any),
        },
      ],
    },
    {
      title: 'APP SETTINGS',
      items: [
        {
          id: 'location',
          label: 'Location Permissions',
          sub: 'Contextual campus club discovery',
          iconName: 'location-outline',
          onPress: () => router.push('/settings' as any),
        },
        {
          id: 'privacy',
          label: 'Privacy & Sharing',
          sub: 'Leaderboard visibility & club cards',
          iconName: 'shield-checkmark-outline',
          onPress: () => router.push('/settings' as any),
        },
        {
          id: 'about',
          label: 'About MUVIBE',
          sub: 'v1.0.0 (Expo SDK 58)',
          iconName: 'information-circle-outline',
          onPress: () => router.push('/settings' as any),
        },
      ],
    },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Settings & Account</Text>

      {SETTINGS_SECTIONS.map((sec, idx) => (
        <View key={idx} style={styles.groupCard}>
          <Text style={styles.groupHeading}>{sec.title}</Text>
          {sec.items.map((item, itemIdx) => (
            <Pressable
              key={item.id}
              onPress={item.onPress}
              style={({ pressed }) => [
                styles.itemRow,
                itemIdx < sec.items.length - 1 && styles.itemBorder,
                pressed && styles.itemPressed,
              ]}>
              <View style={styles.iconWrap}>
                <AppIcon name={item.iconName} size={16} color={Palette.forest} />
              </View>

              <View style={styles.itemTextWrap}>
                <Text style={styles.itemLabel}>{item.label}</Text>
                <Text style={styles.itemSub}>{item.sub}</Text>
              </View>

              <AppIcon name="chevron-forward" size={16} color={Palette.muted} />
            </Pressable>
          ))}
        </View>
      ))}

      {/* Logout Row */}
      <Pressable
        onPress={handleLogout}
        style={({ pressed }) => [styles.logoutBtn, pressed && styles.logoutBtnPressed]}>
        <AppIcon name="log-out-outline" size={18} color={Palette.coral} />
        <Text style={styles.logoutText}>Log Out</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.space6,
  },
  sectionTitle: {
    ...Typography.sectionHeading,
    color: Palette.ink,
    marginBottom: Spacing.space3,
  },
  groupCard: {
    backgroundColor: Palette.white,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Palette.border,
    paddingVertical: Spacing.space2,
    marginBottom: Spacing.space3,
  },
  groupHeading: {
    ...Typography.supporting,
    fontSize: 10.5,
    fontWeight: '700',
    fontFamily: FontFamily.bold,
    color: Palette.muted,
    letterSpacing: 0.6,
    paddingHorizontal: Spacing.space3 + 2,
    paddingVertical: 4,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.space3 + 2,
    paddingVertical: 10,
    gap: 12,
  },
  itemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Palette.surfaceSubtle,
  },
  itemPressed: {
    backgroundColor: Palette.surfaceHighlight,
  },
  iconWrap: {
    width: 30,
    height: 30,
    borderRadius: Radius.sm,
    backgroundColor: Palette.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemTextWrap: {
    flex: 1,
  },
  itemLabel: {
    ...Typography.bodyBold,
    fontSize: 13.5,
    color: Palette.ink,
    marginBottom: 1,
  },
  itemSub: {
    ...Typography.supporting,
    fontSize: 11,
    color: Palette.muted,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Palette.white,
    borderWidth: 1,
    borderColor: 'rgba(229, 108, 103, 0.3)',
    borderRadius: Radius.card,
    paddingVertical: 12,
    marginTop: Spacing.space2,
  },
  logoutBtnPressed: {
    backgroundColor: 'rgba(229, 108, 103, 0.08)',
  },
  logoutText: {
    ...Typography.bodyBold,
    fontSize: 14,
    color: Palette.coral,
  },
});
