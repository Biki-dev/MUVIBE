import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Palette, Radius, Spacing, Typography, FontFamily } from '@/constants/theme';
import { AppIcon } from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { getAllActivities } from '@/services/activity-storage';
import { computeStreak } from '@/services/activity-stats';
import { evaluateAchievements } from '@/services/profile-service';
import { useCommunity } from '@/context/community-context';
import { AchievementBadge } from '@/types/profile';

export default function AchievementDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const { myClubs } = useCommunity();

  const [badge, setBadge] = useState<AchievementBadge | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      const activities = await getAllActivities();
      const streak = computeStreak(activities);
      const evaluated = evaluateAchievements({
        activities,
        streak,
        clubsCount: myClubs.length,
      });
      const found = evaluated.find((b) => b.id === params.id);
      setBadge(found || null);
      setIsLoading(false);
    }
    load();
  }, [params.id, myClubs.length]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.topHeader}>
          <Pressable onPress={() => router.back()} style={styles.backButton} hitSlop={10}>
            <AppIcon name="arrow-back" size={24} color={Palette.ink} />
          </Pressable>
          <Text style={styles.topHeaderTitle}>Achievement Details</Text>
          <View style={{ width: 36 }} />
        </View>
        <View style={styles.centerLoading}>
          <ActivityIndicator size="large" color={Palette.forest} />
        </View>
      </SafeAreaView>
    );
  }

  if (!badge) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.topHeader}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <AppIcon name="arrow-back" size={24} color={Palette.ink} />
          </Pressable>
          <Text style={styles.topHeaderTitle}>Achievement Details</Text>
          <View style={{ width: 36 }} />
        </View>
        <View style={styles.notFoundContainer}>
          <Text style={styles.notFoundText}>Achievement not found.</Text>
          <Button label="Back" onPress={() => router.back()} />
        </View>
      </SafeAreaView>
    );
  }

  const progressPercent =
    badge.currentProgress !== undefined && badge.targetGoal
      ? Math.min(100, Math.round((badge.currentProgress / badge.targetGoal) * 100))
      : badge.unlocked
      ? 100
      : 0;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.topHeader}>
        <Pressable onPress={() => router.back()} style={styles.backButton} hitSlop={10}>
          <AppIcon name="arrow-back" size={24} color={Palette.ink} />
        </Pressable>
        <Text style={styles.topHeaderTitle} numberOfLines={1}>
          {badge.title}
        </Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Big Badge Showcase Card */}
        <View style={styles.showcaseCard}>
          <View
            style={[
              styles.bigIconCircle,
              badge.unlocked
                ? { backgroundColor: badge.color }
                : styles.bigIconCircleLocked,
            ]}>
            <AppIcon
              name={badge.unlocked ? badge.iconName : 'lock-closed'}
              type={badge.iconType}
              size={48}
              color={badge.unlocked ? Palette.forest : Palette.muted}
            />
          </View>

          <Text style={styles.badgeTitle}>{badge.title}</Text>
          <Text style={styles.badgeDescription}>{badge.description}</Text>

          {badge.unlocked ? (
            <View style={styles.unlockedStatusWrap}>
              <View style={styles.checkIconWrap}>
                <AppIcon name="checkmark" size={14} color={Palette.forest} />
              </View>
              <Text style={styles.unlockedStatusText}>
                Unlocked {badge.unlockedDate ? `• ${badge.unlockedDate}` : ''}
              </Text>
            </View>
          ) : (
            <View style={styles.lockedStatusWrap}>
              <AppIcon name="lock-closed" size={14} color={Palette.muted} />
              <Text style={styles.lockedStatusText}>Badge Locked</Text>
            </View>
          )}
        </View>

        {/* Progress Breakdown */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeading}>Progress & Milestones</Text>

          <View style={styles.progressRow}>
            <Text style={styles.progressLabel}>Current Progress</Text>
            <Text style={styles.progressValues}>
              {badge.currentProgress || 0} / {badge.targetGoal || 1} {badge.unit}
            </Text>
          </View>

          <View style={styles.progressBarTrack}>
            <View
              style={[
                styles.progressBarFill,
                {
                  width: `${progressPercent}%`,
                  backgroundColor: badge.unlocked ? Palette.forest : Palette.amber,
                },
              ]}
            />
          </View>
          <Text style={styles.percentText}>{progressPercent}% completed</Text>
        </View>

        {/* Unlock Requirement Info */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeading}>How to Unlock</Text>
          <View style={styles.reqBlock}>
            <AppIcon name="information-circle-outline" size={18} color={Palette.forest} />
            <Text style={styles.reqDetailText}>{badge.unlockRequirement}</Text>
          </View>
        </View>

        {/* Action Button */}
        <View style={styles.buttonWrap}>
          <Button
            label="Back to Achievements"
            variant="outline"
            onPress={() => router.back()}
          />
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
    maxWidth: 240,
  },
  centerLoading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: Spacing.space4,
    paddingTop: Spacing.space4,
    paddingBottom: Spacing.space8,
    maxWidth: 600,
    width: '100%',
    alignSelf: 'center',
  },
  showcaseCard: {
    backgroundColor: Palette.white,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Palette.border,
    paddingVertical: Spacing.space5,
    paddingHorizontal: Spacing.space4,
    alignItems: 'center',
    marginBottom: Spacing.space4,
  },
  bigIconCircle: {
    width: 96,
    height: 96,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.space3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 4,
  },
  bigIconCircleLocked: {
    backgroundColor: '#EBEFEB',
  },
  badgeTitle: {
    ...Typography.pageTitle,
    fontSize: 20,
    color: Palette.ink,
    textAlign: 'center',
    marginBottom: 4,
  },
  badgeDescription: {
    ...Typography.body,
    fontSize: 13,
    color: Palette.muted,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 280,
    marginBottom: Spacing.space3,
  },
  unlockedStatusWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Palette.lime,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
  },
  checkIconWrap: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(24, 53, 45, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  unlockedStatusText: {
    fontSize: 12,
    fontWeight: '700',
    fontFamily: FontFamily.bold,
    color: Palette.forest,
  },
  lockedStatusWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Palette.surfaceSubtle,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
  },
  lockedStatusText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: FontFamily.medium,
    color: Palette.muted,
  },
  sectionCard: {
    backgroundColor: Palette.white,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Palette.border,
    padding: Spacing.space4,
    marginBottom: Spacing.space3,
  },
  sectionHeading: {
    ...Typography.sectionHeading,
    fontSize: 14,
    color: Palette.ink,
    marginBottom: Spacing.space3,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  progressLabel: {
    ...Typography.supporting,
    fontSize: 12,
    color: Palette.muted,
  },
  progressValues: {
    ...Typography.supporting,
    fontSize: 12.5,
    fontWeight: '700',
    fontFamily: FontFamily.bold,
    color: Palette.ink,
  },
  progressBarTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: Palette.surfaceSubtle,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  percentText: {
    ...Typography.supporting,
    fontSize: 11,
    color: Palette.muted,
    textAlign: 'right',
  },
  reqBlock: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
    backgroundColor: Palette.surfaceSubtle,
    borderRadius: Radius.sm,
    padding: Spacing.space3,
  },
  reqDetailText: {
    ...Typography.body,
    fontSize: 12.5,
    color: Palette.ink,
    lineHeight: 18,
    flex: 1,
  },
  buttonWrap: {
    marginTop: Spacing.space4,
  },
  notFoundContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.space6,
    gap: 16,
  },
  notFoundText: {
    ...Typography.cardHeading,
    color: Palette.muted,
  },
});
