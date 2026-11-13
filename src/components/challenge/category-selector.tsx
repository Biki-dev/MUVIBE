import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Palette, Radius, Spacing, Typography } from '@/constants/theme';
import { ChallengeCategory } from '@/types/challenge';

interface CategorySelectorProps {
  selectedCategory: ChallengeCategory;
  onSelectCategory: (cat: ChallengeCategory) => void;
}

const CATEGORIES: { key: ChallengeCategory; label: string }[] = [
  { key: 'for_you', label: 'For You' },
  { key: 'individual', label: 'Individual' },
  { key: 'squad', label: 'Squad' },
  { key: 'campus', label: 'Campus' },
];

export function CategorySelector({
  selectedCategory,
  onSelectCategory,
}: CategorySelectorProps) {
  return (
    <View style={styles.container}>
      {CATEGORIES.map((cat) => {
        const isActive = selectedCategory === cat.key;
        return (
          <Pressable
            key={cat.key}
            onPress={() => onSelectCategory(cat.key)}
            style={[
              styles.tabBtn,
              isActive && styles.tabBtnActive,
            ]}>
            <Text
              style={[
                styles.tabText,
                isActive && styles.tabTextActive,
              ]}>
              {cat.label}
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
    backgroundColor: Palette.surfaceSubtle,
    borderRadius: Radius.btn,
    padding: 3,
    marginBottom: Spacing.space3,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  tabBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: Radius.sm,
  },
  tabBtnActive: {
    backgroundColor: Palette.white,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    ...Typography.supporting,
    fontSize: 12.5,
    fontWeight: '500',
    color: Palette.muted,
  },
  tabTextActive: {
    color: Palette.forest,
    fontWeight: '700',
  },
});
