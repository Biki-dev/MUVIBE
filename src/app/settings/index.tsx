import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Switch, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Palette, Radius, Spacing, Typography, FontFamily } from '@/constants/theme';
import { AppIcon } from '@/components/ui/icon';
import { useAuth } from '@/context/auth-context';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { WearableSection } from '@/components/settings/wearable-section';

export default function SettingsScreen() {
  const router = useRouter();
  const { logout, locationEnabled, notificationsEnabled, setLocationPermission, setNotifications } = useAuth();

  const [localLocation, setLocalLocation] = useState(locationEnabled);
  const [localNotifications, setLocalNotifications] = useState(notificationsEnabled);

  const handleToggleLocation = async (val: boolean) => {
    setLocalLocation(val);
    await setLocationPermission(val);
  };

  const handleToggleNotifications = async (val: boolean) => {
    setLocalNotifications(val);
    await setNotifications(val);
  };

  // A system alert is a no-op on web, so the confirmation is a real
  // Modal and the sign-out runs from this screen's own state.
  const [confirmingLogout, setConfirmingLogout] = useState(false);

  const handleLogout = async () => {
    setConfirmingLogout(false);
    try {
      await logout();
    } finally {
      // Leave for the auth screen either way: staying put would show a
      // signed-out user their old data.
      router.replace('/auth' as any);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.topHeader}>
        <Pressable onPress={() => router.back()} style={styles.backButton} hitSlop={10}>
          <AppIcon name="arrow-back" size={24} color={Palette.ink} />
        </Pressable>
        <Text style={styles.topHeaderTitle}>Settings</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* A. Account */}
        <View style={styles.groupCard}>
          <Text style={styles.groupHeading}>ACCOUNT</Text>
          <Pressable
            onPress={() => router.push('/profile/edit' as any)}
            style={styles.itemRow}>
            <View style={styles.iconWrap}>
              <AppIcon name="person-outline" size={16} color={Palette.forest} />
            </View>
            <View style={styles.itemTextWrap}>
              <Text style={styles.itemLabel}>Edit Profile</Text>
              <Text style={styles.itemSub}>Full name, username & bio</Text>
            </View>
            <AppIcon name="chevron-forward" size={16} color={Palette.muted} />
          </Pressable>
        </View>

        {/* B. Connected devices */}
        <WearableSection />

        {/* C. Preferences */}
        <View style={styles.groupCard}>
          <Text style={styles.groupHeading}>PREFERENCES</Text>
          <View style={styles.itemRow}>
            <View style={styles.iconWrap}>
              <AppIcon name="notifications-outline" size={16} color={Palette.forest} />
            </View>
            <View style={styles.itemTextWrap}>
              <Text style={styles.itemLabel}>Daily Reminders</Text>
              <Text style={styles.itemSub}>Notify for daily streak preservation</Text>
            </View>
            <Switch
              value={localNotifications}
              onValueChange={handleToggleNotifications}
              trackColor={{ false: Palette.border, true: Palette.forest }}
              thumbColor={Palette.white}
            />
          </View>

          <View style={styles.itemDivider} />

          <View style={styles.itemRow}>
            <View style={styles.iconWrap}>
              <AppIcon name="location-outline" size={16} color={Palette.forest} />
            </View>
            <View style={styles.itemTextWrap}>
              <Text style={styles.itemLabel}>Location Permissions</Text>
              <Text style={styles.itemSub}>Discover nearby campus activities</Text>
            </View>
            <Switch
              value={localLocation}
              onValueChange={handleToggleLocation}
              trackColor={{ false: Palette.border, true: Palette.forest }}
              thumbColor={Palette.white}
            />
          </View>
        </View>

        {/* D. App Settings */}
        <View style={styles.groupCard}>
          <Text style={styles.groupHeading}>APP & SUPPORT</Text>
          <Pressable
            onPress={() => Alert.alert('Privacy', 'MUVIBE stores your activities locally on your device. Zero third-party background trackers.')}
            style={styles.itemRow}>
            <View style={styles.iconWrap}>
              <AppIcon name="shield-checkmark-outline" size={16} color={Palette.forest} />
            </View>
            <View style={styles.itemTextWrap}>
              <Text style={styles.itemLabel}>Privacy Policy</Text>
              <Text style={styles.itemSub}>Local device storage & permissions</Text>
            </View>
            <AppIcon name="chevron-forward" size={16} color={Palette.muted} />
          </Pressable>

          <View style={styles.itemDivider} />

          <Pressable
            onPress={() => Alert.alert('Help & Support', 'For issues, email campus support at support@muvibe.app')}
            style={styles.itemRow}>
            <View style={styles.iconWrap}>
              <AppIcon name="help-circle-outline" size={16} color={Palette.forest} />
            </View>
            <View style={styles.itemTextWrap}>
              <Text style={styles.itemLabel}>Help & Support</Text>
              <Text style={styles.itemSub}>Campus team assistance</Text>
            </View>
            <AppIcon name="chevron-forward" size={16} color={Palette.muted} />
          </Pressable>

          <View style={styles.itemDivider} />

          <View style={styles.itemRow}>
            <View style={styles.iconWrap}>
              <AppIcon name="information-circle-outline" size={16} color={Palette.forest} />
            </View>
            <View style={styles.itemTextWrap}>
              <Text style={styles.itemLabel}>About MUVIBE</Text>
              <Text style={styles.itemSub}>Version 1.0.0 (Expo SDK 58)</Text>
            </View>
          </View>
        </View>

        {/* E. Logout */}
        <Pressable
          onPress={() => setConfirmingLogout(true)}
          style={({ pressed }) => [styles.logoutBtn, pressed && styles.logoutBtnPressed]}>
          <AppIcon name="log-out-outline" size={18} color={Palette.coral} />
          <Text style={styles.logoutText}>Log Out</Text>
        </Pressable>
      </ScrollView>

      <ConfirmDialog
        visible={confirmingLogout}
        title="Log out of MUVIBE?"
        message="Your activity records and achievements stay on your account. You can sign back in any time."
        confirmLabel="Log Out"
        destructive
        onConfirm={handleLogout}
        onCancel={() => setConfirmingLogout(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Palette.canvas,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.space4,
    paddingVertical: Spacing.space3,
    backgroundColor: Palette.white,
    borderBottomWidth: 1,
    borderBottomColor: Palette.border,
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topHeaderTitle: {
    ...Typography.sectionHeading,
    fontSize: 16,
    color: Palette.ink,
  },
  scrollContent: {
    paddingHorizontal: Spacing.space4,
    paddingTop: Spacing.space4,
    paddingBottom: Spacing.space6,
    maxWidth: 600,
    width: '100%',
    alignSelf: 'center',
  },
  groupCard: {
    backgroundColor: Palette.white,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Palette.border,
    paddingVertical: Spacing.space2,
    marginBottom: Spacing.space4,
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
  itemDivider: {
    height: 1,
    backgroundColor: Palette.surfaceSubtle,
    marginLeft: 54,
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
