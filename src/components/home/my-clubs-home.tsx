import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Palette, Radius, Spacing, Typography, FontFamily } from '@/constants/theme';
import { AppIcon } from '@/components/ui/icon';

interface Club {
  id: string;
  name: string;
  category: string;
  memberCount: number;
  totalPoints: number;
  iconEmoji?: string;
}

interface MyClubsHomeProps {
  clubs?: Club[];
}

const CATEGORY_ICON: Record<string, string> = {
  running: 'flash-outline',
  cycling: 'bicycle-outline',
  gym_fitness: 'barbell-outline',
  yoga_wellness: 'body-outline',
  sports: 'basketball-outline',
  adventure: 'compass-outline',
};

export function MyClubsHome({ clubs = [] }: MyClubsHomeProps) {
  const router = useRouter();

  if (clubs.length === 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>My Clubs</Text>
        <Pressable
          onPress={() => router.push('/(tabs)/community' as any)}
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
        {clubs.map((club) => (
          <Pressable
            key={club.id}
            onPress={() => router.push(`/club/${club.id}` as any)}
            style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}>
            <View style={styles.emojiCircle}>
              <Text style={styles.emojiText}>
                {club.iconEmoji || '🏃'}
              </Text>
            </View>

            <Text style={styles.clubName} numberOfLines={2}>
              {club.name}
            </Text>

            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <AppIcon name="people-outline" size={11} color={Palette.muted} />
                <Text style={styles.statText}>{club.memberCount}</Text>
              </View>
              <View style={styles.statItem}>
                <AppIcon name="star-outline" size={11} color={Palette.amber} />
                <Text style={styles.statText}>{club.totalPoints.toLocaleString()} pts</Text>
              </View>
            </View>
          </Pressable>
        ))}

        {/* Discover More card */}
        <Pressable
          onPress={() => router.push('/(tabs)/community' as any)}
          style={[styles.card, styles.discoverCard]}>
          <View style={styles.discoverIcon}>
            <AppIcon name="search-outline" size={22} color={Palette.forest} />
          </View>
          <Text style={styles.discoverText}>Discover{'\n'}Clubs</Text>
        </Pressable>
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
    width: 120,
    backgroundColor: Palette.white,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Palette.border,
    padding: Spacing.space3,
    alignItems: 'center',
    gap: 6,
  },
  cardPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.97 }],
  },
  emojiCircle: {
    width: 44,
    height: 44,
    borderRadius: Radius.full,
    backgroundColor: Palette.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiText: {
    fontSize: 22,
    fontFamily: FontFamily.regular,
  },
  clubName: {
    fontSize: 12,
    fontWeight: '700',
    fontFamily: FontFamily.bold,
    color: Palette.ink,
    textAlign: 'center',
    lineHeight: 16,
  },
  statsRow: {
    gap: 4,
    alignItems: 'center',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  statText: {
    fontSize: 10.5,
    color: Palette.muted,
    fontWeight: '500',
    fontFamily: FontFamily.medium,
  },
  discoverCard: {
    borderStyle: 'dashed',
    borderColor: Palette.forest,
    backgroundColor: Palette.surfaceSubtle,
    justifyContent: 'center',
  },
  discoverIcon: {
    width: 44,
    height: 44,
    borderRadius: Radius.full,
    backgroundColor: Palette.lime,
    alignItems: 'center',
    justifyContent: 'center',
  },
  discoverText: {
    fontSize: 11.5,
    fontWeight: '700',
    fontFamily: FontFamily.bold,
    color: Palette.forest,
    textAlign: 'center',
    lineHeight: 16,
  },
});
