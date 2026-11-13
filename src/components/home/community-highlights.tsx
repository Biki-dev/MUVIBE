import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Palette, Radius, Spacing, Typography } from '@/constants/theme';
import { AppIcon } from '@/components/ui/icon';

interface HighlightItem {
  id: string;
  userName: string;
  activityInfo: string;
  iconName: string;
  accentColor: string;
}

const HIGHLIGHTS_DATA: HighlightItem[] = [
  {
    id: '1',
    userName: 'User X',
    activityInfo: '1,200 steps',
    iconName: 'footsteps-outline',
    accentColor: Palette.forest,
  },
  {
    id: '2',
    userName: 'User Y',
    activityInfo: '12 kcal burned',
    iconName: 'flame-outline',
    accentColor: Palette.amber,
  },
  {
    id: '3',
    userName: 'User Z',
    activityInfo: '3.5 km travelled',
    iconName: 'navigate-outline',
    accentColor: Palette.electricBlue,
  },
  {
    id: '4',
    userName: 'User A',
    activityInfo: '45 min active time',
    iconName: 'time-outline',
    accentColor: Palette.forest,
  },
  {
    id: '5',
    userName: 'User B',
    activityInfo: '8,000 steps',
    iconName: 'footsteps-outline',
    accentColor: Palette.forest,
  },
];

export function CommunityHighlights() {
  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Community Highlights</Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        {HIGHLIGHTS_DATA.map((item) => (
          <View key={item.id} style={styles.pillCard}>
            {/* User initial avatar */}
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>
                {item.userName.replace('User ', '')}
              </Text>
            </View>

            {/* User name */}
            <Text style={styles.userName}>{item.userName}</Text>

            <Text style={styles.separator}>•</Text>

            {/* Activity icon */}
            <AppIcon name={item.iconName} size={14} color={item.accentColor} />

            {/* Activity info */}
            <Text style={styles.activityInfo}>{item.activityInfo}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.space5,
  },
  sectionTitle: {
    ...Typography.sectionHeading,
    color: Palette.ink,
    marginBottom: Spacing.space3,
  },
  scrollContent: {
    gap: Spacing.space2,
    paddingRight: Spacing.space4,
  },
  pillCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Palette.white,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Palette.border,
    paddingHorizontal: Spacing.space3,
    paddingVertical: Spacing.space1 + 3,
    gap: 6,
  },
  avatarCircle: {
    width: 22,
    height: 22,
    borderRadius: Radius.full,
    backgroundColor: Palette.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    ...Typography.supporting,
    fontSize: 11,
    fontWeight: '700',
    color: Palette.forest,
  },
  userName: {
    ...Typography.bodyBold,
    fontSize: 12.5,
    color: Palette.ink,
  },
  separator: {
    ...Typography.supporting,
    color: Palette.border,
    fontSize: 12,
  },
  activityInfo: {
    ...Typography.supporting,
    fontSize: 12,
    fontWeight: '600',
    color: Palette.muted,
  },
});
