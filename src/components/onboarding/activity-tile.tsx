import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Palette, Radius, Spacing, Typography, FontFamily } from '@/constants/theme';
import { ActivityItem } from '@/types/club';
import { AppIcon } from '@/components/ui/icon';

interface ActivityTileProps {
  activity: ActivityItem;
  isSelected: boolean;
  onToggle: (id: string) => void;
}

export function ActivityTile({ activity, isSelected, onToggle }: ActivityTileProps) {
  // Map icon names to @expo/vector-icons
  const getIcon = () => {
    switch (activity.iconName) {
      case 'walk':
        return <AppIcon name="walk-outline" size={26} color={isSelected ? Palette.ink : Palette.forest} />;
      case 'run':
        return <AppIcon name="flame-outline" size={26} color={isSelected ? Palette.ink : Palette.forest} />;
      case 'bike':
        return <AppIcon name="bicycle-outline" size={26} color={isSelected ? Palette.ink : Palette.forest} />;
      case 'dumbbell':
        return <AppIcon name="barbell-outline" size={26} color={isSelected ? Palette.ink : Palette.forest} />;
      case 'timer':
        return <AppIcon name="timer-outline" size={26} color={isSelected ? Palette.ink : Palette.forest} />;
      case 'soccer':
        return <AppIcon name="football-outline" size={26} color={isSelected ? Palette.ink : Palette.forest} />;
      case 'water':
        return <AppIcon name="water-outline" size={26} color={isSelected ? Palette.ink : Palette.forest} />;
      case 'compass':
        return <AppIcon name="compass-outline" size={26} color={isSelected ? Palette.ink : Palette.forest} />;
      case 'heart':
        return <AppIcon name="fitness-outline" size={26} color={isSelected ? Palette.ink : Palette.forest} />;
      case 'music':
        return <AppIcon name="musical-notes-outline" size={26} color={isSelected ? Palette.ink : Palette.forest} />;
      case 'body':
        return <AppIcon name="body-outline" size={26} color={isSelected ? Palette.ink : Palette.forest} />;
      default:
        return <AppIcon name="sparkles-outline" size={26} color={isSelected ? Palette.ink : Palette.forest} />;
    }
  };

  return (
    <Pressable
      onPress={() => onToggle(activity.id)}
      style={({ pressed }) => [
        styles.tile,
        isSelected ? styles.selectedTile : styles.unselectedTile,
        pressed && styles.pressed,
      ]}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: isSelected }}
      accessibilityLabel={activity.name}>
      {/* Top row with emoji/check indicator */}
      <View style={styles.topRow}>
        <Text style={styles.emoji}>{activity.emoji}</Text>
        <View style={[styles.checkbox, isSelected && styles.selectedCheckbox]}>
          {isSelected && <AppIcon name="checkmark" size={14} color={Palette.ink} />}
        </View>
      </View>

      {/* Main icon */}
      <View style={styles.iconContainer}>{getIcon()}</View>

      {/* Name */}
      <Text
        style={[
          styles.title,
          isSelected ? styles.selectedTitle : styles.unselectedTitle,
        ]}>
        {activity.name}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    borderRadius: Radius.card, // 18px
    padding: Spacing.space3,
    minHeight: 110,
    justifyContent: 'space-between',
    borderWidth: 1.5,
  },
  unselectedTile: {
    backgroundColor: Palette.white,
    borderColor: Palette.border,
  },
  selectedTile: {
    backgroundColor: 'rgba(197, 243, 107, 0.22)',
    borderColor: Palette.lime,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  emoji: {
    fontSize: 18,
    fontFamily: FontFamily.regular,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    borderColor: Palette.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Palette.white,
  },
  selectedCheckbox: {
    backgroundColor: Palette.lime,
    borderColor: Palette.ink,
  },
  iconContainer: {
    alignItems: 'center',
    marginVertical: Spacing.space1,
  },
  title: {
    ...Typography.bodyBold,
    fontSize: 13.5,
    textAlign: 'center',
  },
  unselectedTitle: {
    color: Palette.ink,
  },
  selectedTitle: {
    color: Palette.ink,
    fontWeight: '700',
    fontFamily: FontFamily.bold,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
});
