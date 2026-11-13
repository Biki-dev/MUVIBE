import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Palette, Radius, Spacing, Typography, FontFamily } from '@/constants/theme';
import { ChallengeDifficulty } from '@/types/challenge';

export type DifficultyFilterType = 'all' | ChallengeDifficulty;

interface DifficultyFilterProps {
  selectedDifficulty: DifficultyFilterType;
  onSelectDifficulty: (diff: DifficultyFilterType) => void;
}

const FILTERS: { key: DifficultyFilterType; label: string }[] = [
  { key: 'all', label: 'All Difficulties' },
  { key: 'beginner', label: 'Beginner' },
  { key: 'intermediate', label: 'Intermediate' },
  { key: 'advanced', label: 'Advanced' },
];

export function DifficultyFilter({
  selectedDifficulty,
  onSelectDifficulty,
}: DifficultyFilterProps) {
  return (
    <View style={styles.container}>
      {FILTERS.map((f) => {
        const isActive = selectedDifficulty === f.key;
        return (
          <Pressable
            key={f.key}
            onPress={() => onSelectDifficulty(f.key)}
            style={[
              styles.chip,
              isActive && styles.chipActive,
            ]}>
            <Text
              style={[
                styles.chipText,
                isActive && styles.chipTextActive,
              ]}>
              {f.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: Spacing.space4,
    flexWrap: 'wrap',
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
    backgroundColor: Palette.white,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  chipActive: {
    backgroundColor: Palette.forest,
    borderColor: Palette.forest,
  },
  chipText: {
    ...Typography.supporting,
    fontSize: 11.5,
    fontWeight: '500',
    fontFamily: FontFamily.medium,
    color: Palette.muted,
  },
  chipTextActive: {
    color: Palette.white,
    fontWeight: '700',
    fontFamily: FontFamily.bold,
  },
});
