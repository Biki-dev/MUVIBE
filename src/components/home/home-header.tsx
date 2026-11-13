import { Palette, Spacing, Typography } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

export function HomeHeader() {
  const { profile, user } = useAuth();

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

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
        <Text style={styles.greetText}>{greeting}</Text>
        <Text style={styles.dateText}>{dateLabel}</Text>
      </View>
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
});