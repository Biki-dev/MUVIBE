import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Palette, Radius, Spacing, Typography } from '@/constants/theme';
import { AppIcon } from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { useCommunity } from '@/context/community-context';

export default function ClubDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const { getClubById, toggleJoinClub } = useCommunity();

  const club = getClubById(params.id || '');

  if (!club) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.topHeader}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <AppIcon name="arrow-back" size={24} color={Palette.ink} />
          </Pressable>
          <Text style={styles.topHeaderTitle}>Club Details</Text>
          <View style={{ width: 36 }} />
        </View>
        <View style={styles.notFoundContainer}>
          <Text style={styles.notFoundText}>Club not found.</Text>
          <Button label="Back to Community" onPress={() => router.back()} />
        </View>
      </SafeAreaView>
    );
  }

  const handleToggleJoin = () => {
    if (club.joined) {
      Alert.alert(
        'Leave Club?',
        `Are you sure you want to leave ${club.name}? You can rejoin anytime.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Leave Club',
            style: 'destructive',
            onPress: () => toggleJoinClub(club.id),
          },
        ]
      );
    } else {
      toggleJoinClub(club.id);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top Header */}
      <View style={styles.topHeader}>
        <Pressable onPress={() => router.back()} style={styles.backButton} hitSlop={10}>
          <AppIcon name="arrow-back" size={24} color={Palette.ink} />
        </Pressable>
        <Text style={styles.topHeaderTitle} numberOfLines={1}>
          {club.name}
        </Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* 1. Club Header Banner */}
        <View style={[styles.bannerCard, { backgroundColor: club.coverColor }]}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryBadgeText}>{club.categoryLabel}</Text>
          </View>
          <Text style={styles.bannerTitle}>{club.name}</Text>
          <Text style={styles.bannerCollege}>{club.institution}</Text>
          <View style={styles.memberCountRow}>
            <AppIcon name="people" size={14} color={Palette.lime} />
            <Text style={styles.memberCountText}>
              {club.memberCount.toLocaleString()} campus members
            </Text>
          </View>
        </View>

        {/* 3. Club Statistics Grid */}
        <View style={styles.statsCard}>
          <View style={styles.statCol}>
            <Text style={styles.statValue}>{club.memberCount}</Text>
            <Text style={styles.statLabel}>Members</Text>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.statCol}>
            <Text style={styles.statValue}>{club.stats.activitiesOrganized}</Text>
            <Text style={styles.statLabel}>Activities</Text>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.statCol}>
            <Text style={styles.statValue}>{club.stats.totalHoursLogged}h</Text>
            <Text style={styles.statLabel}>Logged</Text>
          </View>
        </View>

        {/* 2. About the Club */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionIconWrap}>
              <AppIcon name="information-circle-outline" size={16} color={Palette.forest} />
            </View>
            <Text style={styles.sectionTitle}>About the Club</Text>
          </View>

          <Text style={styles.longDesc}>{club.longDescription}</Text>

          <View style={styles.meetingLocationBox}>
            <AppIcon name="location-outline" size={16} color={Palette.forest} />
            <View style={{ flex: 1 }}>
              <Text style={styles.locationTitle}>Meeting Ground</Text>
              <Text style={styles.locationText}>{club.meetingLocation}</Text>
            </View>
          </View>

          <View style={styles.interestsWrap}>
            <Text style={styles.interestsTitle}>Club Interests</Text>
            <View style={styles.interestsChipsRow}>
              {club.interests.map((interest, idx) => (
                <View key={idx} style={styles.interestChip}>
                  <Text style={styles.interestChipText}>{interest}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* 4. Upcoming Activities */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionIconWrap}>
              <AppIcon name="calendar-outline" size={16} color={Palette.forest} />
            </View>
            <Text style={styles.sectionTitle}>Upcoming Activities</Text>
          </View>

          <View style={styles.activitiesList}>
            {club.upcomingActivities.map((act) => (
              <View key={act.id} style={styles.activityItem}>
                <View style={styles.actTitleRow}>
                  <Text style={styles.actName}>{act.name}</Text>
                  <Text style={styles.actDate}>{act.date}</Text>
                </View>
                <View style={styles.actDetailsRow}>
                  <AppIcon name="time-outline" size={13} color={Palette.muted} />
                  <Text style={styles.actDetailText}>{act.time}</Text>
                </View>
                <View style={styles.actDetailsRow}>
                  <AppIcon name="location-outline" size={13} color={Palette.muted} />
                  <Text style={styles.actDetailText}>{act.venue}</Text>
                </View>
                <Text style={styles.actOrganizer}>Lead: {act.organizer}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* 5. Club Announcements */}
        {club.announcements.length > 0 && (
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionIconWrap}>
                <AppIcon name="megaphone-outline" size={16} color={Palette.forest} />
              </View>
              <Text style={styles.sectionTitle}>Announcements</Text>
            </View>

            <View style={styles.announcementsList}>
              {club.announcements.map((ann) => (
                <View key={ann.id} style={styles.announcementItem}>
                  <View style={styles.annHeaderRow}>
                    <Text style={styles.annTitle}>{ann.title}</Text>
                    <Text style={styles.annDate}>{ann.date}</Text>
                  </View>
                  <Text style={styles.annContent}>{ann.content}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* 6. Members Preview */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionIconWrap}>
              <AppIcon name="people-outline" size={16} color={Palette.forest} />
            </View>
            <Text style={styles.sectionTitle}>Leadership & Members ({club.memberCount})</Text>
          </View>

          <View style={styles.membersList}>
            {club.members.map((member) => (
              <View key={member.id} style={styles.memberRow}>
                <View style={[styles.memberAvatar, { backgroundColor: member.avatarColor }]}>
                  <Text style={styles.memberEmoji}>{member.avatarEmoji}</Text>
                </View>
                <View style={styles.memberInfo}>
                  <View style={styles.memberNameRow}>
                    <Text style={styles.memberName}>{member.name}</Text>
                    {member.role === 'admin' && (
                      <View style={styles.adminBadge}>
                        <Text style={styles.adminBadgeText}>LEAD</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.memberUsername}>@{member.username}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* 7. Sticky Bottom Bar */}
      <View style={styles.bottomBar}>
        {!club.joined ? (
          <Button
            label="Join Club"
            variant="primary"
            size="lg"
            onPress={handleToggleJoin}
            icon={<AppIcon name="add" size={18} color={Palette.ink} />}
          />
        ) : (
          <View style={styles.joinedActionRow}>
            <View style={styles.joinedBadge}>
              <AppIcon name="checkmark-circle" size={16} color={Palette.forest} />
              <Text style={styles.joinedBadgeText}>Club Member</Text>
            </View>
            <View style={styles.leaveBtnWrap}>
              <Button
                label="Leave Club"
                variant="coral"
                size="md"
                onPress={handleToggleJoin}
              />
            </View>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Palette.canvas,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.space4,
    paddingVertical: Spacing.space3,
    backgroundColor: Palette.white,
    borderBottomWidth: 1,
    borderBottomColor: Palette.border,
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topHeaderTitle: {
    ...Typography.sectionHeading,
    fontSize: 16,
    color: Palette.ink,
    maxWidth: '70%',
    textAlign: 'center',
  },
  notFoundContainer: {
    padding: Spacing.space6,
    alignItems: 'center',
  },
  notFoundText: {
    ...Typography.body,
    color: Palette.muted,
    marginBottom: Spacing.space4,
  },
  scrollContent: {
    paddingHorizontal: Spacing.space4,
    paddingTop: Spacing.space4,
    paddingBottom: Spacing.space6,
    maxWidth: 600,
    width: '100%',
    alignSelf: 'center',
  },
  bannerCard: {
    borderRadius: Radius.card,
    padding: Spacing.space4 + 2,
    marginBottom: Spacing.space3,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
    marginBottom: Spacing.space2,
  },
  categoryBadgeText: {
    ...Typography.supporting,
    fontSize: 10.5,
    fontWeight: '700',
    color: Palette.white,
  },
  bannerTitle: {
    ...Typography.pageTitle,
    fontSize: 24,
    color: Palette.white,
    fontWeight: '800',
    marginBottom: 2,
  },
  bannerCollege: {
    ...Typography.body,
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: Spacing.space2,
  },
  memberCountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  memberCountText: {
    ...Typography.supporting,
    fontSize: 12,
    fontWeight: '700',
    color: Palette.lime,
  },
  statsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Palette.white,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Palette.border,
    paddingVertical: Spacing.space3,
    paddingHorizontal: Spacing.space4,
    marginBottom: Spacing.space4,
  },
  statCol: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    ...Typography.stats,
    fontSize: 20,
    color: Palette.ink,
  },
  statLabel: {
    ...Typography.supporting,
    fontSize: 11,
    color: Palette.muted,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: Palette.border,
  },
  sectionCard: {
    backgroundColor: Palette.white,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Palette.border,
    padding: Spacing.space4,
    marginBottom: Spacing.space4,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: Spacing.space3,
  },
  sectionIconWrap: {
    width: 28,
    height: 28,
    borderRadius: Radius.sm,
    backgroundColor: Palette.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    ...Typography.cardHeading,
    fontSize: 15,
    color: Palette.ink,
  },
  longDesc: {
    ...Typography.body,
    fontSize: 13.5,
    color: Palette.ink,
    lineHeight: 19,
    marginBottom: Spacing.space3,
  },
  meetingLocationBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: Palette.surfaceHighlight,
    borderRadius: Radius.sm,
    padding: Spacing.space3,
    borderWidth: 1,
    borderColor: Palette.border,
    marginBottom: Spacing.space3,
  },
  locationTitle: {
    ...Typography.supporting,
    fontSize: 11,
    fontWeight: '700',
    color: Palette.forest,
    marginBottom: 1,
  },
  locationText: {
    ...Typography.body,
    fontSize: 12.5,
    color: Palette.ink,
  },
  interestsWrap: {},
  interestsTitle: {
    ...Typography.supporting,
    fontSize: 11.5,
    fontWeight: '700',
    color: Palette.muted,
    marginBottom: 6,
  },
  interestsChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  interestChip: {
    backgroundColor: Palette.surfaceSubtle,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  interestChipText: {
    ...Typography.supporting,
    fontSize: 11.5,
    color: Palette.ink,
    fontWeight: '500',
  },
  activitiesList: {
    gap: 10,
  },
  activityItem: {
    backgroundColor: Palette.surfaceHighlight,
    borderRadius: Radius.sm,
    padding: Spacing.space3,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  actTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  actName: {
    ...Typography.bodyBold,
    fontSize: 13.5,
    color: Palette.ink,
    flex: 1,
  },
  actDate: {
    ...Typography.supporting,
    fontSize: 11.5,
    fontWeight: '700',
    color: Palette.forest,
  },
  actDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 2,
  },
  actDetailText: {
    ...Typography.supporting,
    fontSize: 12,
    color: Palette.muted,
  },
  actOrganizer: {
    ...Typography.supporting,
    fontSize: 11,
    color: Palette.muted,
    marginTop: 4,
  },
  announcementsList: {
    gap: 10,
  },
  announcementItem: {
    backgroundColor: Palette.surfaceHighlight,
    borderRadius: Radius.sm,
    padding: Spacing.space3,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  annHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  annTitle: {
    ...Typography.bodyBold,
    fontSize: 13,
    color: Palette.ink,
    flex: 1,
  },
  annDate: {
    ...Typography.supporting,
    fontSize: 11,
    color: Palette.muted,
  },
  annContent: {
    ...Typography.body,
    fontSize: 12.5,
    color: Palette.muted,
    lineHeight: 17,
  },
  membersList: {
    gap: 8,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  memberAvatar: {
    width: 34,
    height: 34,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberEmoji: {
    fontSize: 16,
  },
  memberInfo: {
    flex: 1,
  },
  memberNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  memberName: {
    ...Typography.bodyBold,
    fontSize: 13,
    color: Palette.ink,
  },
  adminBadge: {
    backgroundColor: Palette.lime,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: Radius.full,
  },
  adminBadgeText: {
    fontSize: 8.5,
    fontWeight: '800',
    color: Palette.ink,
  },
  memberUsername: {
    ...Typography.supporting,
    fontSize: 11,
    color: Palette.muted,
  },
  bottomBar: {
    paddingHorizontal: Spacing.space4,
    paddingTop: Spacing.space3,
    paddingBottom: Spacing.space4,
    backgroundColor: Palette.white,
    borderTopWidth: 1,
    borderTopColor: Palette.border,
    maxWidth: 600,
    width: '100%',
    alignSelf: 'center',
  },
  joinedActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  joinedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: 'rgba(197, 243, 107, 0.3)',
    borderRadius: Radius.btn,
  },
  joinedBadgeText: {
    ...Typography.bodyBold,
    fontSize: 13,
    color: Palette.forest,
  },
  leaveBtnWrap: {
    flex: 1,
  },
});
