/**
 * src/app/club/[id].tsx
 * ─────────────────────────────────────────────────────────────────
 * Comprehensive Club Screen.
 * Connected to Supabase:
 * - Club Profile & Information.
 * - Club-specific Member Leaderboard with full stats (points, km, workouts, steps).
 * - Reddit-like Club Discussion Feed (posts, upvotes/downvotes, comments, links, images).
 * - Club Challenges linked to app challenges.
 * - Dynamic Join / Member status.
 * ─────────────────────────────────────────────────────────────────
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  RefreshControl,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Palette, Radius, Spacing, Typography, FontFamily } from '@/constants/theme';
import { AppIcon } from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { useCommunity } from '@/context/community-context';
import { useAuth } from '@/context/auth-context';
import {
  fetchClubLeaderboard,
  fetchClubPosts,
  fetchClubChallenges,
} from '@/services/community-service';
import { ClubMemberRankItem, ClubDiscussionPost } from '@/types/community';
import { Challenge } from '@/types/challenge';
import { ClubLeaderboardTab } from '@/components/community/clubs/club-leaderboard-tab';
import { ClubDiscussionTab } from '@/components/community/clubs/club-discussion-tab';
import { ClubChallengesTab } from '@/components/community/clubs/club-challenges-tab';

type ClubTab = 'overview' | 'leaderboard' | 'discussion' | 'challenges';

export default function ClubDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ id?: string }>();
  const { user } = useAuth();
  const { getClubById, toggleJoinClub, refreshCommunity } = useCommunity();

  const club = getClubById(params.id || '');
  const [activeTab, setActiveTab] = useState<ClubTab>('overview');

  const [leaderboard, setLeaderboard] = useState<ClubMemberRankItem[]>([]);
  const [posts, setPosts] = useState<ClubDiscussionPost[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadClubData = useCallback(async () => {
    if (!params.id) return;
    try {
      const [lb, psts, chs] = await Promise.all([
        fetchClubLeaderboard(params.id, user?.id),
        fetchClubPosts(params.id, user?.id),
        fetchClubChallenges(params.id, user?.id),
      ]);
      setLeaderboard(lb);
      setPosts(psts);
      setChallenges(chs);
    } catch (err) {
      console.warn('[ClubDetailScreen] loadClubData error:', err);
    }
  }, [params.id, user?.id]);

  useEffect(() => {
    loadClubData();
  }, [loadClubData]);

  const onRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([refreshCommunity(), loadClubData()]);
    setIsRefreshing(false);
  };

  if (!club) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.topHeader}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <AppIcon name="arrow-back" size={24} color={Palette.ink} />
          </Pressable>
          <Text style={styles.topHeaderTitle}>Club Details</Text>
          <View style={{ width: 36 }} />
        </View>
        <View style={styles.notFoundContainer}>
          <Text style={styles.notFoundText}>Club not found.</Text>
          <Button label="Back to Community" onPress={() => router.back()} />
        </View>
      </SafeAreaView>
    );
  }

  const handleToggleJoin = async () => {
    if (club.joined) {
      Alert.alert(
        'Leave Club?',
        `Are you sure you want to leave ${club.name}? Your member contribution will be preserved.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Leave Club',
            style: 'destructive',
            onPress: async () => {
              await toggleJoinClub(club.id);
              await loadClubData();
            },
          },
        ]
      );
    } else {
      await toggleJoinClub(club.id);
      await loadClubData();
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top Header */}
      <View style={styles.topHeader}>
        <Pressable onPress={() => router.back()} style={styles.backButton} hitSlop={10}>
          <AppIcon name="arrow-back" size={24} color={Palette.ink} />
        </Pressable>
        <Text style={styles.topHeaderTitle} numberOfLines={1}>
          {club.name}
        </Text>
        <View style={{ width: 36 }} />
      </View>

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
        {/* 1. Club Header Banner */}
        <View style={[styles.bannerCard, { backgroundColor: club.coverColor || '#18352D' }]}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryBadgeText}>{club.categoryLabel}</Text>
          </View>
          <Text style={styles.bannerTitle}>{club.name}</Text>
          <Text style={styles.bannerCollege}>{club.institution}</Text>
          <View style={styles.memberCountRow}>
            <AppIcon name="people" size={14} color={Palette.lime} />
            <Text style={styles.memberCountText}>
              {club.memberCount.toLocaleString()} registered campus members
            </Text>
          </View>
        </View>

        {/* 2. Sub-Navigation Tabs */}
        <View style={styles.tabsContainer}>
          <Pressable
            onPress={() => setActiveTab('overview')}
            style={[styles.tabButton, activeTab === 'overview' && styles.tabButtonActive]}>
            <Text style={[styles.tabText, activeTab === 'overview' && styles.tabTextActive]}>
              Overview
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setActiveTab('leaderboard')}
            style={[styles.tabButton, activeTab === 'leaderboard' && styles.tabButtonActive]}>
            <Text style={[styles.tabText, activeTab === 'leaderboard' && styles.tabTextActive]}>
              Leaderboard
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setActiveTab('discussion')}
            style={[styles.tabButton, activeTab === 'discussion' && styles.tabButtonActive]}>
            <Text style={[styles.tabText, activeTab === 'discussion' && styles.tabTextActive]}>
              Discussion
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setActiveTab('challenges')}
            style={[styles.tabButton, activeTab === 'challenges' && styles.tabButtonActive]}>
            <Text style={[styles.tabText, activeTab === 'challenges' && styles.tabTextActive]}>
              Challenges
            </Text>
          </Pressable>
        </View>

        {/* Tab 1: Overview */}
        {activeTab === 'overview' && (
          <>
            {/* Club Statistics Grid */}
            <View style={styles.statsCard}>
              <View style={styles.statCol}>
                <Text style={styles.statValue}>{club.memberCount}</Text>
                <Text style={styles.statLabel}>Members</Text>
              </View>

              <View style={styles.statDivider} />

              <View style={styles.statCol}>
                <Text style={styles.statValue}>{club.totalDistanceKm} km</Text>
                <Text style={styles.statLabel}>Distance</Text>
              </View>

              <View style={styles.statDivider} />

              <View style={styles.statCol}>
                <Text style={styles.statValue}>{club.totalPoints.toLocaleString()}</Text>
                <Text style={styles.statLabel}>Total Pts</Text>
              </View>
            </View>

            {/* About the Club */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeaderRow}>
                <View style={styles.sectionIconWrap}>
                  <AppIcon name="information-circle-outline" size={16} color={Palette.forest} />
                </View>
                <Text style={styles.sectionTitle}>About the Club</Text>
              </View>

              <Text style={styles.longDesc}>{club.longDescription || club.description}</Text>

              <View style={styles.meetingLocationBox}>
                <AppIcon name="location-outline" size={16} color={Palette.forest} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.locationTitle}>Meeting Ground</Text>
                  <Text style={styles.locationText}>{club.meetingLocation}</Text>
                </View>
              </View>

              {club.interests && club.interests.length > 0 && (
                <View style={styles.interestsWrap}>
                  <Text style={styles.interestsTitle}>Club Focus & Disciplines</Text>
                  <View style={styles.interestsChipsRow}>
                    {club.interests.map((interest, idx) => (
                      <View key={idx} style={styles.interestChip}>
                        <Text style={styles.interestChipText}>{interest}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </View>
          </>
        )}

        {/* Tab 2: Leaderboard */}
        {activeTab === 'leaderboard' && (
          <ClubLeaderboardTab
            members={leaderboard}
            isJoined={club.joined}
            onJoinPress={handleToggleJoin}
          />
        )}

        {/* Tab 3: Discussion (Reddit-like) */}
        {activeTab === 'discussion' && (
          <ClubDiscussionTab
            clubId={club.id}
            posts={posts}
            isJoined={club.joined}
            userId={user?.id}
            onRefresh={loadClubData}
          />
        )}

        {/* Tab 4: Challenges */}
        {activeTab === 'challenges' && (
          <ClubChallengesTab
            clubName={club.name}
            challenges={challenges}
          />
        )}
      </ScrollView>

      {/* Sticky Bottom Bar */}
      <View
        style={[
          styles.bottomBar,
          { paddingBottom: Math.max(Spacing.space4, insets.bottom + 8) },
        ]}>
        {!club.joined ? (
          <Button
            label="Join Club"
            variant="primary"
            size="lg"
            onPress={handleToggleJoin}
            icon={<AppIcon name="add" size={18} color={Palette.ink} />}
          />
        ) : (
          <View style={styles.joinedActionRow}>
            <View style={styles.joinedBadge}>
              <AppIcon name="checkmark-circle" size={16} color={Palette.forest} />
              <Text style={styles.joinedBadgeText}>Club Member</Text>
            </View>
            <View style={styles.leaveBtnWrap}>
              <Button
                label="Leave Club"
                variant="coral"
                size="md"
                onPress={handleToggleJoin}
              />
            </View>
          </View>
        )}
      </View>
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
    maxWidth: '70%',
    textAlign: 'center',
  },
  notFoundContainer: {
    padding: Spacing.space6,
    alignItems: 'center',
  },
  notFoundText: {
    ...Typography.body,
    color: Palette.muted,
    marginBottom: Spacing.space4,
  },
  scrollContent: {
    paddingHorizontal: Spacing.space4,
    paddingTop: Spacing.space4,
    paddingBottom: Spacing.space6,
    maxWidth: 600,
    width: '100%',
    alignSelf: 'center',
  },
  bannerCard: {
    borderRadius: Radius.card,
    padding: Spacing.space4 + 2,
    marginBottom: Spacing.space3,
  },
  categoryBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
    alignSelf: 'flex-start',
    marginBottom: Spacing.space2,
  },
  categoryBadgeText: {
    ...Typography.supporting,
    fontSize: 11,
    fontWeight: '700',
    fontFamily: FontFamily.bold,
    color: Palette.white,
    letterSpacing: 0.5,
  },
  bannerTitle: {
    ...Typography.pageTitle,
    fontSize: 22,
    lineHeight: 28,
    color: Palette.white,
    marginBottom: 4,
  },
  bannerCollege: {
    ...Typography.body,
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 13,
    marginBottom: Spacing.space2 + 2,
  },
  memberCountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  memberCountText: {
    ...Typography.supporting,
    fontSize: 12,
    color: Palette.lime,
    fontWeight: '700',
    fontFamily: FontFamily.bold,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: Palette.surfaceSubtle,
    borderRadius: Radius.full,
    padding: 3,
    marginBottom: Spacing.space4,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    borderRadius: Radius.full,
  },
  tabButtonActive: {
    backgroundColor: Palette.white,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    elevation: 1,
  },
  tabText: {
    ...Typography.supporting,
    fontSize: 11.5,
    fontWeight: '600',
    fontFamily: FontFamily.medium,
    color: Palette.muted,
  },
  tabTextActive: {
    color: Palette.forest,
    fontWeight: '700',
    fontFamily: FontFamily.bold,
  },
  statsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: Palette.white,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Palette.border,
    paddingVertical: Spacing.space3 + 2,
    marginBottom: Spacing.space4,
  },
  statCol: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    ...Typography.stats,
    fontSize: 16,
    color: Palette.ink,
    marginBottom: 2,
  },
  statLabel: {
    ...Typography.supporting,
    fontSize: 11,
    color: Palette.muted,
  },
  statDivider: {
    width: 1,
    height: 26,
    backgroundColor: Palette.border,
  },
  sectionCard: {
    backgroundColor: Palette.white,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Palette.border,
    padding: Spacing.space4,
    marginBottom: Spacing.space4,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: Spacing.space3,
  },
  sectionIconWrap: {
    width: 26,
    height: 26,
    borderRadius: 6,
    backgroundColor: Palette.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    ...Typography.cardHeading,
    fontSize: 15,
    color: Palette.ink,
  },
  longDesc: {
    ...Typography.body,
    fontSize: 13,
    color: Palette.ink,
    lineHeight: 19,
    marginBottom: Spacing.space4,
  },
  meetingLocationBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: Palette.surfaceHighlight,
    borderRadius: Radius.sm,
    padding: Spacing.space3,
    marginBottom: Spacing.space4,
  },
  locationTitle: {
    ...Typography.supporting,
    fontSize: 11.5,
    fontWeight: '700',
    fontFamily: FontFamily.bold,
    color: Palette.forest,
    marginBottom: 2,
  },
  locationText: {
    ...Typography.body,
    fontSize: 12.5,
    color: Palette.ink,
  },
  interestsWrap: {
    borderTopWidth: 1,
    borderTopColor: Palette.surfaceSubtle,
    paddingTop: Spacing.space3,
  },
  interestsTitle: {
    ...Typography.supporting,
    fontSize: 11.5,
    fontWeight: '700',
    fontFamily: FontFamily.bold,
    color: Palette.muted,
    marginBottom: Spacing.space2,
  },
  interestsChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  interestChip: {
    backgroundColor: Palette.surfaceSubtle,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  interestChipText: {
    ...Typography.supporting,
    fontSize: 11,
    color: Palette.ink,
    fontWeight: '500',
    fontFamily: FontFamily.medium,
  },
  bottomBar: {
    paddingHorizontal: Spacing.space4,
    paddingTop: Spacing.space3,
    paddingBottom: Spacing.space4,
    backgroundColor: Palette.white,
    borderTopWidth: 1,
    borderTopColor: Palette.border,
    maxWidth: 600,
    width: '100%',
    alignSelf: 'center',
  },
  joinedActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.space3,
  },
  joinedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(197, 243, 107, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.btn,
    flex: 1,
  },
  joinedBadgeText: {
    ...Typography.bodyBold,
    fontSize: 13,
    color: Palette.forest,
  },
  leaveBtnWrap: {
    minWidth: 110,
  },
});
