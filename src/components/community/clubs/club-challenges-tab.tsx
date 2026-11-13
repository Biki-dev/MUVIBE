import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Palette, Radius, Spacing, Typography } from '@/constants/theme';
import { AppIcon } from '@/components/ui/icon';
import { ChallengeCard } from '@/components/challenge/challenge-card';
import { Challenge } from '@/types/challenge';
import { useChallenges } from '@/context/challenge-context';

interface ClubChallengesTabProps {
  clubName: string;
  challenges: Challenge[];
}

export function ClubChallengesTab({ clubName, challenges }: ClubChallengesTabProps) {
  const router = useRouter();
  const { joinChallenge } = useChallenges();

  if (!challenges || challenges.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <AppIcon name="trophy-outline" size={32} color={Palette.muted} />
        <Text style={styles.emptyTitle}>No Active Club Challenges</Text>
        <Text style={styles.emptySubtitle}>
          Check back soon! {clubName} organizers will post new distance and step milestones.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerBlock}>
        <Text style={styles.title}>{clubName} Milestones</Text>
        <Text style={styles.subtitle}>
          Join club-sponsored challenges to earn extra campus points and push the club standings!
        </Text>
      </View>

      <View style={styles.challengesList}>
        {challenges.map((challenge) => (
          <ChallengeCard
            key={challenge.id}
            challenge={challenge}
            onJoin={joinChallenge}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: Spacing.space2,
  },
  headerBlock: {
    marginBottom: Spacing.space4,
  },
  title: {
    ...Typography.sectionHeading,
    fontSize: 16,
    color: Palette.ink,
    marginBottom: 4,
  },
  subtitle: {
    ...Typography.body,
    fontSize: 13,
    color: Palette.muted,
  },
  challengesList: {
    gap: Spacing.space3,
  },
  emptyContainer: {
    backgroundColor: Palette.white,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Palette.border,
    padding: Spacing.space5,
    alignItems: 'center',
    marginVertical: Spacing.space3,
  },
  emptyTitle: {
    ...Typography.cardHeading,
    fontSize: 15,
    color: Palette.ink,
    marginTop: Spacing.space2,
    marginBottom: 4,
  },
  emptySubtitle: {
    ...Typography.body,
    fontSize: 13,
    color: Palette.muted,
    textAlign: 'center',
  },
});
