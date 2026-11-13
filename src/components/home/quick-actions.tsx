import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Palette, Radius, Spacing, Typography, FontFamily } from '@/constants/theme';
import { AppIcon } from '@/components/ui/icon';

interface QuickActionsProps {
  onLogActivity?: () => void;
}

const ACTIONS = [
  {
    id: 'walk',
    label: 'Walk',
    iconName: 'walk',
    iconType: 'mci' as const,
    route: '/activity/walking',
    bg: '#EEF7E0',
    color: Palette.forest,
  },
  {
    id: 'run',
    label: 'Run',
    iconName: 'run',
    iconType: 'mci' as const,
    route: '/activity/running',
    bg: Palette.forest,
    color: Palette.lime,
  },
  {
    id: 'cycle',
    label: 'Cycle',
    iconName: 'bicycle-outline',
    iconType: 'ion' as const,
    route: '/activity/cycling',
    bg: '#EEF7E0',
    color: Palette.forest,
  },
  {
    id: 'gym',
    label: 'Gym',
    iconName: 'barbell-outline',
    iconType: 'ion' as const,
    route: '/activity/gym',
    bg: Palette.forest,
    color: Palette.lime,
  },
  {
    id: 'yoga',
    label: 'Yoga',
    iconName: 'body-outline',
    iconType: 'ion' as const,
    route: '/activity/yoga',
    bg: '#EEF7E0',
    color: Palette.forest,
  },
  {
    id: 'jump',
    label: 'Jumprope',
    iconName: 'timer-outline',
    iconType: 'ion' as const,
    route: '/activity/jump_rope',
    bg: Palette.forest,
    color: Palette.lime,
  },
];

export function QuickActions({ onLogActivity }: QuickActionsProps) {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>Start Activity</Text>
        <Pressable
          onPress={() => router.push('/(tabs)/activity' as any)}
          style={styles.seeMoreBtn}
          hitSlop={8}>
          <Text style={styles.seeMoreText}>All</Text>
          <AppIcon name="arrow-forward" size={12} color={Palette.forest} />
        </Pressable>
      </View>

      <View style={styles.grid}>
        {ACTIONS.map((action) => (
          <Pressable
            key={action.id}
            onPress={() => {
              onLogActivity?.();
              router.push(action.route as any);
            }}
            style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}>
            <View style={[styles.iconCircle, { backgroundColor: action.bg }]}>
              <AppIcon
                name={action.iconName}
                type={action.iconType}
                size={22}
                color={action.color}
              />
            </View>
            <Text style={styles.cardLabel} numberOfLines={1}>
              {action.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.space5,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.space3,
  },
  sectionTitle: {
    ...Typography.sectionHeading,
    color: Palette.ink,
    fontSize: 16,
    fontWeight: '700',
    fontFamily: FontFamily.bold,
  },
  seeMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  seeMoreText: {
    ...Typography.supporting,
    color: Palette.forest,
    fontWeight: '700',
    fontFamily: FontFamily.bold,
    fontSize: 12.5,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.space2 + 2,
  },
  card: {
    width: '30.5%',
    flexGrow: 1,
    backgroundColor: Palette.white,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Palette.border,
    paddingVertical: Spacing.space3,
    paddingHorizontal: Spacing.space2,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 80,
  },
  cardPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.97 }],
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.space2,
  },
  cardLabel: {
    ...Typography.supporting,
    fontSize: 11.5,
    fontWeight: '700',
    fontFamily: FontFamily.bold,
    color: Palette.ink,
    textAlign: 'center',
  },
});
