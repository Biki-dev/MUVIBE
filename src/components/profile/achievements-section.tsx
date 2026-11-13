import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Palette, Radius, Spacing, Typography } from '@/constants/theme';
import { AppIcon } from '@/components/ui/icon';
import { AchievementBadge } from '@/types/profile';

interface AchievementsSectionProps {
  achievements: AchievementBadge[];
}

export function AchievementsSection({ achievements }: AchievementsSectionProps) {
  const router = useRouter();

  const previewList = achievements.slice(0, 6);
  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={styles.headerBlock}>
          <View style={styles.titleWithBadge}>
            <Text style={styles.title}>Achievements</Text>
            <View style={styles.countPill}>
              <Text style={styles.countPillText}>
                {unlockedCount}/{achievements.length}
              </Text>
            </View>
          </View>
          <Text style={styles.subtitle}>Every milestone deserves recognition.</Text>
        </View>

        <Pressable
          onPress={() => router.push('/profile/achievements' as any)}
          style={styles.viewAllBtn}
          hitSlop={8}>
          <Text style={styles.viewAllText}>View All</Text>
          <AppIcon name="arrow-forward" size={13} color={Palette.forest} />
        </Pressable>
      </View>

      {/* Borderless Badge Icons (pure emblems without card borders) */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.badgesRow}>
        {previewList.map((badge) => {
          const isUnlocked = badge.unlocked;

          return (
            <Pressable
              key={badge.id}
              onPress={() => router.push(`/profile/achievement/${badge.id}` as any)}
              style={({ pressed }) => [styles.badgeItem, pressed && styles.badgeItemPressed]}>
              {/* Circular Emblem — No borders, clean circular badge */}
              <View
                style={[
                  styles.emblemCircle,
                  isUnlocked
                    ? { backgroundColor: badge.color }
                    : styles.emblemCircleLocked,
                ]}>
                <AppIcon
                  name={isUnlocked ? badge.iconName : 'lock-closed'}
                  type={badge.iconType}
                  size={24}
                  color={isUnlocked ? Palette.forest : Palette.muted}
                />
                {isUnlocked && <View style={styles.unlockedDot} />}
              </View>

              {/* Title underneath */}
              <Text
                style={[styles.badgeTitle, !isUnlocked && styles.badgeTitleLocked]}
                numberOfLines={1}>
                {badge.title}
              </Text>
              <Text style={styles.badgeProgressText} numberOfLines={1}>
                {isUnlocked
                  ? 'Unlocked'
                  : `${badge.currentProgress || 0}/${badge.targetGoal || 1} ${badge.unit || ''}`}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.space5,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: Spacing.space3,
  },
  headerBlock: {
    flex: 1,
    paddingRight: 8,
  },
  titleWithBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    ...Typography.sectionHeading,
    color: Palette.ink,
  },
  countPill: {
    backgroundColor: Palette.forest,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  countPillText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: Palette.lime,
  },
  subtitle: {
    ...Typography.supporting,
    color: Palette.muted,
    fontSize: 12,
    marginTop: 2,
  },
  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingTop: 2,
  },
  viewAllText: {
    ...Typography.supporting,
    color: Palette.forest,
    fontWeight: '700',
    fontSize: 12.5,
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.space3,
    paddingVertical: Spacing.space1,
  },
  badgeItem: {
    alignItems: 'center',
    width: 78,
  },
  badgeItemPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.96 }],
  },
  emblemCircle: {
    width: 58,
    height: 58,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 5,
    elevation: 3,
    position: 'relative',
  },
  emblemCircleLocked: {
    backgroundColor: '#EBEFEB',
    shadowOpacity: 0.02,
    elevation: 1,
  },
  unlockedDot: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Palette.forest,
    borderWidth: 1.5,
    borderColor: Palette.white,
  },
  badgeTitle: {
    ...Typography.supporting,
    fontSize: 11.5,
    fontWeight: '700',
    color: Palette.ink,
    textAlign: 'center',
    width: '100%',
  },
  badgeTitleLocked: {
    color: Palette.muted,
    fontWeight: '500',
  },
  badgeProgressText: {
    ...Typography.supporting,
    fontSize: 10,
    color: Palette.muted,
    textAlign: 'center',
    marginTop: 1,
  },
});
