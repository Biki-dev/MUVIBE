import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { Palette, Radius, Spacing, Typography, FontFamily } from '@/constants/theme';
import { ProgressHeader } from '@/components/onboarding/progress-header';
import { Button } from '@/components/ui/button';
import { AppIcon } from '@/components/ui/icon';
import { useAuth } from '@/context/auth-context';

export default function LocationPermissionScreen() {
  const router = useRouter();
  const { profile, setLocationPermission } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [denied, setDenied] = useState(false);

  /**
   * Actually asks the operating system. This screen used to just set a
   * boolean and move on, so the system prompt never appeared and the app
   * believed it had permission it had never been granted.
   */
  const handleEnableLocation = async () => {
    setIsProcessing(true);
    setDenied(false);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      const granted = status === 'granted';
      await setLocationPermission(granted);

      if (!granted) {
        // Stay put and explain, rather than pretending it worked.
        setDenied(true);
        return;
      }
      router.push('/onboarding/clubs');
    } catch (error) {
      console.warn('[onboarding] location request failed:', error);
      await setLocationPermission(false);
      setDenied(true);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleNotNow = async () => {
    await setLocationPermission(false);
    router.push('/onboarding/clubs');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ProgressHeader
        currentStep={3}
        totalSteps={6}
        showBack={true}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Radar / Campus Discovery Graphic */}
        <View style={styles.graphicCard}>
          <View style={styles.outerRadarRing}>
            <View style={styles.middleRadarRing}>
              <View style={styles.centerPinBadge}>
                <AppIcon name="location" size={32} color={Palette.lime} />
              </View>
            </View>
          </View>

          {/* Floating Campus Tags */}
          <View style={styles.floatingCampusBadge}>
            <AppIcon name="navigate-outline" size={13} color={Palette.forest} />
            <Text style={styles.floatingBadgeText}>
              {profile.college ? profile.college.split('(')[0].trim() : 'Campus Perimeter'}
            </Text>
          </View>
        </View>

        {/* Heading & Description */}
        <View style={styles.textBlock}>
          <Text style={styles.heading}>Discover what's happening around you.</Text>
          <Text style={styles.description}>
            Find nearby fitness clubs and campus activities happening right now on and around your college grounds.
          </Text>
        </View>

        {/* Feature Highlights with Active Minimalism aesthetic */}
        <View style={styles.featureList}>
          <View style={styles.featureItem}>
            <View style={styles.featureIcon}>
              <AppIcon name="people-circle-outline" size={20} color={Palette.forest} />
            </View>
            <View style={styles.featureTextContainer}>
              <Text style={styles.featureTitle}>Nearby Club Sessions</Text>
              <Text style={styles.featureSubtitle}>
                See running groups, morning yoga, and sports meetups near your hostel or campus ground.
              </Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <View style={styles.featureIcon}>
              <AppIcon name="shield-checkmark-outline" size={20} color={Palette.forest} />
            </View>
            <View style={styles.featureTextContainer}>
              <Text style={styles.featureTitle}>Zero Background Tracking</Text>
              <Text style={styles.featureSubtitle}>
                Location is checked only when you actively discover nearby groups. We never track you in the background.
              </Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <View style={styles.featureIcon}>
              <AppIcon name="school-outline" size={20} color={Palette.forest} />
            </View>
            <View style={styles.featureTextContainer}>
              <Text style={styles.featureTitle}>Manual College Backup</Text>
              <Text style={styles.featureSubtitle}>
                If you choose not to share location, you will still see all clubs from {profile.college || 'your college'}.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Sticky bottom buttons — always visible, never inside ScrollView */}
      <View style={styles.bottomBar}>
        {denied && (
          <View style={styles.deniedRow}>
            <AppIcon name="alert-circle" size={15} color={Palette.amber} />
            <Text style={styles.deniedText}>
              Location is off. You can still use MUVIBE: distance falls back to
              step estimates, and Near Me uses your campus. Turn it on in
              Settings whenever you like.
            </Text>
          </View>
        )}
        <Button
          label="Enable location"
          variant="primary"
          size="lg"
          onPress={handleEnableLocation}
          loading={isProcessing}
          icon={<AppIcon name="navigate" size={18} color={Palette.ink} />}
        />

        <Button
          label="Choose college manually / Not now"
          variant="outline"
          size="md"
          onPress={handleNotNow}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Palette.canvas,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.space4,
    paddingTop: Spacing.space2,
    paddingBottom: Spacing.space4,
    maxWidth: 500,
    width: '100%',
    alignSelf: 'center',
  },
  deniedRow: {
    flexDirection: 'row',
    gap: Spacing.space2,
    alignItems: 'flex-start',
    backgroundColor: Palette.surfaceSubtle,
    borderRadius: Radius.sm,
    padding: Spacing.space3,
    marginBottom: Spacing.space3,
  },
  deniedText: {
    ...Typography.supporting,
    color: Palette.muted,
    flex: 1,
    lineHeight: 17,
  },
  bottomBar: {
    paddingHorizontal: Spacing.space4,
    paddingTop: Spacing.space3,
    paddingBottom: Spacing.space4,
    gap: Spacing.space3,
    backgroundColor: Palette.canvas,
    borderTopWidth: 1,
    borderTopColor: Palette.border,
    maxWidth: 500,
    width: '100%',
    alignSelf: 'center',
  },
  graphicCard: {
    width: '100%',
    height: 200,
    backgroundColor: Palette.forest,
    borderRadius: Radius.lg, // 24px
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
    marginBottom: Spacing.space5,
    borderWidth: 1,
    borderColor: Palette.borderDark,
  },
  outerRadarRing: {
    width: 170,
    height: 170,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: 'rgba(197, 243, 107, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  middleRadarRing: {
    width: 120,
    height: 120,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    borderColor: 'rgba(197, 243, 107, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerPinBadge: {
    width: 64,
    height: 64,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Palette.lime,
  },
  floatingCampusBadge: {
    position: 'absolute',
    bottom: Spacing.space3,
    backgroundColor: Palette.white,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.space3,
    paddingVertical: 5,
    borderRadius: Radius.full,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  floatingBadgeText: {
    ...Typography.supporting,
    color: Palette.forest,
    fontWeight: '700',
    fontFamily: FontFamily.bold,
    fontSize: 11.5,
  },
  textBlock: {
    alignItems: 'center',
    marginBottom: Spacing.space5,
  },
  heading: {
    ...Typography.pageTitle,
    textAlign: 'center',
    color: Palette.ink,
    marginBottom: Spacing.space2,
  },
  description: {
    ...Typography.body,
    textAlign: 'center',
    color: Palette.muted,
    paddingHorizontal: Spacing.space2,
  },
  featureList: {
    width: '100%',
    backgroundColor: Palette.white,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Palette.border,
    padding: Spacing.space4,
    gap: Spacing.space4,
    marginBottom: Spacing.space6,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  featureIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Palette.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  featureTextContainer: {
    flex: 1,
  },
  featureTitle: {
    ...Typography.cardHeading,
    fontSize: 14.5,
    color: Palette.ink,
    marginBottom: 2,
  },
  featureSubtitle: {
    ...Typography.supporting,
    color: Palette.muted,
    lineHeight: 17,
  },
});
