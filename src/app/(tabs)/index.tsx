import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Palette, Spacing } from '@/constants/theme';
import { HomeHeader } from '@/components/home/home-header';
import { WeeklyCalendar } from '@/components/home/weekly-calendar';
import { TodayActivity } from '@/components/home/today-activity';
import { CommunityHighlights } from '@/components/home/community-highlights';
import { QuickActions } from '@/components/home/quick-actions';
import { ActiveEvents } from '@/components/home/active-events';

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Section 1 — App Header */}
        <HomeHeader />

        {/* Section 2 — Weekly Activity Calendar / Streak Tracker */}
        <WeeklyCalendar />

        {/* Section 3 — Today's Activity Summary */}
        <TodayActivity />

        {/* Section 4 — Community Activity Highlights */}
        <CommunityHighlights />

        {/* Section 5 — Quick Actions */}
        <QuickActions />

        {/* Section 6 — Active and Upcoming Events */}
        <ActiveEvents />
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
