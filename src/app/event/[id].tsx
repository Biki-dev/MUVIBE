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

export default function EventDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const { getEventById, toggleRegisterEvent } = useCommunity();

  const event = getEventById(params.id || '');

  if (!event) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.topHeader}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <AppIcon name="arrow-back" size={24} color={Palette.ink} />
          </Pressable>
          <Text style={styles.topHeaderTitle}>Event Details</Text>
          <View style={{ width: 36 }} />
        </View>
        <View style={styles.notFoundContainer}>
          <Text style={styles.notFoundText}>Event not found.</Text>
          <Button label="Back to Community" onPress={() => router.back()} />
        </View>
      </SafeAreaView>
    );
  }

  const handleToggleRegister = () => {
    if (event.registered) {
      Alert.alert(
        'Cancel Registration?',
        `Are you sure you want to cancel your registration for ${event.name}?`,
        [
          { text: 'Keep Registration', style: 'cancel' },
          {
            text: 'Cancel Registration',
            style: 'destructive',
            onPress: () => toggleRegisterEvent(event.id),
          },
        ]
      );
    } else {
      toggleRegisterEvent(event.id);
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
          {event.name}
        </Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* A. Event Banner */}
        <View style={[styles.bannerCard, { backgroundColor: event.coverColor }]}>
          <View style={styles.badgeRow}>
            {event.featured && (
              <View style={styles.featuredBadge}>
                <AppIcon name="star" size={11} color={Palette.ink} />
                <Text style={styles.featuredBadgeText}>FEATURED EVENT</Text>
              </View>
            )}
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryBadgeText}>{event.categoryLabel}</Text>
            </View>
          </View>

          <Text style={styles.bannerTitle}>{event.name}</Text>
          <Text style={styles.bannerOrganizer}>Organized by {event.organizer}</Text>
        </View>

        {/* B. Event Information Grid */}
        <View style={styles.infoCard}>
          <View style={styles.infoGrid}>
            <View style={styles.infoCol}>
              <Text style={styles.infoLabel}>Event Date</Text>
              <Text style={styles.infoValue}>{event.date}</Text>
            </View>

            <View style={styles.infoCol}>
              <Text style={styles.infoLabel}>Time</Text>
              <Text style={styles.infoValue}>{event.startTime} - {event.endTime}</Text>
            </View>

            <View style={styles.infoCol}>
              <Text style={styles.infoLabel}>Distance / Target</Text>
              <Text style={styles.infoValue}>{event.distanceOrTarget}</Text>
            </View>

            <View style={styles.infoCol}>
              <Text style={styles.infoLabel}>Estimated Duration</Text>
              <Text style={styles.infoValue}>{event.estimatedDuration}</Text>
            </View>

            <View style={styles.infoColFull}>
              <Text style={styles.infoLabel}>Venue</Text>
              <Text style={styles.infoValue}>{event.venue}</Text>
            </View>

            <View style={styles.infoColFull}>
              <Text style={styles.infoLabel}>Registration Deadline</Text>
              <Text style={[styles.infoValue, { color: Palette.coral }]}>
                {event.registrationDeadline}
              </Text>
            </View>
          </View>
        </View>

        {/* C. About the Event */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionIconWrap}>
              <AppIcon name="information-circle-outline" size={16} color={Palette.forest} />
            </View>
            <Text style={styles.sectionTitle}>About the Event</Text>
          </View>
          <Text style={styles.descriptionText}>{event.description}</Text>
        </View>

        {/* D. Event Schedule */}
        {event.schedule.length > 0 && (
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionIconWrap}>
                <AppIcon name="time-outline" size={16} color={Palette.forest} />
              </View>
              <Text style={styles.sectionTitle}>Event Schedule</Text>
            </View>

            <View style={styles.timelineList}>
              {event.schedule.map((item: any, idx: number) => (
                <View key={idx} style={styles.timelineItem}>
                  <View style={styles.timelinePointWrap}>
                    <View style={styles.timelineDot} />
                    {idx < event.schedule.length - 1 && <View style={styles.timelineLine} />}
                  </View>
                  <View style={styles.timelineContent}>
                    <Text style={styles.timelineTime}>{item.time}</Text>
                    <Text style={styles.timelineTitle}>{item.title}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* E. Organizer Details */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionIconWrap}>
              <AppIcon name="shield-outline" size={16} color={Palette.forest} />
            </View>
            <Text style={styles.sectionTitle}>Organizer Details</Text>
          </View>

          <View style={styles.organizerRow}>
            <View style={styles.organizerAvatar}>
              <AppIcon name="flag" size={18} color={Palette.forest} />
            </View>
            <View style={styles.organizerInfo}>
              <Text style={styles.organizerName}>{event.organizer}</Text>
              <Text style={styles.organizerSub}>Official Campus Athletic Group</Text>
            </View>
          </View>
        </View>

        {/* F. Participants Preview */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionIconWrap}>
              <AppIcon name="people-outline" size={16} color={Palette.forest} />
            </View>
            <Text style={styles.sectionTitle}>Registered Participants ({event.participantCount})</Text>
          </View>

          <View style={styles.participantsList}>
            {event.participantsPreview.map((p: any, idx: number) => (
              <View key={idx} style={styles.participantRow}>
                <View style={[styles.pAvatar, { backgroundColor: p.avatarColor }]}>
                  <Text style={styles.pEmoji}>{p.avatarEmoji}</Text>
                </View>
                <View style={styles.pInfo}>
                  <Text style={styles.pName}>{p.name}</Text>
                  <Text style={styles.pUser}>@{p.username}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* G. Sticky Bottom Bar */}
      <View style={styles.bottomBar}>
        {!event.registered ? (
          <Button
            label="Register Now"
            variant="primary"
            size="lg"
            onPress={handleToggleRegister}
            icon={<AppIcon name="checkmark" size={18} color={Palette.ink} />}
          />
        ) : (
          <View style={styles.joinedActionRow}>
            <View style={styles.joinedBadge}>
              <AppIcon name="checkmark-circle" size={16} color={Palette.forest} />
              <Text style={styles.joinedBadgeText}>Registered</Text>
            </View>
            <View style={styles.leaveBtnWrap}>
              <Button
                label="Cancel Registration"
                variant="coral"
                size="md"
                onPress={handleToggleRegister}
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
    color: Palette.ink,
  },
  categoryBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  categoryBadgeText: {
    ...Typography.supporting,
    fontSize: 10.5,
    fontWeight: '700',
    color: Palette.white,
  },
  bannerTitle: {
    ...Typography.pageTitle,
    fontSize: 23,
    color: Palette.white,
    fontWeight: '800',
    marginBottom: 4,
  },
  bannerOrganizer: {
    ...Typography.body,
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.85)',
  },
  infoCard: {
    backgroundColor: Palette.white,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Palette.border,
    padding: Spacing.space4,
    marginBottom: Spacing.space4,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
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
  infoValue: {
    ...Typography.bodyBold,
    fontSize: 13,
    color: Palette.ink,
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
  descriptionText: {
    ...Typography.body,
    fontSize: 13.5,
    color: Palette.ink,
    lineHeight: 19,
  },
  timelineList: {
    paddingLeft: 4,
  },
  timelineItem: {
    flexDirection: 'row',
    minHeight: 44,
  },
  timelinePointWrap: {
    width: 20,
    alignItems: 'center',
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: Radius.full,
    backgroundColor: Palette.forest,
    marginTop: 3,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: Palette.border,
    marginVertical: 2,
  },
  timelineContent: {
    flex: 1,
    paddingLeft: 10,
    paddingBottom: 12,
  },
  timelineTime: {
    ...Typography.supporting,
    fontSize: 11,
    fontWeight: '700',
    color: Palette.forest,
  },
  timelineTitle: {
    ...Typography.bodyBold,
    fontSize: 13,
    color: Palette.ink,
    marginTop: 1,
  },
  organizerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  organizerAvatar: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    backgroundColor: Palette.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  organizerInfo: {
    flex: 1,
  },
  organizerName: {
    ...Typography.bodyBold,
    fontSize: 14,
    color: Palette.ink,
  },
  organizerSub: {
    ...Typography.supporting,
    fontSize: 11.5,
    color: Palette.muted,
  },
  participantsList: {
    gap: 8,
  },
  participantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  pAvatar: {
    width: 32,
    height: 32,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pEmoji: {
    fontSize: 15,
  },
  pInfo: {
    flex: 1,
  },
  pName: {
    ...Typography.bodyBold,
    fontSize: 12.5,
    color: Palette.ink,
  },
  pUser: {
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
