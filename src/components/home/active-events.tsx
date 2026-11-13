import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Palette, Radius, Spacing, Typography } from '@/constants/theme';
import { AppIcon } from '@/components/ui/icon';

interface EventItem {
  id: string;
  name: string;
  category: string;
  distance: string;
  estimatedDuration?: string;
  eventDate: string;
  remainingDays: number;
  iconName: string;
}

const EVENTS_DATA: EventItem[] = [
  {
    id: 'event-1',
    name: 'Run Marathon',
    category: 'Running',
    distance: '12 km',
    estimatedDuration: '2 hours',
    eventDate: 'Nov 25, 2026',
    remainingDays: 12,
    iconName: 'flame-outline',
  },
  {
    id: 'event-2',
    name: 'Cycling Competition',
    category: 'Cycling',
    distance: '24 km',
    eventDate: 'Dec 17, 2026',
    remainingDays: 34,
    iconName: 'bicycle-outline',
  },
];

interface ActiveEventsProps {
  onEventPress?: (event: EventItem) => void;
}

export function ActiveEvents({ onEventPress }: ActiveEventsProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Active Events</Text>

      <View style={styles.eventsList}>
        {EVENTS_DATA.map((event) => (
          <Pressable
            key={event.id}
            onPress={() => onEventPress?.(event)}
            style={({ pressed }) => [
              styles.eventCard,
              pressed && styles.pressed,
            ]}>
            {/* Top header row: Category pill on left, Remaining badge on right */}
            <View style={styles.headerRow}>
              <View style={styles.categoryBadge}>
                <AppIcon name={event.iconName} size={13} color={Palette.forest} />
                <Text style={styles.categoryText}>{event.category}</Text>
              </View>

              <View style={styles.remainingBadge}>
                <Text style={styles.remainingText}>
                  {event.remainingDays} days left
                </Text>
              </View>
            </View>

            {/* Event Name */}
            <Text style={styles.eventName}>{event.name}</Text>

            {/* Event Details: Distance, Duration (if any), Date */}
            <View style={styles.detailsRow}>
              <View style={styles.detailItem}>
                <AppIcon name="navigate-outline" size={13} color={Palette.muted} />
                <Text style={styles.detailText}>{event.distance}</Text>
              </View>

              {event.estimatedDuration && (
                <View style={styles.detailItem}>
                  <AppIcon name="time-outline" size={13} color={Palette.muted} />
                  <Text style={styles.detailText}>{event.estimatedDuration}</Text>
                </View>
              )}

              <View style={styles.detailItem}>
                <AppIcon name="calendar-outline" size={13} color={Palette.muted} />
                <Text style={styles.detailText}>{event.eventDate}</Text>
              </View>
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
    marginBottom: Spacing.space3,
  },
  eventsList: {
    gap: Spacing.space3,
  },
  eventCard: {
    backgroundColor: Palette.white,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Palette.border,
    padding: Spacing.space4,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.space2,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Palette.surfaceSubtle,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.space2 + 2,
    paddingVertical: 3,
  },
  categoryText: {
    ...Typography.supporting,
    fontSize: 11.5,
    fontWeight: '600',
    color: Palette.forest,
  },
  remainingBadge: {
    backgroundColor: 'rgba(197, 243, 107, 0.35)',
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.space2 + 2,
    paddingVertical: 3,
  },
  remainingText: {
    ...Typography.supporting,
    fontSize: 11.5,
    fontWeight: '700',
    color: Palette.forest,
  },
  eventName: {
    ...Typography.cardHeading,
    fontSize: 16.5,
    color: Palette.ink,
    fontWeight: '700',
    marginBottom: Spacing.space2 + 2,
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    ...Typography.supporting,
    fontSize: 12,
    color: Palette.muted,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.995 }],
  },
});
