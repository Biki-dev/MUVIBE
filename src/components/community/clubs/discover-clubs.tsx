import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, Pressable } from 'react-native';
import { Palette, Radius, Spacing, Typography } from '@/constants/theme';
import { AppIcon } from '@/components/ui/icon';
import { CommunityClub, ClubCategory } from '@/types/community';
import { ClubCard } from './club-card';
import { EmptyState } from '@/components/challenge/empty-state';

interface DiscoverClubsProps {
  clubs: CommunityClub[];
  onToggleJoin: (id: string) => void;
}

const CATEGORIES: { key: ClubCategory; label: string }[] = [
  { key: 'all', label: 'All Clubs' },
  { key: 'running', label: 'Running' },
  { key: 'cycling', label: 'Cycling' },
  { key: 'sports', label: 'Sports' },
  { key: 'gym_fitness', label: 'Gym & Fitness' },
  { key: 'adventure', label: 'Adventure & Trekking' },
  { key: 'yoga_wellness', label: 'Yoga & Wellness' },
];

export function DiscoverClubs({ clubs, onToggleJoin }: DiscoverClubsProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ClubCategory>('all');
  const [scopeFilter, setScopeFilter] = useState<'all' | 'recommended'>('all');

  const filteredClubs = useMemo(() => {
    return clubs.filter((club) => {
      // Search
      if (searchQuery.trim().length > 0) {
        const query = searchQuery.toLowerCase().trim();
        const matchesName = club.name.toLowerCase().includes(query);
        const matchesDesc = club.description.toLowerCase().includes(query);
        const matchesCat = club.categoryLabel.toLowerCase().includes(query);
        if (!matchesName && !matchesDesc && !matchesCat) return false;
      }

      // Category
      if (selectedCategory !== 'all' && club.category !== selectedCategory) {
        return false;
      }

      // Scope (Recommended)
      if (scopeFilter === 'recommended' && !club.featured && club.memberCount < 100) {
        return false;
      }

      return true;
    });
  }, [clubs, searchQuery, selectedCategory, scopeFilter]);

  return (
    <View style={styles.container}>
      <View style={styles.headerBlock}>
        <Text style={styles.title}>Discover Clubs</Text>
        <Text style={styles.subtitle}>
          Explore communities that share your interests.
        </Text>
      </View>

      {/* Search Input Bar */}
      <View style={styles.searchBar}>
        <AppIcon name="search-outline" size={18} color={Palette.muted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search clubs by name or category..."
          placeholderTextColor={Palette.muted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
            <AppIcon name="close-circle" size={16} color={Palette.muted} />
          </Pressable>
        )}
      </View>

      {/* Scope Selector: All vs Recommended */}
      <View style={styles.scopeRow}>
        <Pressable
          onPress={() => setScopeFilter('all')}
          style={[styles.scopeBtn, scopeFilter === 'all' && styles.scopeBtnActive]}>
          <Text
            style={[styles.scopeText, scopeFilter === 'all' && styles.scopeTextActive]}>
            All Clubs
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setScopeFilter('recommended')}
          style={[styles.scopeBtn, scopeFilter === 'recommended' && styles.scopeBtnActive]}>
          <Text
            style={[
              styles.scopeText,
              scopeFilter === 'recommended' && styles.scopeTextActive,
            ]}>
            Recommended For You
          </Text>
        </Pressable>
      </View>

      {/* Category Chips ScrollView */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoriesScroll}>
        {CATEGORIES.map((cat) => {
          const isActive = selectedCategory === cat.key;
          return (
            <Pressable
              key={cat.key}
              onPress={() => setSelectedCategory(cat.key)}
              style={[styles.catChip, isActive && styles.catChipActive]}>
              <Text
                style={[styles.catChipText, isActive && styles.catChipTextActive]}>
                {cat.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Filtered Clubs List */}
      {filteredClubs.length > 0 ? (
        filteredClubs.map((club) => (
          <ClubCard
            key={club.id}
            club={club}
            onToggleJoin={onToggleJoin}
          />
        ))
      ) : (
        <EmptyState
          iconName="search-outline"
          title="No Clubs Match Your Filter"
          message="Try searching for a different keyword or resetting your category filter."
          actionLabel="Clear Filters"
          onAction={() => {
            setSearchQuery('');
            setSelectedCategory('all');
            setScopeFilter('all');
          }}
        />
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
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Palette.white,
    borderRadius: Radius.btn,
    borderWidth: 1,
    borderColor: Palette.border,
    paddingHorizontal: Spacing.space3,
    paddingVertical: 10,
    marginBottom: Spacing.space3,
  },
  searchInput: {
    flex: 1,
    ...Typography.body,
    fontSize: 13.5,
    color: Palette.ink,
    paddingVertical: 0,
  },
  scopeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: Spacing.space3,
  },
  scopeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
    backgroundColor: Palette.white,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  scopeBtnActive: {
    backgroundColor: Palette.forest,
    borderColor: Palette.forest,
  },
  scopeText: {
    ...Typography.supporting,
    fontSize: 11.5,
    fontWeight: '600',
    color: Palette.muted,
  },
  scopeTextActive: {
    color: Palette.white,
  },
  categoriesScroll: {
    gap: 6,
    paddingBottom: Spacing.space3,
  },
  catChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
    backgroundColor: Palette.surfaceSubtle,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  catChipActive: {
    backgroundColor: Palette.lime,
    borderColor: Palette.lime,
  },
  catChipText: {
    ...Typography.supporting,
    fontSize: 11.5,
    fontWeight: '500',
    color: Palette.ink,
  },
  catChipTextActive: {
    fontWeight: '700',
  },
});
