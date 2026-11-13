import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Palette, Radius, Spacing, Typography } from '@/constants/theme';
import { AppIcon } from '@/components/ui/icon';
import { AchievementBadge } from '@/types/profile';

interface AchievementsSectionProps {
  achievements: AchievementBadge[];
}

export function AchievementsSection({ achievements }: AchievementsSectionProps) {
  const router = useRouter();

  const previewList = achievements.slice(0, 4);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={styles.headerBlock}>
          <Text style={styles.title}>Achievements</Text>
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

      {/* Badges Grid (2x2 preview) */}
      <View style={styles.grid}>
        {previewList.map((badge) => (
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
                styles.iconWrap,
                badge.unlocked
                  ? { backgroundColor: badge.color }
                  : styles.iconWrapLocked,
              ]}>
              <AppIcon
                name={badge.unlocked ? badge.iconName : 'lock-closed'}
                type={badge.iconType}
                size={18}
                color={badge.unlocked ? Palette.forest : Palette.muted}
              />
            </View>

            <View style={styles.textWrap}>
              <View style={styles.titleRow}>
                <Text
                  style={[
                    styles.badgeTitle,
                    !badge.unlocked && styles.badgeTitleLocked,
                  ]}
                  numberOfLines={1}>
                  {badge.title}
                </Text>
                {badge.unlocked && (
                  <View style={styles.unlockedDot} />
                )}
              </View>
              <Text style={styles.badgeDesc} numberOfLines={2}>
                {badge.description}
              </Text>
            </View>
          </Pressable>
        ))}
      </View>
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
  title: {
    ...Typography.sectionHeading,
    color: Palette.ink,
    marginBottom: 2,
  },
  subtitle: {
    ...Typography.body,
    fontSize: 13,
    color: Palette.muted,
  },
  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingVertical: 4,
  },
  viewAllText: {
    ...Typography.supporting,
    fontSize: 12,
    fontWeight: '700',
    color: Palette.forest,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.space3,
  },
  badgeCard: {
    width: '48%',
    flexGrow: 1,
    backgroundColor: Palette.white,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Palette.border,
    padding: Spacing.space3,
    minHeight: 110,
    justifyContent: 'space-between',
  },
  badgeCardLocked: {
    backgroundColor: Palette.surfaceHighlight,
    borderStyle: 'dashed',
  },
  cardPressed: {
    transform: [{ scale: 0.99 }],
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.space2,
  },
  iconWrapLocked: {
    backgroundColor: Palette.surfaceSubtle,
  },
  textWrap: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  badgeTitle: {
    ...Typography.cardHeading,
    fontSize: 13.5,
    color: Palette.ink,
    flex: 1,
  },
  badgeTitleLocked: {
    color: Palette.muted,
  },
  unlockedDot: {
    width: 6,
    height: 6,
    borderRadius: Radius.full,
    backgroundColor: Palette.forest,
  },
  badgeDesc: {
    ...Typography.supporting,
    fontSize: 11,
    color: Palette.muted,
    lineHeight: 15,
  },
});
