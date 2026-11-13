import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Palette, Radius, Spacing, Typography } from '@/constants/theme';
import { useChallenges } from '@/context/challenge-context';
import { ChallengeCategory } from '@/types/challenge';
import { ChallengeHeader } from '@/components/challenge/challenge-header';
import { ViewModeToggle, ChallengeViewMode } from '@/components/challenge/view-mode-toggle';
import { FeaturedChallengeCard } from '@/components/challenge/featured-challenge-card';
import { CategorySelector } from '@/components/challenge/category-selector';
import { DifficultyFilter, DifficultyFilterType } from '@/components/challenge/difficulty-filter';
import { ChallengeCard } from '@/components/challenge/challenge-card';
import { ActiveChallengeCard } from '@/components/challenge/active-challenge-card';
import { CompletedChallengeCard } from '@/components/challenge/completed-challenge-card';
import { EmptyState } from '@/components/challenge/empty-state';

export default function ChallengesScreen() {
  const { challenges, activeChallenges, completedChallenges, joinChallenge } = useChallenges();

  const [viewMode, setViewMode] = useState<ChallengeViewMode>('discover');
  const [selectedCategory, setSelectedCategory] = useState<ChallengeCategory>('for_you');
  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyFilterType>('all');
  const [myChallengesTab, setMyChallengesTab] = useState<'active' | 'completed'>('active');

  // Featured challenge
  const featuredChallenge = useMemo(
    () => challenges.find((c) => c.featured) || challenges[0],
    [challenges]
  );

  // Filtered challenges for Discover section
  const discoverChallenges = useMemo(() => {
    return challenges.filter((c) => {
      // 1. Category filter
      if (selectedCategory === 'for_you') {
        // Recommendations: beginner & intermediate across individual & campus
        if (c.category !== 'individual' && c.category !== 'campus') return false;
      } else if (c.category !== selectedCategory) {
        return false;
      }

      // 2. Difficulty filter
      if (selectedDifficulty !== 'all' && c.difficulty !== selectedDifficulty) {
        return false;
      }

      return true;
    });
  }, [challenges, selectedCategory, selectedDifficulty]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Section 1 — Page Header */}
        <ChallengeHeader />

        {/* View Mode Switcher (Discover vs My Challenges) */}
        <ViewModeToggle
          mode={viewMode}
          onModeChange={setViewMode}
          activeCount={activeChallenges.length}
        />

        {viewMode === 'discover' ? (
          <>
            {/* Section 2 — Featured Challenge */}
            {featuredChallenge && (
              <FeaturedChallengeCard
                challenge={featuredChallenge}
                onJoin={joinChallenge}
              />
            )}

            {/* Section 3 — Category Selector */}
            <CategorySelector
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
            />

            {/* Section 4 — Difficulty Filters */}
            <DifficultyFilter
              selectedDifficulty={selectedDifficulty}
              onSelectDifficulty={setSelectedDifficulty}
            />

            {/* Section 5 — Discover Challenges */}
            <View style={styles.discoverHeaderBlock}>
              <Text style={styles.sectionTitle}>Discover Challenges</Text>
              <Text style={styles.sectionSubtitle}>
                Find your next goal and start making progress.
              </Text>
            </View>

            {discoverChallenges.length > 0 ? (
              discoverChallenges.map((challenge) => (
                <ChallengeCard
                  key={challenge.id}
                  challenge={challenge}
                  onJoin={joinChallenge}
                />
              ))
            ) : (
              <EmptyState
                iconName="search-outline"
                title="No Challenges Found"
                message="Try adjusting your category or difficulty filter to view more campus challenges."
                actionLabel="Reset Filters"
                onAction={() => {
                  setSelectedCategory('for_you');
                  setSelectedDifficulty('all');
                }}
              />
            )}
          </>
        ) : (
          /* My Challenges View (Active & Completed) */
          <View style={styles.myChallengesContainer}>
            {/* Sub-tabs: Active vs Completed */}
            <View style={styles.subTabsRow}>
              <Pressable
                onPress={() => setMyChallengesTab('active')}
                style={[
                  styles.subTabBtn,
                  myChallengesTab === 'active' && styles.subTabBtnActive,
                ]}>
                <Text
                  style={[
                    styles.subTabText,
                    myChallengesTab === 'active' && styles.subTabTextActive,
                  ]}>
                  Active ({activeChallenges.length})
                </Text>
              </Pressable>

              <Pressable
                onPress={() => setMyChallengesTab('completed')}
                style={[
                  styles.subTabBtn,
                  myChallengesTab === 'completed' && styles.subTabBtnActive,
                ]}>
                <Text
                  style={[
                    styles.subTabText,
                    myChallengesTab === 'completed' && styles.subTabTextActive,
                  ]}>
                  Completed ({completedChallenges.length})
                </Text>
              </Pressable>
            </View>

            {myChallengesTab === 'active' ? (
              activeChallenges.length > 0 ? (
                activeChallenges.map((ch) => (
                  <ActiveChallengeCard key={ch.id} challenge={ch} />
                ))
              ) : (
                <EmptyState
                  iconName="trophy-outline"
                  title="No Active Challenges Yet"
                  message="Discover exciting fitness challenges across your campus and push your limits."
                  actionLabel="Discover Challenges"
                  onAction={() => setViewMode('discover')}
                />
              )
            ) : completedChallenges.length > 0 ? (
              completedChallenges.map((ch) => (
                <CompletedChallengeCard key={ch.id} challenge={ch} />
              ))
            ) : (
              <EmptyState
                iconName="ribbon-outline"
                title="No Completed Challenges"
                message="Complete active challenges to earn reward points and showcase campus milestones."
                actionLabel="View Active Challenges"
                onAction={() => setMyChallengesTab('active')}
              />
            )}
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
    paddingBottom: Spacing.space8,
    maxWidth: 600,
    width: '100%',
    alignSelf: 'center',
  },
  discoverHeaderBlock: {
    marginBottom: Spacing.space3,
  },
  sectionTitle: {
    ...Typography.sectionHeading,
    color: Palette.ink,
    marginBottom: 2,
  },
  sectionSubtitle: {
    ...Typography.body,
    fontSize: 13,
    color: Palette.muted,
  },
  myChallengesContainer: {
    marginTop: 2,
  },
  subTabsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: Spacing.space4,
  },
  subTabBtn: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: Radius.full,
    backgroundColor: Palette.white,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  subTabBtnActive: {
    backgroundColor: Palette.forest,
    borderColor: Palette.forest,
  },
  subTabText: {
    ...Typography.supporting,
    fontSize: 12,
    fontWeight: '600',
    color: Palette.muted,
  },
  subTabTextActive: {
    color: Palette.white,
    fontWeight: '700',
  },
});
