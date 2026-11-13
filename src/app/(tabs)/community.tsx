/**
 * src/app/(tabs)/community.tsx
 * ─────────────────────────────────────────────────────────────────
 * Community Screen.
 * Connected directly to Supabase clubs, joined clubs, discover clubs,
 * and campus-wide club standings.
 * ─────────────────────────────────────────────────────────────────
 */
import React, { useRef, useState, useCallback } from 'react';
import { ScrollView, StyleSheet, RefreshControl, View, Text, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { Palette, Radius, Spacing, Typography, FontFamily } from '@/constants/theme';
import { AppIcon } from '@/components/ui/icon';
import { useCommunity } from '@/context/community-context';
import { CommunityHeader } from '@/components/community/community-header';
import { MyClubs } from '@/components/community/clubs/my-clubs';
import { DiscoverClubs } from '@/components/community/clubs/discover-clubs';
import { CampusClubsLeaderboard } from '@/components/community/clubs/campus-clubs-leaderboard';
import { NearbySection } from '@/components/community/nearby/nearby-section';

type View_ = 'clubs' | 'nearby';

export default function CommunityScreen() {
  const { clubs, myClubs, campusLeaderboard, toggleJoinClub, refreshCommunity } = useCommunity();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [view, setView] = useState<View_>('clubs');
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

        {/* Clubs / Near me switch */}
        <View style={styles.switch}>
          {(
            [
              { key: 'clubs', label: 'Clubs', icon: 'people' },
              { key: 'nearby', label: 'Near me', icon: 'navigate' },
            ] as { key: View_; label: string; icon: string }[]
          ).map((t) => {
            const active = view === t.key;
            return (
              <Pressable
                key={t.key}
                onPress={() => setView(t.key)}
                style={[styles.switchBtn, active && styles.switchBtnActive]}>
                <AppIcon
                  name={active ? t.icon : `${t.icon}-outline`}
                  size={15}
                  color={active ? Palette.forest : Palette.muted}
                />
                <Text style={[styles.switchText, active && styles.switchTextActive]}>{t.label}</Text>
              </Pressable>
            );
          })}
        </View>

        {view === 'nearby' ? (
          <NearbySection />
        ) : (
          <>
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
          </>
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
    paddingBottom: Spacing.space8,
    maxWidth: 600,
    width: '100%',
    alignSelf: 'center',
  },
  switch: {
    flexDirection: 'row',
    backgroundColor: Palette.surfaceSubtle,
    borderRadius: Radius.btn,
    padding: 3,
    marginBottom: Spacing.space4,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  switchBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: Radius.sm,
    gap: 6,
  },
  switchBtnActive: {
    backgroundColor: Palette.white,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    elevation: 2,
  },
  switchText: {
    ...Typography.supporting,
    fontSize: 12.5,
    fontFamily: FontFamily.medium,
    color: Palette.muted,
  },
  switchTextActive: {
    color: Palette.forest,
    fontFamily: FontFamily.bold,
  },
});
