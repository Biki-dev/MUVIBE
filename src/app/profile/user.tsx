import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Palette, Radius, Spacing, Typography, FontFamily } from '@/constants/theme';
import { AppIcon } from '@/components/ui/icon';
import { useAuth } from '@/context/auth-context';
import {
  fetchPublicUserProfile,
  sendFollowRequest,
  respondToConnectionRequest,
  removeConnection,
} from '@/services/profile-service';
import { PublicUserProfile, ProfileFitnessOverview, UserConnectionItem, AchievementBadge } from '@/types/profile';
import { StreakInfo } from '@/types/activity';
import { computeStreak } from '@/services/activity-stats';
import { FitnessOverview } from '@/components/profile/fitness-overview';
import { ConsistencyCard } from '@/components/profile/consistency-card';
import { AchievementsSection } from '@/components/profile/achievements-section';

export default function PublicUserProfileScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { user: currentUser } = useAuth();

  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<PublicUserProfile | null>(null);
  const [overview, setOverview] = useState<ProfileFitnessOverview>({
    activeMinutes: 0,
    totalDistanceKm: 0,
    totalSteps: 0,
    totalActivities: 0,
  });
  const [streak, setStreak] = useState<StreakInfo>(computeStreak([]));
  const [achievements, setAchievements] = useState<AchievementBadge[]>([]);
  const [followers, setFollowers] = useState<UserConnectionItem[]>([]);
  const [following, setFollowing] = useState<UserConnectionItem[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<
    'none' | 'pending_sent' | 'pending_received' | 'accepted' | 'rejected'
  >('none');
  const [connectionId, setConnectionId] = useState<string | undefined>(undefined);
  const [isActionLoading, setIsActionLoading] = useState(false);

  // Social list modal
  const [socialModalType, setSocialModalType] = useState<'followers' | 'following' | null>(null);

  const loadUserData = useCallback(async () => {
    if (!id) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    const data = await fetchPublicUserProfile(id, currentUser?.id);
    setProfile(data.profile);
    setOverview(data.overview);
    setStreak(data.streak);
    setAchievements(data.achievements);
    setFollowers(data.followers);
    setFollowing(data.following);
    setConnectionStatus(data.connectionStatus.status);
    setConnectionId(data.connectionStatus.connectionId);
    setIsLoading(false);
  }, [id, currentUser?.id]);

  useEffect(() => {
    loadUserData();
  }, [loadUserData]);

  const handleConnectAction = async () => {
    if (!currentUser) return;
    if (!id) return;

    setIsActionLoading(true);

    if (connectionStatus === 'none' || connectionStatus === 'rejected') {
      const res = await sendFollowRequest(currentUser.id, id);
      if (res.success) {
        setConnectionStatus('pending_sent');
      }
    } else if (connectionStatus === 'pending_received' && connectionId) {
      const res = await respondToConnectionRequest(connectionId, 'accepted');
      if (res.success) {
        setConnectionStatus('accepted');
        await loadUserData();
      }
    } else if (connectionStatus === 'accepted' || connectionStatus === 'pending_sent') {
      // Cancel request or unfollow
      const res = await removeConnection(currentUser.id, id);
      if (res.success) {
        setConnectionStatus('none');
        await loadUserData();
      }
    }

    setIsActionLoading(false);
  };

  // Avatar helper
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

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.topHeader}>
          <Pressable onPress={() => router.back()} style={styles.backButton} hitSlop={10}>
            <AppIcon name="arrow-back" size={24} color={Palette.ink} />
          </Pressable>
          <Text style={styles.topHeaderTitle}>Athlete Profile</Text>
          <View style={{ width: 36 }} />
        </View>
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={Palette.forest} />
          <Text style={styles.loadingText}>Loading athlete statistics...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.topHeader}>
          <Pressable onPress={() => router.back()} style={styles.backButton} hitSlop={10}>
            <AppIcon name="arrow-back" size={24} color={Palette.ink} />
          </Pressable>
          <Text style={styles.topHeaderTitle}>Athlete Profile</Text>
          <View style={{ width: 36 }} />
        </View>
        <View style={styles.notFoundWrap}>
          <AppIcon name="person-circle-outline" size={56} color={Palette.muted} />
          <Text style={styles.notFoundTitle}>Athlete Not Found</Text>
          <Text style={styles.notFoundSubtitle}>
            This user account does not exist or has not completed setup yet.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const avatar = getAvatarDisplay(profile.avatarUrl);
  const isOwnProfile = currentUser?.id === profile.id;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.topHeader}>
        <Pressable onPress={() => router.back()} style={styles.backButton} hitSlop={10}>
          <AppIcon name="arrow-back" size={24} color={Palette.ink} />
        </Pressable>
        <Text style={styles.topHeaderTitle}>@{profile.username}</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* User Card */}
        <View style={styles.profileCard}>
          <View style={styles.topRow}>
            <View style={[styles.avatarCircle, { backgroundColor: avatar.bg }]}>
              <Text style={styles.avatarEmoji}>{avatar.emoji}</Text>
            </View>

            <View style={styles.nameBlock}>
              <Text style={styles.fullName} numberOfLines={1}>
                {profile.fullName}
              </Text>
              <Text style={styles.username}>@{profile.username}</Text>

              {profile.college ? (
                <View style={styles.campusTag}>
                  <AppIcon name="school-outline" size={12} color={Palette.forest} />
                  <Text style={styles.campusText} numberOfLines={1}>
                    {profile.college.split('(')[0].trim()}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>

          {/* Social Stats */}
          <View style={styles.statsBar}>
            <View style={styles.statCol}>
              <Text style={styles.statNumber}>{overview.totalActivities}</Text>
              <Text style={styles.statLabel}>Activities</Text>
            </View>

            <View style={styles.statDivider} />

            <Pressable
              onPress={() => setSocialModalType('followers')}
              style={styles.statCol}
              hitSlop={8}>
              <Text style={styles.statNumber}>{followers.length}</Text>
              <Text style={styles.statLabel}>Followers</Text>
            </Pressable>

            <View style={styles.statDivider} />

            <Pressable
              onPress={() => setSocialModalType('following')}
              style={styles.statCol}
              hitSlop={8}>
              <Text style={styles.statNumber}>{following.length}</Text>
              <Text style={styles.statLabel}>Following</Text>
            </Pressable>
          </View>

          {/* Academic Dept / Year */}
          {(profile.department || profile.academicYear) && (
            <View style={styles.academicRow}>
              <Text style={styles.academicText} numberOfLines={1}>
                {[profile.department, profile.academicYear].filter(Boolean).join(' • ')}
              </Text>
            </View>
          )}

          {/* Bio */}
          {profile.bio ? <Text style={styles.bioText}>{profile.bio}</Text> : null}

          {/* Connect Action Button (NO Edit Profile button for other users!) */}
          {!isOwnProfile && (
            <View style={styles.btnRow}>
              {connectionStatus === 'pending_received' ? (
                <View style={styles.doubleBtnRow}>
                  <Pressable
                    onPress={handleConnectAction}
                    disabled={isActionLoading}
                    style={styles.acceptBigBtn}>
                    <Text style={styles.acceptBigBtnText}>Accept Connection</Text>
                  </Pressable>
                </View>
              ) : (
                <Pressable
                  onPress={handleConnectAction}
                  disabled={isActionLoading}
                  style={[
                    styles.connectBtn,
                    connectionStatus === 'accepted' && styles.connectedBtn,
                    connectionStatus === 'pending_sent' && styles.requestedBtn,
                  ]}>
                  {isActionLoading ? (
                    <ActivityIndicator size="small" color={Palette.forest} />
                  ) : (
                    <>
                      <AppIcon
                        name={
                          connectionStatus === 'accepted'
                            ? 'checkmark-circle'
                            : connectionStatus === 'pending_sent'
                            ? 'time-outline'
                            : 'person-add'
                        }
                        size={15}
                        color={
                          connectionStatus === 'none' || connectionStatus === 'rejected'
                            ? Palette.white
                            : Palette.forest
                        }
                      />
                      <Text
                        style={[
                          styles.connectBtnText,
                          (connectionStatus === 'accepted' ||
                            connectionStatus === 'pending_sent') &&
                            styles.connectBtnTextOutline,
                        ]}>
                        {connectionStatus === 'accepted'
                          ? 'Following (Connected)'
                          : connectionStatus === 'pending_sent'
                          ? 'Request Sent (Tap to Cancel)'
                          : 'Connect / Follow'}
                      </Text>
                    </>
                  )}
                </Pressable>
              )}
            </View>
          )}
        </View>

        {/* Fitness Overview */}
        <FitnessOverview overview={overview} />

        {/* Consistency Streak */}
        <ConsistencyCard streak={streak} />

        {/* Dynamic Achievements */}
        <AchievementsSection achievements={achievements} />
      </ScrollView>

      {/* Followers / Following Modal */}
      <Modal
        visible={socialModalType !== null}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSocialModalType(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {socialModalType === 'followers'
                  ? `Followers (${followers.length})`
                  : `Following (${following.length})`}
              </Text>
              <Pressable
                onPress={() => setSocialModalType(null)}
                style={styles.modalCloseBtn}
                hitSlop={10}>
                <AppIcon name="close" size={20} color={Palette.ink} />
              </Pressable>
            </View>

            <ScrollView style={styles.modalList} showsVerticalScrollIndicator={false}>
              {(socialModalType === 'followers' ? followers : following).length === 0 && (
                <View style={styles.emptySocialWrap}>
                  <Text style={styles.emptySocialText}>
                    {socialModalType === 'followers'
                      ? 'No followers yet.'
                      : 'Not following anyone yet.'}
                  </Text>
                </View>
              )}

              {(socialModalType === 'followers' ? followers : following).map((item) => (
                <Pressable
                  key={item.id}
                  onPress={() => {
                    setSocialModalType(null);
                    router.push({
                      pathname: '/profile/user',
                      params: { id: item.userId },
                    } as any);
                  }}
                  style={styles.modalUserRow}>
                  <View style={styles.modalAvatar}>
                    <Text style={{ fontSize: 16 }}>🏃</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.modalUserName}>{item.fullName}</Text>
                    <Text style={styles.modalUserHandle}>@{item.username}</Text>
                  </View>
                  <AppIcon name="chevron-forward" size={16} color={Palette.muted} />
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
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
    borderBottomWidth: 1,
    borderBottomColor: Palette.border,
    backgroundColor: Palette.white,
  },
  backButton: {
    padding: 4,
  },
  topHeaderTitle: {
    ...Typography.sectionHeading,
    fontSize: 16,
    color: Palette.ink,
  },
  scrollContent: {
    paddingHorizontal: Spacing.space4,
    paddingTop: Spacing.space3,
    paddingBottom: Spacing.space8,
    maxWidth: 600,
    width: '100%',
    alignSelf: 'center',
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
    fontFamily: FontFamily.regular,
    color: Palette.muted,
  },
  notFoundWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.space6,
    gap: 8,
  },
  notFoundTitle: {
    ...Typography.cardHeading,
    fontSize: 18,
    color: Palette.ink,
  },
  notFoundSubtitle: {
    ...Typography.body,
    fontSize: 13,
    color: Palette.muted,
    textAlign: 'center',
  },
  profileCard: {
    backgroundColor: Palette.white,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Palette.border,
    padding: Spacing.space4,
    marginBottom: Spacing.space4,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: Spacing.space3,
  },
  avatarCircle: {
    width: 62,
    height: 62,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Palette.white,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  avatarEmoji: {
    fontSize: 28,
    fontFamily: FontFamily.regular,
  },
  nameBlock: {
    flex: 1,
  },
  fullName: {
    ...Typography.cardHeading,
    fontSize: 18,
    fontWeight: '800',
    fontFamily: FontFamily.bold,
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
    fontFamily: FontFamily.medium,
    color: Palette.forest,
  },
  statsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: Palette.surfaceSubtle,
    borderRadius: Radius.sm,
    paddingVertical: 10,
    marginBottom: Spacing.space3,
  },
  statCol: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    ...Typography.cardHeading,
    fontSize: 16,
    fontWeight: '800',
    fontFamily: FontFamily.bold,
    color: Palette.ink,
  },
  statLabel: {
    ...Typography.supporting,
    fontSize: 11,
    color: Palette.muted,
    marginTop: 1,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: Palette.border,
  },
  academicRow: {
    backgroundColor: Palette.surfaceHighlight,
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
    fontFamily: FontFamily.medium,
  },
  bioText: {
    ...Typography.body,
    fontSize: 13,
    color: Palette.muted,
    lineHeight: 18,
    marginBottom: Spacing.space3,
  },
  btnRow: {
    marginTop: 4,
  },
  doubleBtnRow: {
    flexDirection: 'row',
    gap: 8,
  },
  connectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Palette.forest,
    paddingVertical: 10,
    borderRadius: Radius.btn,
  },
  connectedBtn: {
    backgroundColor: Palette.surfaceSubtle,
    borderWidth: 1,
    borderColor: Palette.forest,
  },
  requestedBtn: {
    backgroundColor: Palette.surfaceSubtle,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  connectBtnText: {
    fontSize: 13,
    fontWeight: '700',
    fontFamily: FontFamily.bold,
    color: Palette.white,
  },
  connectBtnTextOutline: {
    color: Palette.forest,
  },
  acceptBigBtn: {
    flex: 1,
    backgroundColor: Palette.forest,
    paddingVertical: 10,
    borderRadius: Radius.btn,
    alignItems: 'center',
  },
  acceptBigBtnText: {
    fontSize: 13,
    fontWeight: '700',
    fontFamily: FontFamily.bold,
    color: Palette.white,
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: Palette.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: Spacing.space4,
    paddingTop: Spacing.space4,
    paddingBottom: Spacing.space8,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.space3,
  },
  modalTitle: {
    ...Typography.sectionHeading,
    fontSize: 17,
    color: Palette.ink,
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalList: {
    maxHeight: 340,
  },
  emptySocialWrap: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  emptySocialText: {
    fontSize: 13,
    fontFamily: FontFamily.regular,
    color: Palette.muted,
  },
  modalUserRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Palette.border,
  },
  modalAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Palette.surfaceHighlight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalUserName: {
    fontSize: 13,
    fontWeight: '700',
    fontFamily: FontFamily.bold,
    color: Palette.ink,
  },
  modalUserHandle: {
    fontSize: 11.5,
    fontFamily: FontFamily.regular,
    color: Palette.muted,
  },
});
