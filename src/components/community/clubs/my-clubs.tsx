import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Palette, Spacing, Typography } from '@/constants/theme';
import { CommunityClub } from '@/types/community';
import { ClubCard } from './club-card';
import { EmptyState } from '@/components/challenge/empty-state';

interface MyClubsProps {
  clubs: CommunityClub[];
  onToggleJoin: (id: string) => void;
  onExploreClubs: () => void;
}

export function MyClubs({ clubs, onToggleJoin, onExploreClubs }: MyClubsProps) {
  return (
    <View style={styles.container}>
      <View style={styles.headerBlock}>
        <Text style={styles.title}>My Clubs</Text>
        <Text style={styles.subtitle}>Your communities, all in one place.</Text>
      </View>

      {clubs.length > 0 ? (
        clubs.map((club) => (
          <ClubCard
            key={club.id}
            club={club}
            onToggleJoin={onToggleJoin}
          />
        ))
      ) : (
        <EmptyState
          iconName="people-circle-outline"
          title="You haven't joined any clubs yet."
          message="Discover a campus community that matches your interests and start moving together."
          actionLabel="Discover Clubs"
          onAction={onExploreClubs}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.space5,
  },
  headerBlock: {
    marginBottom: Spacing.space3,
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
});
