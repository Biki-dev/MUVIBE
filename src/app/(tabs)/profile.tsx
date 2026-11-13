import React, { useState, useCallback, useMemo } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { Palette, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { useCommunity } from '@/context/community-context';
import { getAllActivities } from '@/services/activity-storage';
import { computeStreak } from '@/services/activity-stats';
import { evaluateAchievements, fetchUserSocialStats } from '@/services/profile-service';
import { ActivityRecord, StreakInfo } from '@/types/activity';
import { ProfileFitnessOverview, UserConnectionItem } from '@/types/profile';

import { RankCard } from '@/components/game/rank-card';
import { ProfileHeader } from '@/components/profile/profile-header';
import { UserProfileCard } from '@/components/profile/user-profile-card';
import { FitnessOverview } from '@/components/profile/fitness-overview';
import { ConsistencyCard } from '@/components/profile/consistency-card';
import { AchievementsSection } from '@/components/profile/achievements-section';
import { MyClubsSection } from '@/components/profile/my-clubs-section';
import { MyChallengesSection } from '@/components/profile/my-challenges-section';
import { ActivityHighlights } from '@/components/profile/activity-highlights';
import { SettingsList } from '@/components/profile/settings-list';

export default function ProfileScreen() {
  const { user, profile, refreshProfile } = useAuth();
  const { myClubs } = useCommunity();

  const [activities, setActivities] = useState<ActivityRecord[]>([]);
  const [socialStats, setSocialStats] = useState<{
    followers: UserConnectionItem[];
    following: UserConnectionItem[];
    pendingIncoming: UserConnectionItem[];
  }>({
    followers: [],
    following: [],
    pendingIncoming: [],
  });

  const loadData = useCallback(async () => {
    // 1. Refresh profile from DB
    await refreshProfile();

    // 2. Fetch real activities
    const list = await getAllActivities();
    setActivities(list);

    // 3. Fetch social connections if user is logged in
    if (user?.id) {
      const social = await fetchUserSocialStats(user.id);
      setSocialStats(social);
    }
  }, [user?.id, refreshProfile]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  // Lifetime fitness overview — purely from real activities
  const fitnessOverview: ProfileFitnessOverview = useMemo(() => {
    if (!activities || activities.length === 0) {
      return {
        activeMinutes: 0,
        totalDistanceKm: 0,
        totalSteps: 0,
        totalActivities: 0,
      };
    }

    let totalDurationSec = 0;
    let totalDistKm = 0;
    let totalSteps = 0;

    for (const act of activities) {
      totalDurationSec += act.durationSeconds || 0;
      if (act.distanceKm) totalDistKm += act.distanceKm;
      if (act.steps) totalSteps += act.steps;
    }

    return {
      activeMinutes: Math.round(totalDurationSec / 60),
      totalDistanceKm: Number(totalDistKm.toFixed(1)),
      totalSteps,
      totalActivities: activities.length,
    };
  }, [activities]);

  // Compute streak from real activities
  const streakInfo: StreakInfo = useMemo(() => {
    return computeStreak(activities);
  }, [activities]);

  // Dynamically evaluate achievements from real activities & clubs & social
  const achievements = useMemo(() => {
    return evaluateAchievements({
      activities,
      streak: streakInfo,
      clubsCount: myClubs.length,
      connectionsCount: socialStats.followers.length,
    });
  }, [activities, streakInfo, myClubs.length, socialStats.followers.length]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Section 1 — Page Header (no settings icon) */}
        <ProfileHeader />

        {/* Section 2 — User Profile Card (with followers/following & search) */}
        <UserProfileCard
          profile={profile}
          currentUserId={user?.id}
          activitiesCount={activities.length}
          followers={socialStats.followers}
          following={socialStats.following}
          pendingRequests={socialStats.pendingIncoming}
          onRefreshSocial={loadData}
        />

        {/* Section 3 — Rank, XP and tier. The hero of this screen. */}
        <RankCard />

        {/* Section 4 — Fitness Overview (real data) */}
        <FitnessOverview overview={fitnessOverview} />

        {/* Section 4 — Activity Streak (Your Consistency) */}
        <ConsistencyCard streak={streakInfo} />

        {/* Section 5 — Achievements & Badges (borderless icons, real logic) */}
        <AchievementsSection achievements={achievements} />

        {/* Section 6 — My Clubs */}
        <MyClubsSection clubs={myClubs} />

        {/* Section 7 — My Challenges */}
        <MyChallengesSection />

        {/* Section 8 — Activity Highlights (real data) */}
        <ActivityHighlights activities={activities} />

        {/* Section 9 — Settings & Account */}
        <SettingsList />
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
    paddingBottom: Spacing.space8,
    maxWidth: 600,
    width: '100%',
    alignSelf: 'center',
  },
});
