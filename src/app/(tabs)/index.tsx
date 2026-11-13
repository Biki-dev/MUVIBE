import React, { useState, useCallback, useMemo } from 'react';
import { ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { Palette, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { useCommunity } from '@/context/community-context';
import { useChallenges } from '@/context/challenge-context';
import { getAllActivities } from '@/services/activity-storage';
import { computeStreak, computeStats } from '@/services/activity-stats';
import { ActivityRecord, StreakInfo, ActivityStats } from '@/types/activity';

// Home section components
import { HomeHeader } from '@/components/home/home-header';
import { WeeklyCalendar } from '@/components/home/weekly-calendar';
import { TodayActivity } from '@/components/home/today-activity';
import { QuickActions } from '@/components/home/quick-actions';
import { RecentActivities } from '@/components/home/recent-activities';
import { FitnessSnapshot } from '@/components/home/fitness-snapshot';
import { ActiveChallengesSection } from '@/components/home/active-challenges-section';
import { CommunityHighlights } from '@/components/home/community-highlights';
import { MyClubsHome } from '@/components/home/my-clubs-home';

export default function HomeScreen() {
  const { profile, user } = useAuth();
  const { myClubs } = useCommunity();
  const { activeChallenges } = useChallenges();

  const [activities, setActivities] = useState<ActivityRecord[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    const list = await getAllActivities();
    setActivities(list);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const onRefresh = async () => {
    setIsRefreshing(true);
    await loadData();
    setIsRefreshing(false);
  };

  // Real streak from actual activities
  const streak: StreakInfo = useMemo(() => computeStreak(activities), [activities]);

  // Lifetime stats from all activities
  const allTimeStats: ActivityStats = useMemo(() => computeStats(activities), [activities]);

  // Map CommunityClub[] → simplified shape for MyClubsHome
  const myClubsMapped = useMemo(
    () =>
      myClubs.map((club) => ({
        id: club.id,
        name: club.name,
        category: club.category,
        memberCount: club.memberCount,
        totalPoints: club.totalPoints,
        iconEmoji: undefined as string | undefined,
      })),
    [myClubs]
  );

  // Map Challenge[] → ActiveChallengesSection shape
  const activeChallengesMapped = useMemo(
    () =>
      activeChallenges.map((ch) => ({
        id: ch.id,
        title: ch.title,
        category: ch.category,
        goalKm: ch.measurement === 'distance_km' ? ch.goal : undefined,
        goalSteps: ch.measurement === 'steps' ? ch.goal : undefined,
        difficulty: ch.difficulty,
        startDate: ch.startDate,
        endDate: ch.endDate,
        participantCount: ch.participantsCount,
        rewardPoints: ch.rewardPoints,
        iconName: ch.measurement === 'steps' ? 'footsteps-outline' : 'navigate-outline',
        accentColor: ch.coverGradient?.accent || Palette.forest,
      })),
    [activeChallenges]
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={Palette.forest}
            colors={[Palette.forest]}
          />
        }>
        {/* Section 1 — Personalized greeting + date + streak badge */}
        {/* HomeHeader takes no props: the streak badge moved into
            FitnessSnapshot upstream, but this caller still passed
            currentStreak, which TypeScript rejected. */}
        <HomeHeader />

        {/* Section 2 — Weekly Calendar (real activity states per day) */}
        <WeeklyCalendar activities={activities} streak={streak} />

        {/* Section 3 — Today's real stats from Supabase activities */}
        <TodayActivity activities={activities} />

        {/* Section 4 — Quick activity launchers */}
        <QuickActions />

        {/* Section 5 — Recent activities from Supabase */}
        <RecentActivities activities={activities} />

        {/* Section 6 — Lifetime fitness snapshot (only if user has logged activities) */}
        <FitnessSnapshot
          totalDistanceKm={allTimeStats.totalDistanceKm}
          totalCalories={allTimeStats.totalCalories}
          totalActivities={allTimeStats.activityCount}
          totalMinutes={Math.round(allTimeStats.totalDurationSeconds / 60)}
          currentStreak={streak.currentStreak}
          longestStreak={streak.longestStreak}
        />

        {/* Section 7 — Active challenges from Supabase (if user joined any) */}
        <ActiveChallengesSection challenges={activeChallengesMapped} />

        {/* Section 8 — My clubs (from Supabase membership) */}
        <MyClubsHome clubs={myClubsMapped} />

        {/* Section 9 — Campus feed: recent activities from other athletes */}
        <CommunityHighlights />
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
