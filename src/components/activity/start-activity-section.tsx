import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Palette, Radius, Spacing, Typography } from '@/constants/theme';
import { AppIcon } from '@/components/ui/icon';
import { ActivityType } from '@/types/activity';

interface ActivityOption {
  type: ActivityType;
  label: string;
  tag: string;
  iconName: string;
  iconType: 'ion' | 'mci';
  subtitle: string;
}

const STARTABLE_ACTIVITIES: ActivityOption[] = [
  {
    type: 'walking',
    label: 'Walking',
    tag: 'Step Counter',
    iconName: 'walk',
    iconType: 'mci',
    subtitle: 'Track steps, pace & distance',
  },
  {
    type: 'running',
    label: 'Running',
    tag: 'GPS / Distance',
    iconName: 'run',
    iconType: 'mci',
    subtitle: 'Track route, pace & splits',
  },
  {
    type: 'cycling',
    label: 'Cycling',
    tag: 'GPS / Speed',
    iconName: 'bicycle-outline',
    iconType: 'ion',
    subtitle: 'Track speed & distance',
  },
  {
    type: 'jump_rope',
    label: 'Jump Rope',
    tag: 'Motion Counter',
    iconName: 'timer-outline',
    iconType: 'ion',
    subtitle: 'Rep cadence & count',
  },
  {
    type: 'gym',
    label: 'Workout / Gym',
    tag: 'Timer & Sets',
    iconName: 'barbell-outline',
    iconType: 'ion',
    subtitle: 'Strength & weight circuits',
  },
  {
    type: 'yoga',
    label: 'Yoga',
    tag: 'Duration Timer',
    iconName: 'body-outline',
    iconType: 'ion',
    subtitle: 'Mindfulness & flexibility',
  },
  {
    type: 'swimming',
    label: 'Swimming',
    tag: 'Session Timer',
    iconName: 'water-outline',
    iconType: 'ion',
    subtitle: 'Laps & duration tracking',
  },
  {
    type: 'hiking',
    label: 'Hiking',
    tag: 'Trail GPS',
    iconName: 'trail-sign-outline',
    iconType: 'ion',
    subtitle: 'Elevation & trail distance',
  },
  {
    type: 'other',
    label: 'Other Activity',
    tag: 'Manual Timer',
    iconName: 'shapes-outline',
    iconType: 'ion',
    subtitle: 'Custom sports & drills',
  },
];

export function StartActivitySection() {
  const router = useRouter();

  const handleSelectActivity = (type: ActivityType) => {
    router.push(`/activity/${type}` as any);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Start a New Activity</Text>
      <Text style={styles.subtitle}>
        Choose an activity and start tracking your progress.
      </Text>

      <View style={styles.grid}>
        {STARTABLE_ACTIVITIES.map((act) => (
          <Pressable
            key={act.type}
            onPress={() => handleSelectActivity(act.type)}
            style={({ pressed }) => [
              styles.tile,
              pressed && styles.tilePressed,
            ]}>
            <View style={styles.topRow}>
              <View style={styles.iconWrap}>
                <AppIcon
                  name={act.iconName}
                  type={act.iconType}
                  size={20}
                  color={Palette.forest}
                />
              </View>
              <View style={styles.tagBadge}>
                <Text style={styles.tagText}>{act.tag}</Text>
              </View>
            </View>

            <View style={styles.contentWrap}>
              <Text style={styles.activityName}>{act.label}</Text>
              <Text style={styles.activityDesc} numberOfLines={1}>
                {act.subtitle}
              </Text>
            </View>

            <View style={styles.actionArrow}>
              <Text style={styles.startActionText}>Start</Text>
              <AppIcon name="arrow-forward" size={14} color={Palette.forest} />
            </View>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.space6,
  },
  sectionTitle: {
    ...Typography.sectionHeading,
    color: Palette.ink,
    marginBottom: 4,
  },
  subtitle: {
    ...Typography.body,
    color: Palette.muted,
    fontSize: 13,
    marginBottom: Spacing.space4,
  },
  grid: {
    gap: Spacing.space3,
  },
  tile: {
    backgroundColor: Palette.white,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Palette.border,
    padding: Spacing.space4,
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
    elevation: 1,
  },
  tilePressed: {
    backgroundColor: Palette.surfaceHighlight,
    borderColor: Palette.lime,
    transform: [{ scale: 0.99 }],
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.space2 + 2,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: Radius.sm,
    backgroundColor: Palette.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tagBadge: {
    backgroundColor: Palette.surfaceSubtle,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  tagText: {
    ...Typography.supporting,
    fontSize: 10.5,
    fontWeight: '600',
    color: Palette.muted,
  },
  contentWrap: {
    marginBottom: Spacing.space3,
  },
  activityName: {
    ...Typography.cardHeading,
    color: Palette.ink,
    fontSize: 16,
    marginBottom: 2,
  },
  activityDesc: {
    ...Typography.supporting,
    color: Palette.muted,
    fontSize: 12.5,
  },
  actionArrow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
    paddingTop: Spacing.space2,
    borderTopWidth: 1,
    borderTopColor: Palette.surfaceSubtle,
  },
  startActionText: {
    ...Typography.supporting,
    color: Palette.forest,
    fontWeight: '700',
    fontSize: 12,
  },
});
