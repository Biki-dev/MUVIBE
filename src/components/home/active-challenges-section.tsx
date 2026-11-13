import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Palette, Radius, Spacing, Typography, FontFamily } from '@/constants/theme';
import { AppIcon } from '@/components/ui/icon';

interface Challenge {
  id: string;
  title: string;
  category: string;
  goalKm?: number;
  goalSteps?: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  startDate: string;
  endDate: string;
  participantCount: number;
  rewardPoints: number;
  iconName: string;
  accentColor: string;
}

interface ActiveChallengesProps {
  challenges?: Challenge[];
}

function getDifficultyColor(d: string): string {
  if (d === 'beginner') return '#1AAC96';
  if (d === 'advanced') return Palette.coral;
  return Palette.amber;
}

function formatDaysRemaining(endDate: string): string {
  const end = new Date(endDate);
  const now = new Date();
  const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diff <= 0) return 'Ended';
  if (diff === 1) return '1 day left';
  return `${diff} days left`;
}

export function ActiveChallengesSection({ challenges = [] }: ActiveChallengesProps) {
  const router = useRouter();

  if (challenges.length === 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>Active Challenges</Text>
        <Pressable
          onPress={() => router.push('/(tabs)/challenges' as any)}
          style={styles.seeAllBtn}
          hitSlop={8}>
          <Text style={styles.seeAllText}>See All</Text>
          <AppIcon name="arrow-forward" size={12} color={Palette.forest} />
        </Pressable>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollRow}>
        {challenges.slice(0, 5).map((ch) => {
          const daysLabel = formatDaysRemaining(ch.endDate);
          const isEnded = daysLabel === 'Ended';

          return (
            <Pressable
              key={ch.id}
              onPress={() => router.push(`/challenge/${ch.id}` as any)}
              style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}>
              {/* Top: icon + difficulty */}
              <View style={styles.cardTop}>
                <View style={[styles.iconCircle, { backgroundColor: ch.accentColor + '22' }]}>
                  <AppIcon name={ch.iconName} size={18} color={ch.accentColor} />
                </View>
                <View
                  style={[
                    styles.diffPill,
                    { backgroundColor: getDifficultyColor(ch.difficulty) + '20' },
                  ]}>
                  <Text
                    style={[
                      styles.diffText,
                      { color: getDifficultyColor(ch.difficulty) },
                    ]}>
                    {ch.difficulty.charAt(0).toUpperCase() + ch.difficulty.slice(1)}
                  </Text>
                </View>
              </View>

              {/* Title */}
              <Text style={styles.cardTitle} numberOfLines={2}>
                {ch.title}
              </Text>

              {/* Goal */}
              <Text style={styles.goalText} numberOfLines={1}>
                {ch.goalKm
                  ? `🎯 ${ch.goalKm} km`
                  : ch.goalSteps
                  ? `🎯 ${ch.goalSteps.toLocaleString()} steps`
                  : ''}
              </Text>

              {/* Footer row */}
              <View style={styles.footerRow}>
                <View style={styles.participantInfo}>
                  <AppIcon name="people-outline" size={11} color={Palette.muted} />
                  <Text style={styles.participantText}>{ch.participantCount}</Text>
                </View>

                <View
                  style={[
                    styles.daysLeftBadge,
                    isEnded && styles.daysLeftBadgeEnded,
                  ]}>
                  <Text
                    style={[
                      styles.daysLeftText,
                      isEnded && styles.daysLeftTextEnded,
                    ]}>
                    {daysLabel}
                  </Text>
                </View>
              </View>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.space3,
  },
  sectionTitle: {
    ...Typography.sectionHeading,
    color: Palette.ink,
    fontSize: 16,
    fontWeight: '700',
    fontFamily: FontFamily.bold,
  },
  seeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  seeAllText: {
    ...Typography.supporting,
    color: Palette.forest,
    fontWeight: '700',
    fontFamily: FontFamily.bold,
    fontSize: 12.5,
  },
  scrollRow: {
    gap: Spacing.space3,
    paddingRight: Spacing.space4,
  },
  card: {
    width: 165,
    backgroundColor: Palette.white,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Palette.border,
    padding: Spacing.space3,
    gap: 6,
  },
  cardPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.97 }],
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  diffPill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  diffText: {
    fontSize: 10,
    fontWeight: '700',
    fontFamily: FontFamily.bold,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '800',
    fontFamily: FontFamily.bold,
    color: Palette.ink,
    lineHeight: 17,
  },
  goalText: {
    fontSize: 11.5,
    fontFamily: FontFamily.regular,
    color: Palette.muted,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  participantInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  participantText: {
    fontSize: 11,
    color: Palette.muted,
    fontWeight: '600',
    fontFamily: FontFamily.medium,
  },
  daysLeftBadge: {
    backgroundColor: 'rgba(197, 243, 107, 0.3)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  daysLeftBadgeEnded: {
    backgroundColor: Palette.surfaceSubtle,
  },
  daysLeftText: {
    fontSize: 10,
    fontWeight: '700',
    fontFamily: FontFamily.bold,
    color: Palette.forest,
  },
  daysLeftTextEnded: {
    color: Palette.muted,
  },
});
