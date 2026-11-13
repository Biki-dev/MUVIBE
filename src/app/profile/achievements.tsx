import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Palette, Radius, Spacing, Typography } from '@/constants/theme';
import { AppIcon } from '@/components/ui/icon';
import { INITIAL_ACHIEVEMENTS } from '@/constants/profile-data';

export default function AchievementsListScreen() {
  const router = useRouter();
  const [filter, setFilter] = useState<'all' | 'unlocked' | 'locked'>('all');

  const filteredBadges = useMemo(() => {
    return INITIAL_ACHIEVEMENTS.filter((b) => {
      if (filter === 'unlocked') return b.unlocked;
      if (filter === 'locked') return !b.unlocked;
      return true;
    });
  }, [filter]);

  const unlockedCount = INITIAL_ACHIEVEMENTS.filter((b) => b.unlocked).length;

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

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Banner Summary */}
        <View style={styles.summaryBanner}>
          <View style={styles.trophyCircle}>
            <AppIcon name="trophy" size={24} color={Palette.amber} />
          </View>
          <View style={styles.summaryTextWrap}>
            <Text style={styles.summaryTitle}>
              {unlockedCount} of {INITIAL_ACHIEVEMENTS.length} Badges Unlocked
            </Text>
            <Text style={styles.summarySubtitle}>
              Keep completing campus sessions and challenges to unlock more flair.
            </Text>
          </View>
        </View>

        {/* Filter Pills */}
        <View style={styles.filtersRow}>
          <Pressable
            onPress={() => setFilter('all')}
            style={[styles.filterChip, filter === 'all' && styles.filterChipActive]}>
            <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
              All ({INITIAL_ACHIEVEMENTS.length})
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
              Locked ({INITIAL_ACHIEVEMENTS.length - unlockedCount})
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
                      <Text style={styles.lockedTagText}>Locked</Text>
                    </View>
                  )}
                </View>

                <Text style={styles.badgeDescription}>{badge.description}</Text>

                {badge.unlocked ? (
                  <Text style={styles.dateText}>Earned on {badge.unlockedDate}</Text>
                ) : (
                  <Text style={styles.reqText}>Requirement: {badge.unlockRequirement}</Text>
                )}
              </View>
            </Pressable>
          ))}
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
  scrollContent: {
    paddingHorizontal: Spacing.space4,
    paddingTop: Spacing.space4,
    paddingBottom: Spacing.space6,
    maxWidth: 600,
    width: '100%',
    alignSelf: 'center',
  },
  summaryBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Palette.white,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Palette.border,
    padding: Spacing.space4,
    marginBottom: Spacing.space4,
    gap: 12,
  },
  trophyCircle: {
    width: 48,
    height: 48,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(232, 163, 74, 0.15)',
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
    fontSize: 12,
    color: Palette.muted,
  },
  filtersRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: Spacing.space4,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
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
    color: Palette.muted,
  },
  filterTextActive: {
    color: Palette.white,
    fontWeight: '700',
  },
  badgesList: {
    gap: 10,
  },
  badgeCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Palette.white,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Palette.border,
    padding: Spacing.space4,
    gap: 14,
  },
  badgeCardLocked: {
    backgroundColor: Palette.surfaceHighlight,
    borderStyle: 'dashed',
  },
  cardPressed: {
    backgroundColor: Palette.surfaceHighlight,
  },
  badgeIconWrap: {
    width: 44,
    height: 44,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  badgeIconWrapLocked: {
    backgroundColor: Palette.surfaceSubtle,
  },
  badgeInfo: {
    flex: 1,
  },
  badgeTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 3,
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
    backgroundColor: 'rgba(197, 243, 107, 0.3)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  unlockedTagText: {
    ...Typography.supporting,
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
    ...Typography.supporting,
    fontSize: 10,
    color: Palette.muted,
  },
  badgeDescription: {
    ...Typography.body,
    fontSize: 12.5,
    color: Palette.muted,
    lineHeight: 17,
    marginBottom: 4,
  },
  dateText: {
    ...Typography.supporting,
    fontSize: 11,
    color: Palette.forest,
    fontWeight: '600',
  },
  reqText: {
    ...Typography.supporting,
    fontSize: 11,
    color: Palette.muted,
  },
});
