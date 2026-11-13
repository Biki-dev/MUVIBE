import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Palette, Radius, Spacing, Typography, FontFamily } from '@/constants/theme';
import { Club } from '@/types/club';
import { Badge } from '@/components/ui/badge';
import { AppIcon } from '@/components/ui/icon';

interface ClubCardProps {
  club: Club;
  isJoined: boolean;
  onToggleJoin: (clubId: string) => void;
  onPressDetails?: (club: Club) => void;
}

export function ClubCard({
  club,
  isJoined,
  onToggleJoin,
  onPressDetails,
}: ClubCardProps) {
  const getCategoryVariant = (cat: string) => {
    switch (cat) {
      case 'Sports':
        return 'blue';
      case 'Fitness':
        return 'lime';
      case 'Gym and wellness':
        return 'amber';
      case 'Adventure':
        return 'blue';
      default:
        return 'neutral';
    }
  };

  const getClubIcon = (logo: string) => {
    switch (logo) {
      case 'run-fast':
        return 'flame';
      case 'airplane':
        return 'paper-plane';
      case 'soccer':
        return 'football';
      case 'dumbbell':
        return 'barbell';
      case 'hiking':
        return 'compass';
      case 'tennis':
        return 'tennisball';
      case 'meditation':
        return 'flower';
      case 'bike':
        return 'bicycle';
      default:
        return 'shield-checkmark';
    }
  };

  return (
    <Pressable
      onPress={() => onPressDetails?.(club)}
      style={({ pressed }) => [
        styles.card,
        isJoined && styles.joinedCardBorder,
        pressed && styles.pressed,
      ]}>
      {/* Header Row: Logo, Name & College, Join Button */}
      <View style={styles.topRow}>
        <View style={styles.logoAndMeta}>
          <View
            style={[
              styles.logoBadge,
              { backgroundColor: club.accentColor || Palette.forest },
            ]}>
            <AppIcon
              name={getClubIcon(club.logo)}
              size={22}
              color={club.accentColor === Palette.lime ? Palette.ink : Palette.white}
            />
          </View>

          <View style={styles.metaContainer}>
            <Text style={styles.clubName} numberOfLines={1}>
              {club.name}
            </Text>
            <View style={styles.collegeRow}>
              <AppIcon name="school-outline" size={13} color={Palette.muted} />
              <Text style={styles.collegeName} numberOfLines={1}>
                {club.college}
              </Text>
            </View>
          </View>
        </View>

        {/* Join button */}
        <Pressable
          onPress={(e) => {
            e.stopPropagation();
            onToggleJoin(club.id);
          }}
          style={({ pressed }) => [
            styles.joinButton,
            isJoined ? styles.joinedButton : styles.unjoinedButton,
            pressed && styles.buttonPressed,
          ]}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={isJoined ? 'Joined club' : 'Join club'}>
          {isJoined ? (
            <View style={styles.buttonInner}>
              <AppIcon name="checkmark" size={14} color={Palette.ink} />
              <Text style={styles.joinedText}>Joined</Text>
            </View>
          ) : (
            <View style={styles.buttonInner}>
              <AppIcon name="add" size={14} color={Palette.forest} />
              <Text style={styles.joinText}>Join</Text>
            </View>
          )}
        </Pressable>
      </View>

      {/* Description */}
      <Text style={styles.description} numberOfLines={2}>
        {club.shortDescription}
      </Text>

      {/* Footer tags: Category, Member count, Meeting spot/schedule */}
      <View style={styles.footerRow}>
        <View style={styles.tagGroup}>
          <Badge
            label={club.category}
            variant={getCategoryVariant(club.category) as any}
          />
          {club.isNearby && (
            <Badge
              label="Nearby"
              variant="neutral"
              icon={<AppIcon name="navigate-circle" size={11} color={Palette.forest} />}
            />
          )}
        </View>

        <View style={styles.memberCountContainer}>
          <AppIcon name="people-outline" size={14} color={Palette.muted} />
          <Text style={styles.memberCountText}>{club.memberCount} members</Text>
        </View>
      </View>

      {/* Schedule snippet if available */}
      {club.schedule && (
        <View style={styles.scheduleRow}>
          <AppIcon name="calendar-outline" size={12} color={Palette.muted} />
          <Text style={styles.scheduleText} numberOfLines={1}>
            {club.schedule} • {club.meetingSpot}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Palette.white,
    borderRadius: Radius.card, // 18px
    borderWidth: 1,
    borderColor: Palette.border,
    padding: Spacing.space3 + 2,
    marginBottom: Spacing.space3,
  },
  joinedCardBorder: {
    borderColor: Palette.forest,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.space2,
  },
  logoAndMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: Spacing.space2,
  },
  logoBadge: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.space3,
  },
  metaContainer: {
    flex: 1,
  },
  clubName: {
    ...Typography.cardHeading,
    color: Palette.ink,
    fontSize: 15.5,
  },
  collegeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    gap: 4,
  },
  collegeName: {
    ...Typography.supporting,
    color: Palette.muted,
    fontSize: 12,
  },
  joinButton: {
    borderRadius: Radius.btn,
    paddingVertical: 6,
    paddingHorizontal: 12,
    minWidth: 78,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unjoinedButton: {
    backgroundColor: Palette.surfaceSubtle,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  joinedButton: {
    backgroundColor: Palette.lime,
  },
  buttonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  joinText: {
    ...Typography.supporting,
    fontWeight: '700',
    fontFamily: FontFamily.bold,
    color: Palette.forest,
    fontSize: 12.5,
  },
  joinedText: {
    ...Typography.supporting,
    fontWeight: '700',
    fontFamily: FontFamily.bold,
    color: Palette.ink,
    fontSize: 12.5,
  },
  description: {
    ...Typography.body,
    fontSize: 13.5,
    color: Palette.ink,
    lineHeight: 19,
    marginBottom: Spacing.space3,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Spacing.space2,
    borderTopWidth: 1,
    borderTopColor: Palette.surfaceSubtle,
  },
  tagGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  memberCountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  memberCountText: {
    ...Typography.supporting,
    color: Palette.muted,
    fontSize: 12,
    fontWeight: '500',
    fontFamily: FontFamily.medium,
  },
  scheduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: Spacing.space2,
    backgroundColor: Palette.surfaceHighlight,
    paddingHorizontal: Spacing.space2,
    paddingVertical: 4,
    borderRadius: 8,
  },
  scheduleText: {
    ...Typography.supporting,
    color: Palette.muted,
    fontSize: 11.5,
    flex: 1,
  },
  pressed: {
    opacity: 0.94,
  },
  buttonPressed: {
    opacity: 0.7,
  },
});
