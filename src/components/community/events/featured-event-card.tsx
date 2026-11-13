import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Palette, Radius, Spacing, Typography, FontFamily } from '@/constants/theme';
import { AppIcon } from '@/components/ui/icon';
import { CommunityEvent } from '@/types/community';

interface FeaturedEventCardProps {
  event: CommunityEvent;
  onToggleRegister: (id: string) => void;
}

export function FeaturedEventCard({
  event,
  onToggleRegister,
}: FeaturedEventCardProps) {
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
      {/* Banner */}
      <View style={styles.banner}>
        <View style={styles.badgeRow}>
          <View style={styles.featuredBadge}>
            <AppIcon name="star" size={11} color={Palette.ink} />
            <Text style={styles.featuredBadgeText}>FEATURED EVENT</Text>
          </View>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryBadgeText}>{event.categoryLabel}</Text>
          </View>
        </View>

        <Text style={styles.title}>{event.name}</Text>
        <Text style={styles.desc} numberOfLines={2}>
          {event.description}
        </Text>
      </View>

      {/* Logistics Row */}
      <View style={styles.infoGrid}>
        <View style={styles.infoCol}>
          <Text style={styles.infoLabel}>Distance / Target</Text>
          <View style={styles.infoValueRow}>
            <AppIcon name="flag-outline" size={14} color={Palette.forest} />
            <Text style={styles.infoValue} numberOfLines={1}>{event.distanceOrTarget}</Text>
          </View>
        </View>

        <View style={styles.infoCol}>
          <Text style={styles.infoLabel}>Date & Time</Text>
          <View style={styles.infoValueRow}>
            <AppIcon name="time-outline" size={14} color={Palette.forest} />
            <Text style={styles.infoValue} numberOfLines={1}>{event.date} • {event.time}</Text>
          </View>
        </View>

        <View style={styles.infoColFull}>
          <Text style={styles.infoLabel}>Venue & Organizer</Text>
          <View style={styles.infoValueRow}>
            <AppIcon name="location-outline" size={14} color={Palette.forest} />
            <Text style={styles.infoValue} numberOfLines={1}>
              {event.venue} ({event.organizer})
            </Text>
          </View>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.participantsWrap}>
          <AppIcon name="people-outline" size={14} color={Palette.muted} />
          <Text style={styles.participantsText}>
            {event.participantCount} registered
          </Text>
        </View>

        <Pressable
          onPress={handleRegisterPress}
          style={[
            styles.registerBtn,
            event.registered ? styles.registerBtnActive : styles.registerBtnIdle,
          ]}>
          {event.registered ? (
            <>
              <AppIcon name="checkmark" size={13} color={Palette.white} />
              <Text style={styles.registerTextActive}>Registered</Text>
            </>
          ) : (
            <>
              <AppIcon name="add" size={13} color={Palette.ink} />
              <Text style={styles.registerTextIdle}>Register Now</Text>
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
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Palette.border,
    overflow: 'hidden',
    marginBottom: Spacing.space5,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 2,
  },
  cardPressed: {
    transform: [{ scale: 0.995 }],
  },
  banner: {
    backgroundColor: Palette.forest,
    padding: Spacing.space4,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: Spacing.space2,
  },
  featuredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Palette.lime,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  featuredBadgeText: {
    ...Typography.supporting,
    fontSize: 10,
    fontWeight: '800',
    fontFamily: FontFamily.bold,
    color: Palette.ink,
  },
  categoryBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  categoryBadgeText: {
    ...Typography.supporting,
    fontSize: 10.5,
    fontWeight: '700',
    fontFamily: FontFamily.bold,
    color: Palette.white,
  },
  title: {
    ...Typography.pageTitle,
    fontSize: 22,
    color: Palette.white,
    fontWeight: '800',
    fontFamily: FontFamily.bold,
    marginBottom: 4,
  },
  desc: {
    ...Typography.body,
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.85)',
    lineHeight: 18,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: Spacing.space3,
    backgroundColor: Palette.surfaceHighlight,
    borderBottomWidth: 1,
    borderBottomColor: Palette.border,
    gap: 10,
  },
  infoCol: {
    width: '47%',
    flexGrow: 1,
  },
  infoColFull: {
    width: '100%',
  },
  infoLabel: {
    ...Typography.supporting,
    fontSize: 11,
    color: Palette.muted,
    marginBottom: 2,
  },
  infoValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  infoValue: {
    ...Typography.bodyBold,
    fontSize: 12.5,
    color: Palette.ink,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.space4,
    paddingVertical: Spacing.space3,
  },
  participantsWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  participantsText: {
    ...Typography.supporting,
    fontSize: 12,
    color: Palette.muted,
  },
  registerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 16,
    paddingVertical: 8,
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
    fontSize: 12.5,
    fontWeight: '700',
    fontFamily: FontFamily.bold,
    color: Palette.ink,
  },
  registerTextActive: {
    ...Typography.supporting,
    fontSize: 12.5,
    fontWeight: '700',
    fontFamily: FontFamily.bold,
    color: Palette.white,
  },
});
