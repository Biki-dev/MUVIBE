import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Palette, Radius, Spacing, Typography } from '@/constants/theme';
import { AppIcon } from '@/components/ui/icon';
import { CommunityEvent } from '@/types/community';
import { EmptyState } from '@/components/challenge/empty-state';

interface MyEventsProps {
  events: CommunityEvent[];
  onToggleRegister: (id: string) => void;
  onExploreEvents: () => void;
}

export function MyEvents({ events, onToggleRegister, onExploreEvents }: MyEventsProps) {
  const router = useRouter();

  if (events.length === 0) {
    return (
      <EmptyState
        iconName="calendar-outline"
        title="You haven't registered for any events yet."
        message="Browse upcoming fitness tournaments, campus marathons, and club sessions."
        actionLabel="Explore Events"
        onAction={onExploreEvents}
      />
    );
  }

  return (
    <View style={styles.container}>
      {events.map((event) => (
        <Pressable
          key={event.id}
          onPress={() => router.push(`/event/${event.id}` as any)}
          style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}>
          <View style={styles.topRow}>
            <View style={styles.titleWrap}>
              <Text style={styles.title}>{event.name}</Text>
              <Text style={styles.categoryText}>{event.categoryLabel} • {event.organizer}</Text>
            </View>

            <View style={styles.registeredBadge}>
              <AppIcon name="checkmark-circle" size={13} color={Palette.forest} />
              <Text style={styles.registeredText}>Registered</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <AppIcon name="calendar-outline" size={13} color={Palette.forest} />
              <Text style={styles.infoText}>{event.date}</Text>
            </View>
            <View style={styles.infoItem}>
              <AppIcon name="time-outline" size={13} color={Palette.muted} />
              <Text style={styles.infoText}>{event.time}</Text>
            </View>
          </View>

          <View style={styles.venueRow}>
            <AppIcon name="location-outline" size={13} color={Palette.muted} />
            <Text style={styles.venueText} numberOfLines={1}>{event.venue}</Text>
          </View>

          <View style={styles.footer}>
            <Text style={styles.viewDetailsText}>View Event & Schedule</Text>
            <AppIcon name="arrow-forward" size={13} color={Palette.forest} />
          </View>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.space4,
  },
  card: {
    backgroundColor: Palette.white,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Palette.border,
    padding: Spacing.space3 + 2,
    marginBottom: Spacing.space3,
  },
  cardPressed: {
    backgroundColor: Palette.surfaceHighlight,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: Spacing.space2,
  },
  titleWrap: {
    flex: 1,
    paddingRight: 8,
  },
  title: {
    ...Typography.cardHeading,
    fontSize: 15.5,
    color: Palette.ink,
    marginBottom: 2,
  },
  categoryText: {
    ...Typography.supporting,
    fontSize: 11,
    color: Palette.muted,
  },
  registeredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(197, 243, 107, 0.35)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  registeredText: {
    ...Typography.supporting,
    fontSize: 11,
    fontWeight: '700',
    color: Palette.forest,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 4,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  infoText: {
    ...Typography.supporting,
    fontSize: 12,
    color: Palette.ink,
    fontWeight: '600',
  },
  venueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: Spacing.space2,
  },
  venueText: {
    ...Typography.supporting,
    fontSize: 11.5,
    color: Palette.muted,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Spacing.space2,
    borderTopWidth: 1,
    borderTopColor: Palette.surfaceSubtle,
  },
  viewDetailsText: {
    ...Typography.supporting,
    fontSize: 12,
    fontWeight: '700',
    color: Palette.forest,
  },
});
