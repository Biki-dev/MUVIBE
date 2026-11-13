import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Palette, Radius, Spacing, Typography } from '@/constants/theme';
import { AppIcon } from '@/components/ui/icon';
import { getAllActivities } from '@/services/activity-storage';
import { computeStreak } from '@/services/activity-stats';
import { evaluateAchievements } from '@/services/profile-service';
import { useAuth } from '@/context/auth-context';
import { useCommunity } from '@/context/community-context';
import { AchievementBadge } from '@/types/profile';

export default function AchievementsListScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { myClubs } = useCommunity();

  const [filter, setFilter] = useState<'all' | 'unlocked' | 'locked'>('all');
  const [badges, setBadges] = useState<AchievementBadge[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadAchievements() {
      setIsLoading(true);
      const activities = await getAllActivities();
      const streak = computeStreak(activities);
      const evaluated = evaluateAchievements({
        activities,
        streak,
        clubsCount: myClubs.length,
      });
      setBadges(evaluated);
      setIsLoading(false);
    }
    loadAchievements();
  }, [myClubs.length]);

  const filteredBadges = useMemo(() => {
    return badges.filter((b) => {
      if (filter === 'unlocked') return b.unlocked;
      if (filter === 'locked') return !b.unlocked;
      return true;
    });
  }, [badges, filter]);

  const unlockedCount = badges.filter((b) => b.unlocked).length;

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top Header */}
      <View style={styles.topHeader}>
        <Pressable onPress={() => router.back()} style={styles.backButton} hitSlop={10}>
          <AppIcon name="arrow-back" size={24} color={Palette.ink} />
        </Pressable>
        <Text style={styles.topHeaderTitle}>Campus Achievements</Text>
        <View style={{ width: 36 }} />
      </View>

      {isLoading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={Palette.forest} />
          <Text style={styles.loadingText}>Loading achievements...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Banner Summary */}
          <View style={styles.summaryBanner}>
            <View style={styles.trophyCircle}>
              <AppIcon name="trophy" size={24} color={Palette.amber} />
            </View>
            <View style={styles.summaryTextWrap}>
              <Text style={styles.summaryTitle}>
                {unlockedCount} of {badges.length} Badges Unlocked
              </Text>
              <Text style={styles.summarySubtitle}>
                Every session logged on campus advances your milestone badges.
              </Text>
            </View>
          </View>

          {/* Filter Pills */}
          <View style={styles.filtersRow}>
            <Pressable
              onPress={() => setFilter('all')}
              style={[styles.filterChip, filter === 'all' && styles.filterChipActive]}>
              <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
                All ({badges.length})
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setFilter('unlocked')}
              style={[styles.filterChip, filter === 'unlocked' && styles.filterChipActive]}>
              <Text style={[styles.filterText, filter === 'unlocked' && styles.filterTextActive]}>
                Unlocked ({unlockedCount})
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setFilter('locked')}
              style={[styles.filterChip, filter === 'locked' && styles.filterChipActive]}>
              <Text style={[styles.filterText, filter === 'locked' && styles.filterTextActive]}>
                Locked ({badges.length - unlockedCount})
              </Text>
            </Pressable>
          </View>

          {/* Badges List */}
          <View style={styles.badgesList}>
            {filteredBadges.map((badge) => (
              <Pressable
                key={badge.id}
                onPress={() => router.push(`/profile/achievement/${badge.id}` as any)}
                style={({ pressed }) => [
                  styles.badgeCard,
                  !badge.unlocked && styles.badgeCardLocked,
                  pressed && styles.cardPressed,
                ]}>
                <View
                  style={[
                    styles.badgeIconWrap,
                    badge.unlocked
                      ? { backgroundColor: badge.color }
                      : styles.badgeIconWrapLocked,
                  ]}>
                  <AppIcon
                    name={badge.unlocked ? badge.iconName : 'lock-closed'}
                    type={badge.iconType}
                    size={20}
                    color={badge.unlocked ? Palette.forest : Palette.muted}
                  />
                </View>

                <View style={styles.badgeInfo}>
                  <View style={styles.badgeTitleRow}>
                    <Text
                      style={[
                        styles.badgeTitle,
                        !badge.unlocked && styles.badgeTitleLocked,
                      ]}>
                      {badge.title}
                    </Text>
                    {badge.unlocked ? (
                      <View style={styles.unlockedTag}>
                        <AppIcon name="checkmark" size={10} color={Palette.forest} />
                        <Text style={styles.unlockedTagText}>Unlocked</Text>
                      </View>
                    ) : (
                      <View style={styles.lockedTag}>
                        <Text style={styles.lockedTagText}>
                          {badge.currentProgress || 0}/{badge.targetGoal || 1} {badge.unit || ''}
                        </Text>
                      </View>
                    )}
                  </View>

                  <Text style={styles.badgeDescription}>{badge.description}</Text>

                  {badge.unlocked ? (
                    <Text style={styles.dateText}>
                      {badge.unlockedDate ? `Achieved (${badge.unlockedDate})` : 'Achieved'}
                    </Text>
                  ) : (
                    <Text style={styles.reqText}>Requirement: {badge.unlockRequirement}</Text>
                  )}
                </View>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      )}
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
    borderBottomWidth: 1,
    borderBottomColor: Palette.border,
    backgroundColor: Palette.white,
  },
  backButton: {
    padding: 4,
  },
  topHeaderTitle: {
    ...Typography.sectionHeading,
    fontSize: 16,
    color: Palette.ink,
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: 13,
    color: Palette.muted,
  },
  scrollContent: {
    paddingHorizontal: Spacing.space4,
    paddingTop: Spacing.space3,
    paddingBottom: Spacing.space8,
    maxWidth: 600,
    width: '100%',
    alignSelf: 'center',
  },
  summaryBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Palette.white,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Palette.border,
    padding: Spacing.space3 + 2,
    marginBottom: Spacing.space4,
  },
  trophyCircle: {
    width: 44,
    height: 44,
    borderRadius: Radius.full,
    backgroundColor: '#FFF8E8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryTextWrap: {
    flex: 1,
  },
  summaryTitle: {
    ...Typography.cardHeading,
    fontSize: 15,
    color: Palette.ink,
    marginBottom: 2,
  },
  summarySubtitle: {
    ...Typography.supporting,
    fontSize: 11.5,
    color: Palette.muted,
    lineHeight: 16,
  },
  filtersRow: {
    flexDirection: 'row',
    gap: Spacing.space2,
    marginBottom: Spacing.space4,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
    backgroundColor: Palette.white,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  filterChipActive: {
    backgroundColor: Palette.forest,
    borderColor: Palette.forest,
  },
  filterText: {
    ...Typography.supporting,
    fontSize: 12,
    fontWeight: '600',
    color: Palette.ink,
  },
  filterTextActive: {
    color: Palette.white,
    fontWeight: '700',
  },
  badgesList: {
    gap: Spacing.space3,
  },
  badgeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Palette.white,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Palette.border,
    padding: Spacing.space3,
  },
  badgeCardLocked: {
    backgroundColor: '#FAFBF9',
    opacity: 0.85,
  },
  cardPressed: {
    opacity: 0.75,
  },
  badgeIconWrap: {
    width: 46,
    height: 46,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeIconWrapLocked: {
    backgroundColor: '#EBEFEB',
  },
  badgeInfo: {
    flex: 1,
  },
  badgeTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  badgeTitle: {
    ...Typography.cardHeading,
    fontSize: 14.5,
    color: Palette.ink,
  },
  badgeTitleLocked: {
    color: Palette.muted,
  },
  unlockedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: Palette.lime,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  unlockedTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: Palette.forest,
  },
  lockedTag: {
    backgroundColor: Palette.surfaceSubtle,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  lockedTagText: {
    fontSize: 10,
    fontWeight: '600',
    color: Palette.muted,
  },
  badgeDescription: {
    ...Typography.supporting,
    fontSize: 11.5,
    color: Palette.muted,
    lineHeight: 16,
    marginBottom: 4,
  },
  dateText: {
    ...Typography.supporting,
    fontSize: 10.5,
    color: Palette.forest,
    fontWeight: '600',
  },
  reqText: {
    ...Typography.supporting,
    fontSize: 10.5,
    color: Palette.muted,
    fontStyle: 'italic',
  },
});
