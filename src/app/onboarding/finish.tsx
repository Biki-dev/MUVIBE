import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Palette, Radius, Spacing, Typography, FontFamily } from '@/constants/theme';
import { ProgressHeader } from '@/components/onboarding/progress-header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AppIcon } from '@/components/ui/icon';
import { useAuth } from '@/context/auth-context';
import { ACTIVITIES, SEEDED_CLUBS } from '@/constants/mock-data';

export default function NotificationsAndFinishScreen() {
  const router = useRouter();
  const {
    profile,
    selectedActivities,
    joinedClubIds,
    setNotifications,
    completeOnboarding,
  } = useAuth();

  const [isCompletedState, setIsCompletedState] = useState(false);

  const triggerCompletion = async (enabled: boolean) => {
    await setNotifications(enabled);
    setIsCompletedState(true);
  };

  const handleEnterApp = async () => {
    await completeOnboarding();
    router.replace('/(tabs)');
  };

  const joinedClubsList = SEEDED_CLUBS.filter((c) => joinedClubIds.includes(c.id));
  const chosenActivitiesList = ACTIVITIES.filter((a) => selectedActivities.includes(a.id));

  return (
    <SafeAreaView style={styles.safeArea}>
      {!isCompletedState && (
        <ProgressHeader
          currentStep={6}
          totalSteps={6}
          showBack={true}
        />
      )}

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {!isCompletedState ? (
          <>
            {/* Heading & Subtitle */}
            <View style={styles.headerBlock}>
              <View style={styles.bellIconEmblem}>
                <AppIcon name="notifications" size={32} color={Palette.forest} />
              </View>
              <Text style={styles.heading}>Stay in the loop.</Text>
              <Text style={styles.subtitle}>
                Get timely campus fitness updates so you never miss a group session or challenge.
              </Text>
            </View>

            {/* Notification Elements Breakdown */}
            <View style={styles.cardList}>
              <View style={styles.featureCard}>
                <View style={[styles.iconPill, { backgroundColor: 'rgba(82, 121, 246, 0.15)' }]}>
                  <AppIcon name="trophy-outline" size={20} color={Palette.electricBlue} />
                </View>
                <View style={styles.featureText}>
                  <Text style={styles.featureTitle}>Challenge Updates</Text>
                  <Text style={styles.featureDesc}>
                    Stay posted on campus step showdowns, 5K leaderboards, and inter-hostel trials.
                  </Text>
                </View>
              </View>

              <View style={styles.featureCard}>
                <View style={[styles.iconPill, { backgroundColor: 'rgba(197, 243, 107, 0.4)' }]}>
                  <AppIcon name="megaphone-outline" size={20} color={Palette.forest} />
                </View>
                <View style={styles.featureText}>
                  <Text style={styles.featureTitle}>Club Announcements</Text>
                  <Text style={styles.featureDesc}>
                    Track practice time shifts, rain date notices, and weekend trail run meetup spots.
                  </Text>
                </View>
              </View>

              <View style={styles.featureCard}>
                <View style={[styles.iconPill, { backgroundColor: 'rgba(232, 163, 74, 0.18)' }]}>
                  <AppIcon name="calendar-outline" size={20} color={Palette.amber} />
                </View>
                <View style={styles.featureText}>
                  <Text style={styles.featureTitle}>Upcoming Campus Events</Text>
                  <Text style={styles.featureDesc}>
                    Invitations to annual sports fests, cycling marathons, and intramural tournaments.
                  </Text>
                </View>
              </View>

              <View style={styles.featureCard}>
                <View style={[styles.iconPill, { backgroundColor: 'rgba(229, 108, 103, 0.15)' }]}>
                  <AppIcon name="flame-outline" size={20} color={Palette.coral} />
                </View>
                <View style={styles.featureText}>
                  <Text style={styles.featureTitle}>Achievement Notifications</Text>
                  <Text style={styles.featureDesc}>
                    Real-time celebrations when you crush your weekly activity goals or streak records.
                  </Text>
                </View>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.buttonContainer}>
              <Button
                label="Enable notifications"
                variant="primary"
                size="lg"
                onPress={() => triggerCompletion(true)}
                icon={<AppIcon name="notifications" size={18} color={Palette.ink} />}
              />

              <Button
                label="Maybe later"
                variant="outline"
                size="md"
                onPress={() => triggerCompletion(false)}
              />
            </View>
          </>
        ) : (
          /* Onboarding complete: Student Pass */
          <View style={styles.completionWrapper}>
            {/* Celebratory badge */}
            <View style={styles.celebrationBadgeContainer}>
              <View style={styles.celebrationCircle}>
                <AppIcon name="checkmark-done" size={48} color={Palette.lime} />
              </View>
              <View style={styles.pulseRing} />
            </View>

            <Text style={styles.completedTitle}>You're all set.</Text>
            <Text style={styles.completedSubtitle}>Let's get moving.</Text>

            {/* Student Pass Preview */}
            <View style={styles.passCard}>
              <View style={styles.passHeader}>
                <View style={styles.passHeaderLeft}>
                  <Text style={styles.passBrand}>FitConnect Pass</Text>
                  <Text style={styles.passCollege}>{profile.college || 'Assam Engineering College'}</Text>
                </View>
                <Badge label="Verified Student" variant="lime" />
              </View>

              <View style={styles.passDivider} />

              <View style={styles.passProfileRow}>
                <View style={styles.passAvatar}>
                  <Text style={styles.passAvatarText}>
                    {profile.fullName ? profile.fullName.charAt(0).toUpperCase() : 'S'}
                  </Text>
                </View>
                <View style={styles.passProfileMeta}>
                  <Text style={styles.passName}>{profile.fullName || 'Student Athlete'}</Text>
                  <Text style={styles.passHandle}>@{profile.username || 'student'}</Text>
                  <Text style={styles.passDept}>{profile.department}</Text>
                </View>
              </View>

              {/* Chosen activities */}
              {chosenActivitiesList.length > 0 && (
                <View style={styles.passActivitiesSection}>
                  <Text style={styles.passSectionLabel}>Activities</Text>
                  <View style={styles.passChipsRow}>
                    {chosenActivitiesList.slice(0, 4).map((a) => (
                      <View key={a.id} style={styles.passActivityChip}>
                        <Text style={styles.passChipText}>{a.emoji} {a.name}</Text>
                      </View>
                    ))}
                    {chosenActivitiesList.length > 4 && (
                      <View style={styles.passActivityChip}>
                        <Text style={styles.passChipText}>+{chosenActivitiesList.length - 4} more</Text>
                      </View>
                    )}
                  </View>
                </View>
              )}

              {/* Joined clubs */}
              {joinedClubsList.length > 0 && (
                <View style={styles.passClubsSection}>
                  <Text style={styles.passSectionLabel}>Clubs Joined</Text>
                  <Text style={styles.passClubsCount}>
                    ⚡ {joinedClubsList.length} {joinedClubsList.length === 1 ? 'Club' : 'Clubs'} active
                  </Text>
                </View>
              )}
            </View>

            {/* Enter main app button */}
            <View style={styles.enterButtonWrapper}>
              <Button
                label="Enter FitConnect"
                variant="primary"
                size="lg"
                onPress={handleEnterApp}
                icon={<AppIcon name="arrow-forward" size={18} color={Palette.ink} />}
                iconPosition="right"
              />
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Palette.canvas,
  },
  scrollContent: {
    paddingHorizontal: Spacing.space4,
    paddingTop: Spacing.space2,
    paddingBottom: Spacing.space6,
    maxWidth: 520,
    width: '100%',
    alignSelf: 'center',
    alignItems: 'center',
  },
  headerBlock: {
    alignItems: 'center',
    marginBottom: Spacing.space5,
  },
  bellIconEmblem: {
    width: 68,
    height: 68,
    borderRadius: Radius.full,
    backgroundColor: Palette.white,
    borderWidth: 1,
    borderColor: Palette.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.space3,
  },
  heading: {
    ...Typography.pageTitle,
    textAlign: 'center',
    color: Palette.ink,
    marginBottom: Spacing.space1,
  },
  subtitle: {
    ...Typography.body,
    textAlign: 'center',
    color: Palette.muted,
    paddingHorizontal: Spacing.space2,
  },
  cardList: {
    width: '100%',
    gap: Spacing.space3,
    marginBottom: Spacing.space5,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Palette.white,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Palette.border,
    padding: Spacing.space3 + 2,
    gap: 12,
  },
  iconPill: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    ...Typography.cardHeading,
    fontSize: 14.5,
    color: Palette.ink,
    marginBottom: 2,
  },
  featureDesc: {
    ...Typography.supporting,
    color: Palette.muted,
    lineHeight: 17,
  },
  buttonContainer: {
    width: '100%',
    gap: Spacing.space3,
  },
  completionWrapper: {
    width: '100%',
    alignItems: 'center',
    paddingTop: Spacing.space4,
  },
  celebrationBadgeContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.space4,
  },
  celebrationCircle: {
    width: 90,
    height: 90,
    borderRadius: Radius.full,
    backgroundColor: Palette.forest,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
    shadowColor: Palette.forest,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  pulseRing: {
    position: 'absolute',
    width: 114,
    height: 114,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(197, 243, 107, 0.35)',
    zIndex: 1,
  },
  completedTitle: {
    ...Typography.pageTitle,
    fontSize: 28,
    color: Palette.ink,
    textAlign: 'center',
  },
  completedSubtitle: {
    ...Typography.sectionHeading,
    color: Palette.forest,
    textAlign: 'center',
    marginBottom: Spacing.space5,
  },
  passCard: {
    width: '100%',
    backgroundColor: Palette.white,
    borderRadius: Radius.lg, // 24px
    borderWidth: 1,
    borderColor: Palette.border,
    padding: Spacing.space4,
    marginBottom: Spacing.space5,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  passHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.space3,
  },
  passHeaderLeft: {
    flex: 1,
    marginRight: 8,
  },
  passBrand: {
    ...Typography.cardHeading,
    color: Palette.forest,
    fontSize: 16,
  },
  passCollege: {
    ...Typography.supporting,
    color: Palette.muted,
    fontSize: 12,
  },
  passDivider: {
    height: 1,
    backgroundColor: Palette.surfaceSubtle,
    marginBottom: Spacing.space3,
  },
  passProfileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: Spacing.space4,
  },
  passAvatar: {
    width: 52,
    height: 52,
    borderRadius: Radius.full,
    backgroundColor: Palette.lime,
    alignItems: 'center',
    justifyContent: 'center',
  },
  passAvatarText: {
    ...Typography.pageTitle,
    fontSize: 22,
    color: Palette.ink,
  },
  passProfileMeta: {
    flex: 1,
  },
  passName: {
    ...Typography.cardHeading,
    color: Palette.ink,
  },
  passHandle: {
    ...Typography.supporting,
    color: Palette.forest,
    fontWeight: '700',
    fontFamily: FontFamily.bold,
    fontSize: 12.5,
  },
  passDept: {
    ...Typography.supporting,
    color: Palette.muted,
    fontSize: 12,
  },
  passActivitiesSection: {
    marginBottom: Spacing.space3,
  },
  passSectionLabel: {
    ...Typography.supporting,
    color: Palette.muted,
    fontSize: 11,
    fontWeight: '700',
    fontFamily: FontFamily.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  passChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  passActivityChip: {
    backgroundColor: Palette.surfaceSubtle,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.full,
  },
  passChipText: {
    ...Typography.supporting,
    color: Palette.ink,
    fontSize: 11.5,
    fontWeight: '600',
    fontFamily: FontFamily.medium,
  },
  passClubsSection: {
    marginTop: Spacing.space1,
  },
  passClubsCount: {
    ...Typography.bodyBold,
    color: Palette.forest,
    fontSize: 13,
  },
  enterButtonWrapper: {
    width: '100%',
  },
});
