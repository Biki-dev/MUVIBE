import { FontFamily, Palette, Radius, Spacing, Typography } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

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
  headerContainer: {
    paddingVertical: Spacing.space2,
    marginBottom: Spacing.space3,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandCol: {
    flex: 1,
    paddingTop: 4,
    justifyContent: 'flex-start',
  },
  brandTitle: {
    ...Typography.pageTitle,
    color: Palette.forest,
    letterSpacing: -0.5,
    fontWeight: '900',
    fontSize: 32,
    lineHeight: 36,
  },
  campusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(24, 53, 45, 0.08)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
    alignSelf: 'flex-start',
    marginTop: 4,
    maxWidth: 240,
  },
  pulsingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#34D399',
  },
  campusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: Palette.forest,
  },
  subtitle: {
    fontSize: 12,
    color: Palette.muted,
    fontWeight: '500',
    marginTop: 6,
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
    fontFamily: FontFamily.bold,
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
