import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Palette, Radius, Spacing, Typography, FontFamily } from '@/constants/theme';
import { AppIcon } from '@/components/ui/icon';
import { CommunityEvent } from '@/types/community';

interface EventCardProps {
  event: CommunityEvent;
  onToggleRegister: (id: string) => void;
}

export function EventCard({ event, onToggleRegister }: EventCardProps) {
  const router = useRouter();

  const handleCardPress = () => {
    router.push(`/event/${event.id}` as any);
  };

  const handleRegisterPress = () => {
    onToggleRegister(event.id);
  };

  return (
    <Pressable
      onPress={handleCardPress}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}>
      {/* Header Row: Category Badge & Status */}
      <View style={styles.topRow}>
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryBadgeText}>{event.categoryLabel}</Text>
        </View>

        <View style={styles.dateBadge}>
          <AppIcon name="calendar-outline" size={12} color={Palette.forest} />
          <Text style={styles.dateBadgeText}>{event.date}</Text>
        </View>
      </View>

      {/* Title */}
      <Text style={styles.title}>{event.name}</Text>

      {/* Metadata Grid */}
      <View style={styles.metaList}>
        <View style={styles.metaRow}>
          <AppIcon name="time-outline" size={13} color={Palette.muted} />
          <Text style={styles.metaText}>{event.time} ({event.estimatedDuration})</Text>
        </View>

        <View style={styles.metaRow}>
          <AppIcon name="location-outline" size={13} color={Palette.muted} />
          <Text style={styles.metaText} numberOfLines={1}>{event.venue}</Text>
        </View>

        <View style={styles.metaRow}>
          <AppIcon name="flag-outline" size={13} color={Palette.muted} />
          <Text style={styles.metaText}>{event.distanceOrTarget}</Text>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.organizerWrap}>
          <Text style={styles.organizerLabel}>By {event.organizer}</Text>
          <Text style={styles.participantsText}>• {event.participantCount} joined</Text>
        </View>

        <Pressable
          onPress={handleRegisterPress}
          style={[
            styles.registerBtn,
            event.registered ? styles.registerBtnActive : styles.registerBtnIdle,
          ]}>
          {event.registered ? (
            <>
              <AppIcon name="checkmark" size={12} color={Palette.white} />
              <Text style={styles.registerTextActive}>Registered</Text>
            </>
          ) : (
            <>
              <AppIcon name="add" size={12} color={Palette.ink} />
              <Text style={styles.registerTextIdle}>Register</Text>
            </>
          )}
        </Pressable>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Palette.white,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Palette.border,
    padding: Spacing.space3 + 2,
    marginBottom: Spacing.space3,
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
    elevation: 1,
  },
  cardPressed: {
    backgroundColor: Palette.surfaceHighlight,
    transform: [{ scale: 0.995 }],
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.space2,
  },
  categoryBadge: {
    backgroundColor: Palette.surfaceSubtle,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  categoryBadgeText: {
    ...Typography.supporting,
    fontSize: 11,
    fontWeight: '600',
    fontFamily: FontFamily.medium,
    color: Palette.muted,
  },
  dateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateBadgeText: {
    ...Typography.supporting,
    fontSize: 11.5,
    fontWeight: '600',
    fontFamily: FontFamily.medium,
    color: Palette.forest,
  },
  title: {
    ...Typography.cardHeading,
    fontSize: 15.5,
    color: Palette.ink,
    marginBottom: Spacing.space2,
  },
  metaList: {
    gap: 4,
    marginBottom: Spacing.space3,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    ...Typography.supporting,
    fontSize: 12,
    color: Palette.muted,
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Spacing.space2,
    borderTopWidth: 1,
    borderTopColor: Palette.surfaceSubtle,
  },
  organizerWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
    paddingRight: 6,
  },
  organizerLabel: {
    ...Typography.supporting,
    fontSize: 11.5,
    color: Palette.muted,
  },
  participantsText: {
    ...Typography.supporting,
    fontSize: 11.5,
    color: Palette.muted,
  },
  registerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.btn,
  },
  registerBtnIdle: {
    backgroundColor: Palette.lime,
  },
  registerBtnActive: {
    backgroundColor: Palette.forest,
  },
  registerTextIdle: {
    ...Typography.supporting,
    fontSize: 11.5,
    fontWeight: '700',
    fontFamily: FontFamily.bold,
    color: Palette.ink,
  },
  registerTextActive: {
    ...Typography.supporting,
    fontSize: 11.5,
    fontWeight: '700',
    fontFamily: FontFamily.bold,
    color: Palette.white,
  },
});
