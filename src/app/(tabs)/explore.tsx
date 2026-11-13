import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Palette, Radius, Spacing, Typography } from '@/constants/theme';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AppIcon } from '@/components/ui/icon';
import { useAuth } from '@/context/auth-context';
import { SEEDED_CLUBS } from '@/constants/mock-data';

export default function ExploreScreen() {
  const { profile, joinedClubIds, toggleClub } = useAuth();
  const [filter, setFilter] = useState<'all' | 'sports' | 'fitness'>('all');

  const filteredClubs = SEEDED_CLUBS.filter((club) => {
    if (filter === 'sports') return club.category === 'Sports';
    if (filter === 'fitness') return club.category === 'Fitness' || club.category === 'Gym and wellness';
    return true;
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.headerBlock}>
          <Text style={styles.title}>Campus Explore</Text>
          <Text style={styles.subtitle}>
            Discover athletic tournaments, weekend excursions, and fitness crews at {profile.college || 'your campus'}.
          </Text>
        </View>

        {/* Filters */}
        <View style={styles.chipsRow}>
          <Pressable
            onPress={() => setFilter('all')}
            style={[styles.filterChip, filter === 'all' && styles.filterChipActive]}>
            <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
              All Clubs ({SEEDED_CLUBS.length})
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setFilter('fitness')}
            style={[styles.filterChip, filter === 'fitness' && styles.filterChipActive]}>
            <Text style={[styles.filterText, filter === 'fitness' && styles.filterTextActive]}>
              Fitness & Gym
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setFilter('sports')}
            style={[styles.filterChip, filter === 'sports' && styles.filterChipActive]}>
            <Text style={[styles.filterText, filter === 'sports' && styles.filterTextActive]}>
              Sports Teams
            </Text>
          </Pressable>
        </View>

        {/* Clubs Directory */}
        <View style={styles.list}>
          {filteredClubs.map((club) => {
            const isJoined = joinedClubIds.includes(club.id);
            return (
              <Card key={club.id} variant="white" style={styles.clubCard}>
                <View style={styles.clubHeader}>
                  <View style={[styles.clubLogo, { backgroundColor: club.accentColor || Palette.forest }]}>
                    <AppIcon name="flame" size={20} color={club.accentColor === Palette.lime ? Palette.ink : Palette.white} />
                  </View>
                  <View style={styles.clubMeta}>
                    <Text style={styles.clubName}>{club.name}</Text>
                    <Text style={styles.collegeName}>{club.college}</Text>
                  </View>
                  <Button
                    label={isJoined ? 'Joined' : 'Join'}
                    variant={isJoined ? 'primary' : 'outline'}
                    size="sm"
                    fullWidth={false}
                    onPress={() => toggleClub(club.id)}
                    style={styles.joinBtn}
                  />
                </View>

                <Text style={styles.clubDesc}>{club.shortDescription}</Text>

                <View style={styles.clubFooter}>
                  <Badge label={club.category} variant="neutral" />
                  <Text style={styles.membersCount}>{club.memberCount} active members</Text>
                </View>
              </Card>
            );
          })}
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
  scrollContent: {
    paddingHorizontal: Spacing.space4,
    paddingTop: Spacing.space3,
    paddingBottom: Spacing.space8,
    maxWidth: 580,
    width: '100%',
    alignSelf: 'center',
  },
  headerBlock: {
    marginBottom: Spacing.space4,
  },
  title: {
    ...Typography.pageTitle,
    color: Palette.ink,
    marginBottom: Spacing.space1,
  },
  subtitle: {
    ...Typography.body,
    color: Palette.muted,
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: Spacing.space4,
  },
  filterChip: {
    backgroundColor: Palette.white,
    borderWidth: 1,
    borderColor: Palette.border,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: Radius.full,
  },
  filterChipActive: {
    backgroundColor: Palette.forest,
    borderColor: Palette.forest,
  },
  filterText: {
    ...Typography.supporting,
    fontWeight: '600',
    color: Palette.ink,
  },
  filterTextActive: {
    color: Palette.white,
  },
  list: {
    gap: Spacing.space3,
  },
  clubCard: {
    padding: Spacing.space4,
  },
  clubHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: Spacing.space2,
  },
  clubLogo: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clubMeta: {
    flex: 1,
  },
  clubName: {
    ...Typography.cardHeading,
    fontSize: 15,
    color: Palette.ink,
  },
  collegeName: {
    ...Typography.supporting,
    color: Palette.muted,
    fontSize: 12,
  },
  joinBtn: {
    minWidth: 74,
  },
  clubDesc: {
    ...Typography.body,
    fontSize: 13.5,
    color: Palette.ink,
    lineHeight: 18,
    marginBottom: Spacing.space3,
  },
  clubFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Spacing.space2,
    borderTopWidth: 1,
    borderTopColor: Palette.surfaceSubtle,
  },
  membersCount: {
    ...Typography.supporting,
    color: Palette.muted,
    fontSize: 12,
  },
});
