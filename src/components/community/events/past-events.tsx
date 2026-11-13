import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Palette, Radius, Spacing, Typography, FontFamily } from '@/constants/theme';
import { AppIcon } from '@/components/ui/icon';
import { CommunityEvent } from '@/types/community';

interface PastEventsProps {
  events: CommunityEvent[];
}

export function PastEvents({ events }: PastEventsProps) {
  const router = useRouter();

  return (
    <View style={styles.container}>
      {events.map((event) => (
        <Pressable
          key={event.id}
          onPress={() => router.push(`/event/${event.id}` as any)}
          style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}>
          <View style={styles.headerRow}>
            <View style={styles.titleWrap}>
              <Text style={styles.title}>{event.name}</Text>
              <Text style={styles.metaText}>{event.date} • {event.organizer}</Text>
            </View>

            <View style={styles.completedBadge}>
              <AppIcon name="checkmark" size={12} color={Palette.muted} />
              <Text style={styles.completedText}>Concluded</Text>
            </View>
          </View>

          <View style={styles.footerRow}>
            <Text style={styles.detailText}>
              {event.distanceOrTarget} • {event.participantCount} participants
            </Text>
            <View style={styles.viewRow}>
              <Text style={styles.viewText}>Summary</Text>
              <AppIcon name="arrow-forward" size={12} color={Palette.forest} />
            </View>
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
  headerRow: {
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
    fontSize: 15,
    color: Palette.ink,
    marginBottom: 2,
  },
  metaText: {
    ...Typography.supporting,
    fontSize: 11.5,
    color: Palette.muted,
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Palette.surfaceSubtle,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  completedText: {
    ...Typography.supporting,
    fontSize: 11,
    color: Palette.muted,
    fontWeight: '600',
    fontFamily: FontFamily.medium,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Spacing.space2,
    borderTopWidth: 1,
    borderTopColor: Palette.surfaceSubtle,
  },
  detailText: {
    ...Typography.supporting,
    fontSize: 11.5,
    color: Palette.muted,
  },
  viewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewText: {
    ...Typography.supporting,
    fontSize: 12,
    fontWeight: '700',
    fontFamily: FontFamily.bold,
    color: Palette.forest,
  },
});
