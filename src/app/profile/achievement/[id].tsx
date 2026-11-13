import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Palette, Radius, Spacing, Typography } from '@/constants/theme';
import { AppIcon } from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { INITIAL_ACHIEVEMENTS } from '@/constants/profile-data';

export default function AchievementDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();

  const badge = INITIAL_ACHIEVEMENTS.find((b) => b.id === params.id);

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
    badge.currentProgress && badge.targetGoal
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

          <View
            style={[
              styles.statusPill,
              badge.unlocked ? styles.statusPillUnlocked : styles.statusPillLocked,
            ]}>
            <AppIcon
              name={badge.unlocked ? 'checkmark-circle' : 'lock-closed'}
              size={14}
              color={badge.unlocked ? Palette.forest : Palette.muted}
            />
            <Text
              style={[
                styles.statusPillText,
                badge.unlocked ? styles.statusTextUnlocked : styles.statusTextLocked,
              ]}>
              {badge.unlocked
                ? `Unlocked on ${badge.unlockedDate}`
                : 'Locked Milestone'}
            </Text>
          </View>
        </View>

        {/* Unlock Requirement Card */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeading}>Unlock Requirement</Text>
          <Text style={styles.requirementText}>{badge.unlockRequirement}</Text>

          {badge.currentProgress !== undefined && badge.targetGoal !== undefined && (
            <View style={styles.progressBox}>
              <View style={styles.progressLabelRow}>
                <Text style={styles.progressLabel}>Current Progress</Text>
                <Text style={styles.progressValue}>
                  {badge.currentProgress.toLocaleString()} /{' '}
                  {badge.targetGoal.toLocaleString()} {badge.unit}
                </Text>
              </View>

              <View style={styles.progressBarTrack}>
                <View
                  style={[
                    styles.progressBarFill,
                    { width: `${progressPercent}%` },
                    badge.unlocked && styles.progressFillUnlocked,
                  ]}
                />
              </View>
              <Text style={styles.progressPercent}>{progressPercent}% completed</Text>
            </View>
          )}
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        <Button label="Done" variant="primary" size="lg" onPress={() => router.back()} />
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
  showcaseCard: {
    backgroundColor: Palette.white,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Palette.border,
    padding: Spacing.space5,
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
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 3,
  },
  bigIconCircleLocked: {
    backgroundColor: Palette.surfaceSubtle,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  badgeTitle: {
    ...Typography.cardHeading,
    fontSize: 20,
    color: Palette.ink,
    marginBottom: 6,
    textAlign: 'center',
  },
  badgeDescription: {
    ...Typography.body,
    fontSize: 13.5,
    color: Palette.muted,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: Spacing.space4,
    maxWidth: 300,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
  },
  statusPillUnlocked: {
    backgroundColor: 'rgba(197, 243, 107, 0.35)',
  },
  statusPillLocked: {
    backgroundColor: Palette.surfaceSubtle,
  },
  statusPillText: {
    ...Typography.supporting,
    fontSize: 12,
    fontWeight: '700',
  },
  statusTextUnlocked: {
    color: Palette.forest,
  },
  statusTextLocked: {
    color: Palette.muted,
  },
  sectionCard: {
    backgroundColor: Palette.white,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Palette.border,
    padding: Spacing.space4,
    marginBottom: Spacing.space4,
  },
  sectionHeading: {
    ...Typography.cardHeading,
    fontSize: 14.5,
    color: Palette.ink,
    marginBottom: Spacing.space2,
  },
  requirementText: {
    ...Typography.body,
    fontSize: 13,
    color: Palette.muted,
    lineHeight: 18,
    marginBottom: Spacing.space3,
  },
  progressBox: {
    backgroundColor: Palette.surfaceHighlight,
    borderRadius: Radius.sm,
    padding: Spacing.space3,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressLabel: {
    ...Typography.supporting,
    fontSize: 11.5,
    color: Palette.muted,
  },
  progressValue: {
    ...Typography.bodyBold,
    fontSize: 12,
    color: Palette.ink,
  },
  progressBarTrack: {
    height: 8,
    borderRadius: Radius.full,
    backgroundColor: Palette.surfaceSubtle,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Palette.forest,
    borderRadius: Radius.full,
  },
  progressFillUnlocked: {
    backgroundColor: Palette.lime,
  },
  progressPercent: {
    ...Typography.supporting,
    fontSize: 11,
    color: Palette.muted,
    textAlign: 'right',
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
});
