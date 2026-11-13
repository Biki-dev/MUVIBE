import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Palette, Radius, Spacing, Typography } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';

interface HomeHeaderProps {
  currentStreak?: number;
}

export function HomeHeader({ currentStreak = 0 }: HomeHeaderProps) {
  const { profile, user } = useAuth();

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

  const displayName =
    profile.fullName?.trim() ||
    user?.name?.trim() ||
    user?.email?.split('@')[0] ||
    'Athlete';

  const firstName = displayName.split(' ')[0];

  const dateLabel = useMemo(() => {
    const now = new Date();
    return now.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
  }, []);

  return (
    <View style={styles.header}>
      <View style={styles.greetBlock}>
        <Text style={styles.greetText}>
          {greeting}, {firstName} 👋
        </Text>
        <Text style={styles.dateText}>{dateLabel}</Text>
      </View>

      {currentStreak > 0 && (
        <View style={styles.streakBadge}>
          <Text style={styles.streakEmoji}>🔥</Text>
          <Text style={styles.streakCount}>{currentStreak}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.space3,
    marginBottom: Spacing.space3,
  },
  greetBlock: {
    flex: 1,
  },
  greetText: {
    ...Typography.sectionHeading,
    fontSize: 20,
    fontWeight: '800',
    color: Palette.ink,
    letterSpacing: -0.4,
  },
  dateText: {
    ...Typography.supporting,
    color: Palette.muted,
    fontSize: 12.5,
    marginTop: 2,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Palette.forest,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.full,
  },
  streakEmoji: {
    fontSize: 14,
  },
  streakCount: {
    ...Typography.supporting,
    fontSize: 13,
    fontWeight: '800',
    color: Palette.lime,
  },
});
