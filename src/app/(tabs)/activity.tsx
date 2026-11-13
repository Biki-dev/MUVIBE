import React, { useState, useCallback } from 'react';
import { ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { Palette, Spacing } from '@/constants/theme';
import { ActivityRecord, ActivityStats, PeriodType, StreakInfo } from '@/types/activity';
import { getAllActivities } from '@/services/activity-storage';
import { computeStats, computeStreak, filterByPeriod } from '@/services/activity-stats';
import { ActivityHeader } from '@/components/activity/activity-header';
import { ActivityStatsSection } from '@/components/activity/activity-stats-section';
import { ActivityStreakSection } from '@/components/activity/activity-streak-section';
import { StartActivitySection } from '@/components/activity/start-activity-section';

export default function ActivityScreen() {
  const [period, setPeriod] = useState<PeriodType>('day');
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

  const filtered = filterByPeriod(activities, period);
  const stats: ActivityStats = computeStats(filtered);
  const streak: StreakInfo = computeStreak(activities);

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
        {/* Section 1 — Page Header */}
        <ActivityHeader />

        {/* Section 2 — Activity Statistics */}
        <ActivityStatsSection
          period={period}
          onPeriodChange={setPeriod}
          stats={stats}
        />

        {/* Section 3 — Activity Streak */}
        <ActivityStreakSection streak={streak} />

        {/* Section 4 — Start New Activity */}
        <StartActivitySection />
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
