import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Palette, Radius, Spacing, Typography } from '@/constants/theme';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AppIcon } from '@/components/ui/icon';
import { useAuth } from '@/context/auth-context';
import { ACTIVITIES, SEEDED_CLUBS } from '@/constants/mock-data';

export default function HomeScreen() {
  const router = useRouter();
  const {
    profile,
    selectedActivities,
    joinedClubIds,
    resetAll,
    logout,
  } = useAuth();

  const joinedClubs = SEEDED_CLUBS.filter((c) => joinedClubIds.includes(c.id));
  const myActivities = ACTIVITIES.filter((a) => selectedActivities.includes(a.id));

  const handleReset = async () => {
    Alert.alert(
      'Reset Onboarding',
      'This will clear saved onboarding data and take you back to Screen 01 Splash so you can re-experience the complete onboarding sequence.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            await resetAll();
            router.replace('/');
          },
        },
      ]
    );
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/auth');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Top Header Row */}
        <View style={styles.topHeader}>
          <View>
            <Text style={styles.greetingText}>
              Welcome back, {profile.fullName?.split(' ')[0] || 'Athlete'}
            </Text>
            <View style={styles.campusLocationRow}>
              <AppIcon name="school" size={13} color={Palette.forest} />
              <Text style={styles.collegeNameText} numberOfLines={1}>
                {profile.college || 'Assam Engineering College'}
              </Text>
            </View>
          </View>

          <Pressable
            onPress={() => router.push('/onboarding/customize')}
            style={styles.avatarButton}>
            <View style={styles.avatarBadge}>
              <Text style={styles.avatarEmoji}>
                {profile.fullName ? profile.fullName.charAt(0).toUpperCase() : 'S'}
              </Text>
            </View>
          </Pressable>
        </View>

        {/* Feature Highlight Card (Forest Green Card as specified in theme recommendation) */}
        <Card variant="forest" largeRadius style={styles.highlightCard}>
          <View style={styles.highlightHeader}>
            <Badge label="Campus Leaderboard" variant="lime" />
            <Text style={styles.streakTag}>🔥 3 Day Streak</Text>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>6,420</Text>
              <Text style={styles.statLabel}>Steps Today</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>180</Text>
              <Text style={styles.statLabel}>Campus Points</Text>
            </View>
          </View>

          <View style={styles.campusActivityNotice}>
            <AppIcon name="flash" size={14} color={Palette.lime} />
            <Text style={styles.campusNoticeText}>
              AEC Inter-hostel 5K challenge begins tomorrow morning!
            </Text>
          </View>
        </Card>

        {/* Your Activities Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Your Activities</Text>
            <Pressable
              onPress={() => router.push('/onboarding/activities')}
              hitSlop={8}>
              <Text style={styles.sectionActionText}>Edit</Text>
            </Pressable>
          </View>

          {myActivities.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.activitiesScroll}>
              {myActivities.map((act) => (
                <View key={act.id} style={styles.activityChipCard}>
                  <Text style={styles.activityEmoji}>{act.emoji}</Text>
                  <Text style={styles.activityName}>{act.name}</Text>
                </View>
              ))}
            </ScrollView>
          ) : (
            <Card variant="white" style={styles.emptyCard}>
              <Text style={styles.emptyText}>No activities chosen yet.</Text>
              <Button
                label="Choose Activities"
                variant="outline"
                size="sm"
                fullWidth={false}
                onPress={() => router.push('/onboarding/activities')}
              />
            </Card>
          )}
        </View>

        {/* Joined Clubs Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              My Clubs ({joinedClubs.length})
            </Text>
            <Pressable
              onPress={() => router.push('/onboarding/clubs')}
              hitSlop={8}>
              <Text style={styles.sectionActionText}>Discover More</Text>
            </Pressable>
          </View>

          {joinedClubs.length > 0 ? (
            <View style={styles.clubsList}>
              {joinedClubs.map((club) => (
                <Card key={club.id} variant="white" style={styles.clubCard}>
                  <View style={styles.clubRow}>
                    <View
                      style={[
                        styles.clubLogo,
                        { backgroundColor: club.accentColor || Palette.forest },
                      ]}>
                      <AppIcon
                        name="people"
                        size={18}
                        color={club.accentColor === Palette.lime ? Palette.ink : Palette.white}
                      />
                    </View>
                    <View style={styles.clubMeta}>
                      <Text style={styles.clubName}>{club.name}</Text>
                      <Text style={styles.clubSchedule}>{club.schedule}</Text>
                    </View>
                    <Badge label={club.category} variant="neutral" />
                  </View>
                </Card>
              ))}
            </View>
          ) : (
            <Card variant="white" style={styles.emptyCard}>
              <Text style={styles.emptyText}>You haven't joined any clubs yet.</Text>
              <Button
                label="Browse Campus Clubs"
                variant="primary"
                size="sm"
                fullWidth={false}
                onPress={() => router.push('/onboarding/clubs')}
              />
            </Card>
          )}
        </View>

        {/* Demo & Testing Controls */}
        <View style={styles.devControlsContainer}>
          <Text style={styles.devControlsTitle}>Onboarding Testing & Flow Review</Text>
          <Text style={styles.devControlsSubtitle}>
            Easily restart the 8-screen onboarding flow or switch accounts anytime during development.
          </Text>
          <View style={styles.devButtonsRow}>
            <Button
              label="Restart Onboarding"
              variant="outline"
              size="sm"
              onPress={handleReset}
              style={styles.devButton}
              icon={<AppIcon name="refresh" size={14} color={Palette.forest} />}
            />
            <Button
              label="Log Out"
              variant="outline"
              size="sm"
              onPress={handleLogout}
              style={styles.devButton}
              icon={<AppIcon name="log-out-outline" size={14} color={Palette.coral} />}
            />
          </View>
        </View>
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
    paddingTop: Spacing.space3,
    paddingBottom: Spacing.space8,
    maxWidth: 580,
    width: '100%',
    alignSelf: 'center',
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.space4,
  },
  greetingText: {
    ...Typography.pageTitle,
    fontSize: 22,
    color: Palette.ink,
  },
  campusLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  collegeNameText: {
    ...Typography.supporting,
    color: Palette.muted,
    fontSize: 12.5,
  },
  avatarButton: {
    padding: 2,
  },
  avatarBadge: {
    width: 44,
    height: 44,
    borderRadius: Radius.full,
    backgroundColor: Palette.lime,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Palette.forest,
  },
  avatarEmoji: {
    ...Typography.cardHeading,
    color: Palette.ink,
    fontSize: 18,
  },
  highlightCard: {
    marginBottom: Spacing.space5,
    padding: Spacing.space4 + 2,
  },
  highlightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.space4,
  },
  streakTag: {
    ...Typography.supporting,
    color: Palette.lime,
    fontWeight: '700',
    fontSize: 12.5,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginBottom: Spacing.space4,
  },
  statBox: {
    alignItems: 'center',
  },
  statNumber: {
    ...Typography.stats,
    color: Palette.white,
    fontSize: 32,
  },
  statLabel: {
    ...Typography.supporting,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  campusActivityNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.space3,
    paddingVertical: 8,
  },
  campusNoticeText: {
    ...Typography.supporting,
    color: Palette.white,
    fontSize: 12,
    flex: 1,
  },
  sectionContainer: {
    marginBottom: Spacing.space5,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.space3,
  },
  sectionTitle: {
    ...Typography.sectionHeading,
    color: Palette.ink,
  },
  sectionActionText: {
    ...Typography.supporting,
    color: Palette.forest,
    fontWeight: '700',
    fontSize: 13,
  },
  activitiesScroll: {
    gap: 10,
    paddingRight: Spacing.space4,
  },
  activityChipCard: {
    backgroundColor: Palette.white,
    borderWidth: 1,
    borderColor: Palette.border,
    borderRadius: Radius.card,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  activityEmoji: {
    fontSize: 20,
  },
  activityName: {
    ...Typography.bodyBold,
    color: Palette.ink,
    fontSize: 13.5,
  },
  clubsList: {
    gap: Spacing.space2,
  },
  clubCard: {
    padding: Spacing.space3,
  },
  clubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  clubLogo: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clubMeta: {
    flex: 1,
  },
  clubName: {
    ...Typography.cardHeading,
    fontSize: 14,
    color: Palette.ink,
  },
  clubSchedule: {
    ...Typography.supporting,
    fontSize: 11.5,
    color: Palette.muted,
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: Spacing.space5,
    gap: Spacing.space3,
  },
  emptyText: {
    ...Typography.body,
    color: Palette.muted,
  },
  devControlsContainer: {
    backgroundColor: Palette.white,
    borderWidth: 1,
    borderColor: Palette.border,
    borderRadius: Radius.card,
    padding: Spacing.space4,
    marginTop: Spacing.space4,
  },
  devControlsTitle: {
    ...Typography.cardHeading,
    fontSize: 14,
    color: Palette.forest,
    marginBottom: 4,
  },
  devControlsSubtitle: {
    ...Typography.supporting,
    color: Palette.muted,
    fontSize: 12,
    lineHeight: 16,
    marginBottom: Spacing.space3,
  },
  devButtonsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  devButton: {
    flex: 1,
  },
});
