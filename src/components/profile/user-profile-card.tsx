import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Palette, Radius, Spacing, Typography } from '@/constants/theme';
import { AppIcon } from '@/components/ui/icon';
import { StudentProfile } from '@/types/auth';

interface UserProfileCardProps {
  profile: StudentProfile;
}

export function UserProfileCard({ profile }: UserProfileCardProps) {
  const router = useRouter();

  const displayName = profile.fullName?.trim() || 'Biki Kalita';
  const displayUsername = profile.username?.trim() || 'bikikalita';
  const displayCollege = profile.college?.trim() || 'Assam Engineering College';
  const displayDepartment = profile.department?.trim() || 'Mechanical Engineering';
  const displayYear = profile.academicYear?.trim() || '2nd Year';
  const displayBio =
    profile.bio?.trim() || 'Building consistency, one activity at a time.';

  // Sporty avatar mapping
  const getAvatarDisplay = (avatarId?: string) => {
    switch (avatarId) {
      case 'av_cyclist':
        return { emoji: '🚴', bg: '#5279F6' };
      case 'av_strength':
        return { emoji: '🏋️', bg: '#18352D' };
      case 'av_yoga':
        return { emoji: '🧘', bg: '#E8A34A' };
      case 'av_runner':
      default:
        return { emoji: '🏃', bg: '#C5F36B' };
    }
  };

  const avatar = getAvatarDisplay(profile.avatarUrl);

  return (
    <View style={styles.card}>
      {/* Top Identity Block */}
      <View style={styles.topRow}>
        <View style={[styles.avatarCircle, { backgroundColor: avatar.bg }]}>
          <Text style={styles.avatarEmoji}>{avatar.emoji}</Text>
        </View>

        <View style={styles.nameBlock}>
          <Text style={styles.fullName} numberOfLines={1}>
            {displayName}
          </Text>
          <Text style={styles.username}>@{displayUsername}</Text>

          <View style={styles.campusTag}>
            <AppIcon name="school-outline" size={12} color={Palette.forest} />
            <Text style={styles.campusText} numberOfLines={1}>
              {displayCollege.split('(')[0].trim()}
            </Text>
          </View>
        </View>
      </View>

      {/* Academic Details Pill */}
      <View style={styles.academicRow}>
        <Text style={styles.academicText} numberOfLines={1}>
          {displayDepartment} • {displayYear}
        </Text>
      </View>

      {/* Bio */}
      <Text style={styles.bioText}>{displayBio}</Text>

      {/* Edit Profile Action Button */}
      <Pressable
        onPress={() => router.push('/profile/edit' as any)}
        style={({ pressed }) => [styles.editBtn, pressed && styles.editBtnPressed]}>
        <AppIcon name="create-outline" size={15} color={Palette.forest} />
        <Text style={styles.editBtnText}>Edit Profile</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Palette.white,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Palette.border,
    padding: Spacing.space4,
    marginBottom: Spacing.space4,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: Spacing.space3,
  },
  avatarCircle: {
    width: 64,
    height: 64,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Palette.white,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  avatarEmoji: {
    fontSize: 30,
  },
  nameBlock: {
    flex: 1,
  },
  fullName: {
    ...Typography.cardHeading,
    fontSize: 18,
    fontWeight: '800',
    color: Palette.ink,
    marginBottom: 1,
  },
  username: {
    ...Typography.supporting,
    fontSize: 12.5,
    color: Palette.muted,
    marginBottom: 5,
  },
  campusTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  campusText: {
    ...Typography.supporting,
    fontSize: 11.5,
    fontWeight: '600',
    color: Palette.forest,
  },
  academicRow: {
    backgroundColor: Palette.surfaceSubtle,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.space3,
    paddingVertical: 6,
    marginBottom: Spacing.space3,
  },
  academicText: {
    ...Typography.supporting,
    fontSize: 12,
    color: Palette.ink,
    fontWeight: '500',
  },
  bioText: {
    ...Typography.body,
    fontSize: 13,
    color: Palette.muted,
    lineHeight: 18,
    marginBottom: Spacing.space3,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Palette.surfaceHighlight,
    borderWidth: 1,
    borderColor: Palette.border,
    paddingVertical: 9,
    borderRadius: Radius.btn,
  },
  editBtnPressed: {
    backgroundColor: Palette.surfaceSubtle,
  },
  editBtnText: {
    ...Typography.supporting,
    fontSize: 12.5,
    fontWeight: '700',
    color: Palette.forest,
  },
});
