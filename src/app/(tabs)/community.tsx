/**
 * src/app/(tabs)/community.tsx
 * ─────────────────────────────────────────────────────────────────
 * Community Screen.
 * Connected directly to Supabase clubs, joined clubs, discover clubs,
 * and campus-wide club standings.
 * ─────────────────────────────────────────────────────────────────
 */
import React, { useRef, useState, useCallback } from 'react';
import { ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { Palette, Spacing } from '@/constants/theme';
import { useCommunity } from '@/context/community-context';
import { CommunityHeader } from '@/components/community/community-header';
import { MyClubs } from '@/components/community/clubs/my-clubs';
import { DiscoverClubs } from '@/components/community/clubs/discover-clubs';
import { CampusClubsLeaderboard } from '@/components/community/clubs/campus-clubs-leaderboard';

export default function CommunityScreen() {
  const { clubs, myClubs, campusLeaderboard, toggleJoinClub, refreshCommunity } = useCommunity();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const scrollRef = useRef<any>(null);

  useFocusEffect(
    useCallback(() => {
      refreshCommunity();
    }, [refreshCommunity])
  );

  const onRefresh = async () => {
    setIsRefreshing(true);
    await refreshCommunity();
    setIsRefreshing(false);
  };

  const handleExploreClubs = () => {
    scrollRef.current?.scrollTo({ y: 220, animated: true });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        ref={scrollRef}
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
        <CommunityHeader />

        {/* Section 2 — Joined Clubs */}
        <MyClubs
          clubs={myClubs}
          onToggleJoin={toggleJoinClub}
          onExploreClubs={handleExploreClubs}
        />

        {/* Section 3 — Discover Campus Clubs (Search & Filter) */}
        <DiscoverClubs
          clubs={clubs}
          onToggleJoin={toggleJoinClub}
        />

        {/* Section 4 — Campus Club Standings (All Clubs Leaderboard) */}
        <CampusClubsLeaderboard clubs={campusLeaderboard} />
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
