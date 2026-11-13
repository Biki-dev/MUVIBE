import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Palette, Radius, Spacing, Typography } from '@/constants/theme';
import { AppIcon } from '@/components/ui/icon';
import { CommunityClub } from '@/types/community';

interface ClubCardProps {
  club: CommunityClub;
  onToggleJoin: (id: string) => void;
  showFullDescription?: boolean;
}

export function ClubCard({
  club,
  onToggleJoin,
  showFullDescription = false,
}: ClubCardProps) {
  const router = useRouter();

  const handleCardPress = () => {
    router.push(`/club/${club.id}` as any);
  };

  const handleJoinPress = () => {
    onToggleJoin(club.id);
  };

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'running':
        return { name: 'run', type: 'mci' as const };
      case 'cycling':
        return { name: 'bicycle-outline', type: 'ion' as const };
      case 'gym_fitness':
        return { name: 'barbell-outline', type: 'ion' as const };
      case 'adventure':
        return { name: 'trail-sign-outline', type: 'ion' as const };
      case 'sports':
        return { name: 'football-outline', type: 'ion' as const };
      case 'yoga_wellness':
        return { name: 'body-outline', type: 'ion' as const };
      default:
        return { name: 'people-outline', type: 'ion' as const };
    }
  };

  const iconInfo = getCategoryIcon(club.category);

  return (
    <Pressable
      onPress={handleCardPress}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}>
      {/* Top Meta Header */}
      <View style={styles.topRow}>
        <View style={styles.clubInfoWrap}>
          <View style={[styles.avatarBox, { backgroundColor: club.coverColor }]}>
            <AppIcon
              name={iconInfo.name}
              type={iconInfo.type}
              size={18}
              color={Palette.lime}
            />
          </View>
          <View style={styles.nameBlock}>
            <Text style={styles.clubName}>{club.name}</Text>
            <Text style={styles.institutionName} numberOfLines={1}>
              {club.institution}
            </Text>
          </View>
        </View>

        <View style={styles.categoryBadge}>
          <Text style={styles.categoryBadgeText}>{club.categoryLabel}</Text>
        </View>
      </View>

      {/* Description */}
      <Text
        style={styles.description}
        numberOfLines={showFullDescription ? undefined : 2}>
        {club.description}
      </Text>

      {/* Footer Info & Action */}
      <View style={styles.footer}>
        <View style={styles.membersWrap}>
          <AppIcon name="people-outline" size={14} color={Palette.muted} />
          <Text style={styles.membersText}>
            {club.memberCount.toLocaleString()} members
          </Text>
        </View>

        <View style={styles.actionRow}>
          <Pressable
            onPress={handleJoinPress}
            style={[
              styles.joinBtn,
              club.joined ? styles.joinBtnActive : styles.joinBtnIdle,
            ]}>
            {club.joined ? (
              <>
                <AppIcon name="checkmark" size={13} color={Palette.white} />
                <Text style={styles.joinTextActive}>Joined</Text>
              </>
            ) : (
              <>
                <AppIcon name="add" size={13} color={Palette.ink} />
                <Text style={styles.joinTextIdle}>Join Club</Text>
              </>
            )}
          </Pressable>
        </View>
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
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: Spacing.space2,
  },
  clubInfoWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    paddingRight: 8,
  },
  avatarBox: {
    width: 38,
    height: 38,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nameBlock: {
    flex: 1,
  },
  clubName: {
    ...Typography.cardHeading,
    fontSize: 15.5,
    color: Palette.ink,
    marginBottom: 2,
  },
  institutionName: {
    ...Typography.supporting,
    fontSize: 11.5,
    color: Palette.muted,
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
    color: Palette.muted,
  },
  description: {
    ...Typography.body,
    fontSize: 13,
    color: Palette.muted,
    lineHeight: 18,
    marginBottom: Spacing.space3,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Spacing.space2,
    borderTopWidth: 1,
    borderTopColor: Palette.surfaceSubtle,
  },
  membersWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  membersText: {
    ...Typography.supporting,
    fontSize: 12,
    color: Palette.muted,
    fontWeight: '500',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  joinBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.btn,
  },
  joinBtnIdle: {
    backgroundColor: Palette.lime,
  },
  joinBtnActive: {
    backgroundColor: Palette.forest,
  },
  joinTextIdle: {
    ...Typography.supporting,
    fontSize: 12,
    fontWeight: '700',
    color: Palette.ink,
  },
  joinTextActive: {
    ...Typography.supporting,
    fontSize: 12,
    fontWeight: '700',
    color: Palette.white,
  },
});
