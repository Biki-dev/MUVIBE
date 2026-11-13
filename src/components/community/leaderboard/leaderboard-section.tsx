import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Palette, Radius, Spacing, Typography } from '@/constants/theme';
import {
  LeaderboardCategory,
  LeaderboardPeriod,
} from '@/types/community';
import {
  INDIVIDUAL_LEADERBOARDS,
  DEPARTMENT_LEADERBOARDS,
  SQUAD_LEADERBOARDS,
} from '@/constants/community-data';
import { PodiumView } from './podium-view';
import { LeaderboardRow } from './leaderboard-row';
import { DepartmentLeaderboard } from './department-leaderboard';
import { SquadLeaderboard } from './squad-leaderboard';
import { MyRankingCard } from './my-ranking-card';

const CATEGORIES: { key: LeaderboardCategory; label: string }[] = [
  { key: 'individual', label: 'Individual' },
  { key: 'department', label: 'Department' },
  { key: 'squad', label: 'Squad' },
];

const PERIODS: { key: LeaderboardPeriod; label: string }[] = [
  { key: 'weekly', label: 'Weekly' },
  { key: 'monthly', label: 'Monthly' },
  { key: 'all_time', label: 'All Time' },
];

export function LeaderboardSection() {
  const [selectedCategory, setSelectedCategory] = useState<LeaderboardCategory>('individual');
  const [selectedPeriod, setSelectedPeriod] = useState<LeaderboardPeriod>('weekly');

  const individualList = INDIVIDUAL_LEADERBOARDS[selectedPeriod] || [];
  const topThree = individualList.slice(0, 3);
  const remainingIndividual = individualList.slice(3);
  const currentUserItem = individualList.find((i) => i.isCurrentUser);

  const departmentsList = DEPARTMENT_LEADERBOARDS[selectedPeriod] || [];
  const squadsList = SQUAD_LEADERBOARDS[selectedPeriod] || [];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerBlock}>
        <Text style={styles.title}>Campus Leaderboard</Text>
        <Text style={styles.subtitle}>
          Your effort. Your community. Your rank.
        </Text>
      </View>

      {/* Primary Category Selector: Individual | Department | Squad */}
      <View style={styles.categoryRow}>
        {CATEGORIES.map((cat) => {
          const isActive = selectedCategory === cat.key;
          return (
            <Pressable
              key={cat.key}
              onPress={() => setSelectedCategory(cat.key)}
              style={[
                styles.categoryBtn,
                isActive && styles.categoryBtnActive,
              ]}>
              <Text
                style={[
                  styles.categoryText,
                  isActive && styles.categoryTextActive,
                ]}>
                {cat.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Time Period Selector: Weekly | Monthly | All Time */}
      <View style={styles.periodRow}>
        {PERIODS.map((p) => {
          const isActive = selectedPeriod === p.key;
          return (
            <Pressable
              key={p.key}
              onPress={() => setSelectedPeriod(p.key)}
              style={[
                styles.periodChip,
                isActive && styles.periodChipActive,
              ]}>
              <Text
                style={[
                  styles.periodText,
                  isActive && styles.periodTextActive,
                ]}>
                {p.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Individual Leaderboard Rendering */}
      {selectedCategory === 'individual' && (
        <>
          {/* Top 3 Podium View */}
          <PodiumView topThree={topThree} />

          {/* Persistent Current User Ranking Card */}
          {currentUserItem && (
            <MyRankingCard
              rank={currentUserItem.rank}
              username={currentUserItem.username}
              points={currentUserItem.points}
              categoryLabel={`${selectedPeriod.toUpperCase()} INDIVIDUAL`}
            />
          )}

          {/* Remaining Ranks List */}
          <Text style={styles.listHeader}>Ranks 4 and Above</Text>
          {remainingIndividual.map((item) => (
            <LeaderboardRow key={item.id} item={item} />
          ))}
        </>
      )}

      {/* Department Leaderboard Rendering */}
      {selectedCategory === 'department' && (
        <DepartmentLeaderboard departments={departmentsList} />
      )}

      {/* Squad Leaderboard Rendering */}
      {selectedCategory === 'squad' && (
        <SquadLeaderboard squads={squadsList} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.space6,
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
  categoryRow: {
    flexDirection: 'row',
    backgroundColor: Palette.surfaceSubtle,
    borderRadius: Radius.btn,
    padding: 3,
    marginBottom: Spacing.space3,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  categoryBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: Radius.sm,
  },
  categoryBtnActive: {
    backgroundColor: Palette.white,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    elevation: 2,
  },
  categoryText: {
    ...Typography.supporting,
    fontSize: 12.5,
    fontWeight: '500',
    color: Palette.muted,
  },
  categoryTextActive: {
    color: Palette.forest,
    fontWeight: '700',
  },
  periodRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: Spacing.space4,
  },
  periodChip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: Radius.full,
    backgroundColor: Palette.white,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  periodChipActive: {
    backgroundColor: Palette.forest,
    borderColor: Palette.forest,
  },
  periodText: {
    ...Typography.supporting,
    fontSize: 11.5,
    fontWeight: '500',
    color: Palette.muted,
  },
  periodTextActive: {
    color: Palette.white,
    fontWeight: '700',
  },
  listHeader: {
    ...Typography.supporting,
    fontSize: 11.5,
    fontWeight: '700',
    color: Palette.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.space2,
    paddingHorizontal: 4,
  },
});
