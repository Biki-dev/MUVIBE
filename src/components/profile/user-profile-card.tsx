import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Palette, Radius, Spacing, Typography, FontFamily } from '@/constants/theme';
import { AppIcon } from '@/components/ui/icon';
import { StudentProfile } from '@/types/auth';
import { UserConnectionItem, PublicUserProfile } from '@/types/profile';
import {
  searchUsers,
  sendFollowRequest,
  respondToConnectionRequest,
} from '@/services/profile-service';

interface UserProfileCardProps {
  profile: StudentProfile;
  currentUserId?: string;
  activitiesCount?: number;
  followers?: UserConnectionItem[];
  following?: UserConnectionItem[];
  pendingRequests?: UserConnectionItem[];
  onRefreshSocial?: () => void;
}

export function UserProfileCard({
  profile,
  currentUserId,
  activitiesCount = 0,
  followers = [],
  following = [],
  pendingRequests = [],
  onRefreshSocial,
}: UserProfileCardProps) {
  const router = useRouter();

  // Modals state
  const [socialModalType, setSocialModalType] = useState<'followers' | 'following' | null>(null);
  const [isSearchModalVisible, setIsSearchModalVisible] = useState(false);
  const [isRequestsModalVisible, setIsRequestsModalVisible] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<PublicUserProfile[]>([]);
  const [requestedUserIds, setRequestedUserIds] = useState<Record<string, boolean>>({});

  const displayName = profile.fullName?.trim() || 'Campus Athlete';
  const displayUsername = profile.username?.trim() || 'athlete';
  const displayCollege = profile.college?.trim() || 'Assam Engineering College';
  const displayDepartment = profile.department?.trim();
  const displayYear = profile.academicYear?.trim();
  const displayBio = profile.bio?.trim() || 'Moving towards everyday campus fitness & consistency.';

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

  // Handle Search
  const handlePerformSearch = async (text: string) => {
    setSearchQuery(text);
    if (!text.trim()) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    const results = await searchUsers(text, currentUserId);
    setSearchResults(results);
    setIsSearching(false);
  };

  // Handle send follow request from search
  const handleSendFollow = async (targetId: string) => {
    if (!currentUserId) {
      Alert.alert('Sign In Required', 'Please sign in to send connect requests.');
      return;
    }
    const res = await sendFollowRequest(currentUserId, targetId);
    if (res.success) {
      setRequestedUserIds((prev) => ({ ...prev, [targetId]: true }));
      onRefreshSocial?.();
    } else {
      Alert.alert('Error', res.error || 'Could not send request.');
    }
  };

  // Handle accept / reject incoming request
  const handleRespondRequest = async (connId: string, decision: 'accepted' | 'rejected') => {
    await respondToConnectionRequest(connId, decision);
    onRefreshSocial?.();
  };

  return (
    <View style={styles.card}>
      {/* Pending Requests Banner if any exist */}
      {pendingRequests.length > 0 && (
        <Pressable
          onPress={() => setIsRequestsModalVisible(true)}
          style={styles.pendingBanner}>
          <View style={styles.pendingBadgeIcon}>
            <AppIcon name="notifications" size={14} color={Palette.forest} />
          </View>
          <Text style={styles.pendingBannerText}>
            {pendingRequests.length} incoming friend request{pendingRequests.length > 1 ? 's' : ''}
          </Text>
          <Text style={styles.pendingBannerAction}>Review</Text>
        </Pressable>
      )}

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

      {/* Instagram-like Stats Bar */}
      <View style={styles.statsBar}>
        <View style={styles.statCol}>
          <Text style={styles.statNumber}>{activitiesCount}</Text>
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

      {/* Academic Details Pill (if department or year present) */}
      {(displayDepartment || displayYear) && (
        <View style={styles.academicRow}>
          <Text style={styles.academicText} numberOfLines={1}>
            {[displayDepartment, displayYear].filter(Boolean).join(' • ')}
          </Text>
        </View>
      )}

      {/* Bio */}
      <Text style={styles.bioText}>{displayBio}</Text>

      {/* Action Buttons Row */}
      <View style={styles.actionRow}>
        <Pressable
          onPress={() => router.push('/profile/edit' as any)}
          style={({ pressed }) => [styles.actionBtn, styles.editBtn, pressed && styles.btnPressed]}>
          <AppIcon name="create-outline" size={15} color={Palette.forest} />
          <Text style={styles.editBtnText}>Edit Profile</Text>
        </Pressable>

        <Pressable
          onPress={() => setIsSearchModalVisible(true)}
          style={({ pressed }) => [styles.actionBtn, styles.searchBtn, pressed && styles.btnPressed]}>
          <AppIcon name="person-add-outline" size={15} color={Palette.white} />
          <Text style={styles.searchBtnText}>Find Athletes</Text>
        </Pressable>
      </View>

      {/* ── MODAL 1: Followers / Following List ── */}
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
              {socialModalType === 'followers' && followers.length === 0 && (
                <View style={styles.emptyWrap}>
                  <AppIcon name="people-outline" size={32} color={Palette.muted} />
                  <Text style={styles.emptyText}>No followers yet.</Text>
                  <Text style={styles.emptySubtext}>Invite campus friends to share your journey!</Text>
                </View>
              )}

              {socialModalType === 'following' && following.length === 0 && (
                <View style={styles.emptyWrap}>
                  <AppIcon name="people-outline" size={32} color={Palette.muted} />
                  <Text style={styles.emptyText}>Not following anyone yet.</Text>
                  <Text style={styles.emptySubtext}>Search athletes below to stay inspired.</Text>
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
                  style={({ pressed }) => [styles.userRow, pressed && styles.userRowPressed]}>
                  <View style={styles.userRowAvatar}>
                    <Text style={{ fontSize: 18 }}>🏃</Text>
                  </View>
                  <View style={styles.userRowInfo}>
                    <Text style={styles.userRowName}>{item.fullName}</Text>
                    <Text style={styles.userRowHandle}>@{item.username}</Text>
                    {item.college ? (
                      <Text style={styles.userRowCollege} numberOfLines={1}>
                        {item.college}
                      </Text>
                    ) : null}
                  </View>
                  <View style={styles.viewArrowWrap}>
                    <AppIcon name="chevron-forward" size={16} color={Palette.muted} />
                  </View>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ── MODAL 2: Find & Connect Athletes ── */}
      <Modal
        visible={isSearchModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsSearchModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Find Campus Athletes</Text>
                <Text style={styles.modalSubtitle}>Search by name, @username or account ID</Text>
              </View>
              <Pressable
                onPress={() => setIsSearchModalVisible(false)}
                style={styles.modalCloseBtn}
                hitSlop={10}>
                <AppIcon name="close" size={20} color={Palette.ink} />
              </Pressable>
            </View>

            {/* Search Input */}
            <View style={styles.searchInputRow}>
              <AppIcon name="search" size={18} color={Palette.muted} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search username, athlete name..."
                placeholderTextColor={Palette.muted}
                value={searchQuery}
                onChangeText={handlePerformSearch}
                autoCapitalize="none"
                autoCorrect={false}
              />
              {searchQuery.length > 0 && (
                <Pressable onPress={() => handlePerformSearch('')} hitSlop={6}>
                  <AppIcon name="close-circle" size={16} color={Palette.muted} />
                </Pressable>
              )}
            </View>

            {isSearching && (
              <View style={styles.searchingWrap}>
                <ActivityIndicator size="small" color={Palette.forest} />
                <Text style={styles.searchingText}>Searching campus roster...</Text>
              </View>
            )}

            <ScrollView style={styles.modalList} showsVerticalScrollIndicator={false}>
              {!isSearching && searchQuery.trim().length > 0 && searchResults.length === 0 && (
                <View style={styles.emptyWrap}>
                  <AppIcon name="search-outline" size={32} color={Palette.muted} />
                  <Text style={styles.emptyText}>No athletes found</Text>
                  <Text style={styles.emptySubtext}>Try a different name or username.</Text>
                </View>
              )}

              {searchResults.map((user) => {
                const isRequested = requestedUserIds[user.id];

                return (
                  <View key={user.id} style={styles.userRow}>
                    <Pressable
                      style={styles.userRowTouch}
                      onPress={() => {
                        setIsSearchModalVisible(false);
                        router.push({
                          pathname: '/profile/user',
                          params: { id: user.id },
                        } as any);
                      }}>
                      <View style={styles.userRowAvatar}>
                        <Text style={{ fontSize: 18 }}>🏃</Text>
                      </View>
                      <View style={styles.userRowInfo}>
                        <Text style={styles.userRowName}>{user.fullName}</Text>
                        <Text style={styles.userRowHandle}>@{user.username}</Text>
                        <Text style={styles.userRowCollege} numberOfLines={1}>
                          {user.college}
                        </Text>
                      </View>
                    </Pressable>

                    <Pressable
                      onPress={() => handleSendFollow(user.id)}
                      disabled={isRequested}
                      style={[
                        styles.followActionBtn,
                        isRequested && styles.followActionBtnSent,
                      ]}>
                      <Text
                        style={[
                          styles.followActionBtnText,
                          isRequested && styles.followActionBtnTextSent,
                        ]}>
                        {isRequested ? 'Requested' : 'Connect'}
                      </Text>
                    </Pressable>
                  </View>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ── MODAL 3: Pending Incoming Requests ── */}
      <Modal
        visible={isRequestsModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsRequestsModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Friend Requests ({pendingRequests.length})</Text>
              <Pressable
                onPress={() => setIsRequestsModalVisible(false)}
                style={styles.modalCloseBtn}
                hitSlop={10}>
                <AppIcon name="close" size={20} color={Palette.ink} />
              </Pressable>
            </View>

            <ScrollView style={styles.modalList} showsVerticalScrollIndicator={false}>
              {pendingRequests.map((req) => (
                <View key={req.id} style={styles.reqRow}>
                  <Pressable
                    style={styles.userRowTouch}
                    onPress={() => {
                      setIsRequestsModalVisible(false);
                      router.push({
                        pathname: '/profile/user',
                        params: { id: req.userId },
                      } as any);
                    }}>
                    <View style={styles.userRowAvatar}>
                      <Text style={{ fontSize: 18 }}>🏃</Text>
                    </View>
                    <View style={styles.userRowInfo}>
                      <Text style={styles.userRowName}>{req.fullName}</Text>
                      <Text style={styles.userRowHandle}>@{req.username}</Text>
                      {req.college ? (
                        <Text style={styles.userRowCollege} numberOfLines={1}>
                          {req.college}
                        </Text>
                      ) : null}
                    </View>
                  </Pressable>

                  <View style={styles.reqActionRow}>
                    <Pressable
                      onPress={() => handleRespondRequest(req.id, 'accepted')}
                      style={styles.acceptBtn}>
                      <Text style={styles.acceptBtnText}>Accept</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => handleRespondRequest(req.id, 'rejected')}
                      style={styles.rejectBtn}>
                      <Text style={styles.rejectBtnText}>Decline</Text>
                    </Pressable>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  pendingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EDF8D7',
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.space3,
    paddingVertical: 7,
    marginBottom: Spacing.space3,
    gap: 8,
  },
  pendingBadgeIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Palette.lime,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pendingBannerText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    fontFamily: FontFamily.bold,
    color: Palette.forest,
  },
  pendingBannerAction: {
    fontSize: 12,
    fontWeight: '800',
    fontFamily: FontFamily.bold,
    color: Palette.forest,
    textDecorationLine: 'underline',
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
  // Instagram stats bar
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
  actionRow: {
    flexDirection: 'row',
    gap: Spacing.space2,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: Radius.btn,
  },
  editBtn: {
    backgroundColor: Palette.surfaceHighlight,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  editBtnText: {
    ...Typography.supporting,
    fontSize: 12.5,
    fontWeight: '700',
    fontFamily: FontFamily.bold,
    color: Palette.forest,
  },
  searchBtn: {
    backgroundColor: Palette.forest,
  },
  searchBtnText: {
    ...Typography.supporting,
    fontSize: 12.5,
    fontWeight: '700',
    fontFamily: FontFamily.bold,
    color: Palette.white,
  },
  btnPressed: {
    opacity: 0.8,
  },
  // Modals
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
    maxHeight: '80%',
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
  modalSubtitle: {
    fontSize: 11.5,
    fontFamily: FontFamily.regular,
    color: Palette.muted,
    marginTop: 2,
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalList: {
    maxHeight: 380,
  },
  searchInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Palette.surfaceSubtle,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Palette.border,
    paddingHorizontal: Spacing.space3,
    paddingVertical: 8,
    gap: 8,
    marginBottom: Spacing.space3,
  },
  searchInput: {
    flex: 1,
    fontSize: 13.5,
    fontFamily: FontFamily.regular,
    color: Palette.ink,
    padding: 0,
  },
  searchingWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    justifyContent: 'center',
  },
  searchingText: {
    fontSize: 12,
    fontFamily: FontFamily.regular,
    color: Palette.muted,
  },
  emptyWrap: {
    alignItems: 'center',
    paddingVertical: 36,
  },
  emptyText: {
    ...Typography.cardHeading,
    fontSize: 15,
    color: Palette.ink,
    marginTop: 8,
  },
  emptySubtext: {
    fontSize: 12,
    fontFamily: FontFamily.regular,
    color: Palette.muted,
    marginTop: 4,
    textAlign: 'center',
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Palette.border,
    justifyContent: 'space-between',
  },
  userRowTouch: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },
  userRowPressed: {
    backgroundColor: Palette.surfaceSubtle,
  },
  userRowAvatar: {
    width: 38,
    height: 38,
    borderRadius: Radius.full,
    backgroundColor: Palette.surfaceHighlight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userRowInfo: {
    flex: 1,
  },
  userRowName: {
    fontSize: 13.5,
    fontWeight: '700',
    fontFamily: FontFamily.bold,
    color: Palette.ink,
  },
  userRowHandle: {
    fontSize: 11.5,
    fontFamily: FontFamily.regular,
    color: Palette.muted,
  },
  userRowCollege: {
    fontSize: 11,
    fontFamily: FontFamily.regular,
    color: Palette.forest,
    marginTop: 1,
  },
  viewArrowWrap: {
    paddingLeft: 6,
  },
  followActionBtn: {
    backgroundColor: Palette.forest,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.sm,
  },
  followActionBtnSent: {
    backgroundColor: Palette.surfaceSubtle,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  followActionBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
    fontFamily: FontFamily.bold,
    color: Palette.white,
  },
  followActionBtnTextSent: {
    color: Palette.muted,
  },
  reqRow: {
    flexDirection: 'column',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Palette.border,
    gap: 8,
  },
  reqActionRow: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'flex-end',
  },
  acceptBtn: {
    backgroundColor: Palette.forest,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: Radius.sm,
  },
  acceptBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
    fontFamily: FontFamily.bold,
    color: Palette.white,
  },
  rejectBtn: {
    backgroundColor: Palette.surfaceSubtle,
    borderWidth: 1,
    borderColor: Palette.border,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.sm,
  },
  rejectBtnText: {
    fontSize: 11.5,
    fontWeight: '600',
    fontFamily: FontFamily.medium,
    color: Palette.muted,
  },
});
