import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Palette, Radius, Spacing, Typography } from '@/constants/theme';
import { AppIcon } from '@/components/ui/icon';
import { CommunityClub } from '@/types/community';
import { useCommunity } from '@/context/community-context';

interface MyClubsSectionProps {
  clubs: CommunityClub[];
}

export function MyClubsSection({ clubs }: MyClubsSectionProps) {
  const router = useRouter();
  const { setActiveSection } = useCommunity();

  const handleGoToClubs = () => {
    setActiveSection('clubs');
    router.push('/(tabs)/community' as any);
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.headerBlock}>
          <Text style={styles.title}>My Clubs</Text>
          <Text style={styles.subtitle}>Communities you are active in.</Text>
        </View>

        <Pressable onPress={handleGoToClubs} style={styles.viewAllBtn} hitSlop={8}>
          <Text style={styles.viewAllText}>View All</Text>
          <AppIcon name="arrow-forward" size={13} color={Palette.forest} />
        </Pressable>
      </View>

      {clubs.length > 0 ? (
        <View style={styles.clubsList}>
          {clubs.map((club) => (
            <Pressable
              key={club.id}
              onPress={() => router.push(`/club/${club.id}` as any)}
              style={({ pressed }) => [styles.clubCard, pressed && styles.cardPressed]}>
              <View style={[styles.avatarBox, { backgroundColor: club.coverColor }]}>
                <AppIcon name="people" size={16} color={Palette.lime} />
              </View>

              <View style={styles.clubInfo}>
                <Text style={styles.clubName} numberOfLines={1}>{club.name}</Text>
                <Text style={styles.clubMeta}>
                  {club.categoryLabel} • {club.memberCount} members
                </Text>
              </View>

              <View style={styles.memberBadge}>
                <Text style={styles.memberBadgeText}>Joined</Text>
              </View>
            </Pressable>
          ))}
        </View>
      ) : (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>You haven't joined any clubs yet.</Text>
          <Pressable onPress={handleGoToClubs} style={styles.discoverBtn}>
            <Text style={styles.discoverText}>Discover Clubs</Text>
          </Pressable>
        </View>
      )}
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
  clubsList: {
    gap: 8,
  },
  clubCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Palette.white,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Palette.border,
    padding: Spacing.space3,
    gap: 12,
  },
  cardPressed: {
    backgroundColor: Palette.surfaceHighlight,
  },
  avatarBox: {
    width: 38,
    height: 38,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clubInfo: {
    flex: 1,
  },
  clubName: {
    ...Typography.bodyBold,
    fontSize: 14,
    color: Palette.ink,
    marginBottom: 2,
  },
  clubMeta: {
    ...Typography.supporting,
    fontSize: 11.5,
    color: Palette.muted,
  },
  memberBadge: {
    backgroundColor: 'rgba(197, 243, 107, 0.3)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  memberBadgeText: {
    ...Typography.supporting,
    fontSize: 11,
    fontWeight: '700',
    color: Palette.forest,
  },
  emptyBox: {
    backgroundColor: Palette.white,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Palette.border,
    padding: Spacing.space4,
    alignItems: 'center',
  },
  emptyText: {
    ...Typography.body,
    fontSize: 13,
    color: Palette.muted,
    marginBottom: Spacing.space3,
  },
  discoverBtn: {
    backgroundColor: Palette.forest,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: Radius.btn,
  },
  discoverText: {
    ...Typography.supporting,
    fontSize: 12,
    fontWeight: '700',
    color: Palette.white,
  },
});
