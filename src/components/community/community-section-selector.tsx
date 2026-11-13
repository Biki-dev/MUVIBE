import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Palette, Radius, Spacing, Typography, FontFamily } from '@/constants/theme';
import { CommunitySection } from '@/context/community-context';
import { AppIcon } from '@/components/ui/icon';

interface CommunitySectionSelectorProps {
  activeSection: CommunitySection;
  onSelectSection: (section: CommunitySection) => void;
}

const SECTIONS: { key: CommunitySection; label: string; icon: string }[] = [
  { key: 'clubs', label: 'Clubs', icon: 'people' },
  { key: 'leaderboard', label: 'Leaderboard', icon: 'trophy' },
  { key: 'events', label: 'Events', icon: 'calendar' },
];

export function CommunitySectionSelector({
  activeSection,
  onSelectSection,
}: CommunitySectionSelectorProps) {
  return (
    <View style={styles.container}>
      {SECTIONS.map((sec) => {
        const isActive = activeSection === sec.key;
        return (
          <Pressable
            key={sec.key}
            onPress={() => onSelectSection(sec.key)}
            style={[
              styles.tabBtn,
              isActive && styles.tabBtnActive,
            ]}>
            <AppIcon
              name={isActive ? sec.icon : `${sec.icon}-outline`}
              size={15}
              color={isActive ? Palette.forest : Palette.muted}
            />
            <Text
              style={[
                styles.tabText,
                isActive && styles.tabTextActive,
              ]}>
              {sec.label}
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
    marginBottom: Spacing.space4,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: Radius.sm,
    gap: 6,
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
    fontWeight: '600',
    fontFamily: FontFamily.medium,
    color: Palette.muted,
  },
  tabTextActive: {
    color: Palette.forest,
    fontWeight: '700',
    fontFamily: FontFamily.bold,
  },
});
