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
import { useChallenges } from '@/context/challenge-context';

export default function ChallengeDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const { getChallengeById, joinChallenge, leaveChallenge } = useChallenges();

  const challenge = getChallengeById(params.id || '');

  if (!challenge) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.topHeader}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <AppIcon name="arrow-back" size={24} color={Palette.ink} />
          </Pressable>
          <Text style={styles.topHeaderTitle}>Challenge Details</Text>
          <View style={{ width: 36 }} />
        </View>
        <View style={styles.notFoundContainer}>
          <Text style={styles.notFoundText}>Challenge not found.</Text>
          <Button label="Back to Challenges" onPress={() => router.back()} />
        </View>
      </SafeAreaView>
    );
  }

  const isJoined = challenge.status === 'active';
  const isCompleted = challenge.status === 'completed';

  const percentage = Math.min(
    100,
    Math.round((challenge.progress / challenge.goal) * 100)
  );

  const handleJoin = () => {
    joinChallenge(challenge.id);
  };

  const handleLeave = () => {
    Alert.alert(
      'Leave Challenge?',
      'Are you sure you want to leave this challenge? Your current progress in this challenge will be paused.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave Challenge',
          style: 'destructive',
          onPress: () => leaveChallenge(challenge.id),
        },
      ]
    );
  };

  const difficultyColors = {
    beginner: { bg: 'rgba(197, 243, 107, 0.25)', text: Palette.forest },
    intermediate: { bg: 'rgba(82, 121, 246, 0.15)', text: Palette.electricBlue },
    advanced: { bg: 'rgba(229, 108, 103, 0.15)', text: Palette.coral },
  };

  const diffStyle = difficultyColors[challenge.difficulty] || difficultyColors.beginner;

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top Header */}
      <View style={styles.topHeader}>
        <Pressable onPress={() => router.back()} style={styles.backButton} hitSlop={10}>
          <AppIcon name="arrow-back" size={24} color={Palette.ink} />
        </Pressable>
        <Text style={styles.topHeaderTitle} numberOfLines={1}>
          {challenge.title}
        </Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* A. Challenge Banner */}
        <View style={styles.bannerCard}>
          <View style={styles.bannerBadges}>
            {challenge.featured && (
              <View style={styles.featuredBadge}>
                <AppIcon name="sparkles" size={11} color={Palette.ink} />
                <Text style={styles.featuredBadgeText}>FEATURED</Text>
              </View>
            )}
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryBadgeText}>
                {challenge.category.toUpperCase()}
              </Text>
            </View>
            <View style={[styles.diffBadge, { backgroundColor: diffStyle.bg }]}>
              <Text style={[styles.diffBadgeText, { color: diffStyle.text }]}>
                {challenge.difficulty.toUpperCase()}
              </Text>
            </View>
          </View>

          <Text style={styles.bannerTitle}>{challenge.title}</Text>
          <Text style={styles.bannerDescription}>{challenge.description}</Text>
        </View>

        {/* F. Your Progress (If joined or completed) */}
        {(isJoined || isCompleted) && (
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionIconWrap}>
                <AppIcon
                  name={isCompleted ? 'checkmark-circle' : 'trending-up'}
                  size={16}
                  color={Palette.forest}
                />
              </View>
              <Text style={styles.sectionTitle}>
                {isCompleted ? 'Challenge Completed' : 'Your Progress'}
              </Text>
            </View>

            <View style={styles.progressValueRow}>
              <Text style={styles.progressNumber}>
                {challenge.progress.toLocaleString()}
              </Text>
              <Text style={styles.progressGoal}>
                / {challenge.goal.toLocaleString()} {challenge.goalUnit}
              </Text>
            </View>

            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${percentage}%` },
                  isCompleted && styles.progressFillCompleted,
                ]}
              />
            </View>

            <View style={styles.progressFooter}>
              <Text style={styles.progressPercentText}>{percentage}% Completed</Text>
              <Text style={styles.progressRemainingText}>
                {isCompleted ? 'All milestones achieved' : `${challenge.remainingDays} days remaining`}
              </Text>
            </View>
          </View>
        )}

        {/* C. Challenge Objective */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionIconWrap}>
              <AppIcon name="flag-outline" size={16} color={Palette.forest} />
            </View>
            <Text style={styles.sectionTitle}>Challenge Objective</Text>
          </View>

          <View style={styles.objectiveGrid}>
            <View style={styles.objectiveItem}>
              <Text style={styles.objectiveLabel}>Target Goal</Text>
              <Text style={styles.objectiveValue}>{challenge.goalFormatted}</Text>
            </View>

            <View style={styles.objectiveItem}>
              <Text style={styles.objectiveLabel}>Duration</Text>
              <Text style={styles.objectiveValue}>{challenge.durationDays} Days</Text>
            </View>

            <View style={styles.objectiveItem}>
              <Text style={styles.objectiveLabel}>Start Date</Text>
              <Text style={styles.objectiveValue}>{challenge.startDate}</Text>
            </View>

            <View style={styles.objectiveItem}>
              <Text style={styles.objectiveLabel}>End Date</Text>
              <Text style={styles.objectiveValue}>{challenge.endDate}</Text>
            </View>
          </View>
        </View>

        {/* E. Reward Points Card */}
        <View style={styles.rewardCard}>
          <View style={styles.rewardIconCircle}>
            <AppIcon name="trophy" size={24} color={Palette.amber} />
          </View>
          <View style={styles.rewardTextWrap}>
            <Text style={styles.rewardTitle}>Challenge Reward</Text>
            <Text style={styles.rewardPoints}>+{challenge.rewardPoints} Campus Points</Text>
            <Text style={styles.rewardNote}>
              Earned upon reaching 100% of the challenge target before the expiry deadline.
            </Text>
          </View>
        </View>

        {/* H. Team Participation (If Squad challenge) */}
        {challenge.squadInfo && (
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionIconWrap}>
                <AppIcon name="people" size={16} color={Palette.forest} />
              </View>
              <Text style={styles.sectionTitle}>Squad Performance</Text>
            </View>

            <View style={styles.squadSummary}>
              <Text style={styles.squadName}>{challenge.squadInfo.squadName}</Text>
              <Text style={styles.squadProgressText}>
                {challenge.squadInfo.teamProgress.toLocaleString()} /{' '}
                {challenge.squadInfo.teamTarget.toLocaleString()} {challenge.goalUnit}
              </Text>
            </View>

            <View style={styles.squadMembersList}>
              <Text style={styles.squadMembersTitle}>Squad Member Contributions</Text>
              {challenge.squadInfo.members.map((member, idx) => (
                <View key={idx} style={styles.memberRow}>
                  <View
                    style={[
                      styles.memberAvatar,
                      { backgroundColor: member.avatarColor },
                    ]}>
                    <Text style={styles.memberEmoji}>{member.avatarEmoji}</Text>
                  </View>
                  <View style={styles.memberInfo}>
                    <Text style={styles.memberName}>{member.name}</Text>
                    <Text style={styles.memberUsername}>@{member.username}</Text>
                  </View>
                  <Text style={styles.memberContribution}>
                    {member.contribution.toLocaleString()} {member.contributionUnit}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* D. Rules and Eligibility */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionIconWrap}>
              <AppIcon name="shield-checkmark-outline" size={16} color={Palette.forest} />
            </View>
            <Text style={styles.sectionTitle}>Rules & Eligibility</Text>
          </View>

          <View style={styles.rulesList}>
            {challenge.rules.map((rule, idx) => (
              <View key={idx} style={styles.ruleItem}>
                <Text style={styles.ruleBullet}>•</Text>
                <Text style={styles.ruleText}>{rule}</Text>
              </View>
            ))}
          </View>

          <View style={styles.eligibilityBlock}>
            <Text style={styles.eligibilityLabel}>Eligibility:</Text>
            <Text style={styles.eligibilityText}>{challenge.eligibility}</Text>
          </View>
        </View>

        {/* G. Participants Preview */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionIconWrap}>
              <AppIcon name="people-outline" size={16} color={Palette.forest} />
            </View>
            <Text style={styles.sectionTitle}>Participants ({challenge.participantsCount.toLocaleString()})</Text>
          </View>

          <View style={styles.participantsList}>
            {challenge.participantsPreview.map((p) => (
              <View key={p.id} style={styles.participantItem}>
                <View
                  style={[
                    styles.participantAvatar,
                    { backgroundColor: p.avatarColor },
                  ]}>
                  <Text style={styles.participantEmoji}>{p.avatarEmoji}</Text>
                </View>
                <View style={styles.participantInfo}>
                  <Text style={styles.participantName}>{p.name}</Text>
                  <Text style={styles.participantUsername}>@{p.username}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* I. Sticky Bottom Bar: Join / Leave Action */}
      <View style={styles.bottomBar}>
        {!isJoined && !isCompleted && (
          <Button
            label="Join Challenge"
            variant="primary"
            size="lg"
            onPress={handleJoin}
            icon={<AppIcon name="add" size={18} color={Palette.ink} />}
          />
        )}

        {isJoined && (
          <View style={styles.joinedActionRow}>
            <View style={styles.joinedBadge}>
              <AppIcon name="checkmark-circle" size={16} color={Palette.forest} />
              <Text style={styles.joinedBadgeText}>Joined</Text>
            </View>
            <View style={styles.leaveBtnWrap}>
              <Button
                label="Leave Challenge"
                variant="coral"
                size="md"
                onPress={handleLeave}
              />
            </View>
          </View>
        )}

        {isCompleted && (
          <View style={styles.completedBanner}>
            <AppIcon name="trophy" size={18} color={Palette.amber} />
            <Text style={styles.completedBannerText}>
              Completed! +{challenge.rewardPoints} points awarded
            </Text>
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
    backgroundColor: Palette.forest,
    borderRadius: Radius.card,
    padding: Spacing.space4 + 2,
    marginBottom: Spacing.space4,
    borderWidth: 1,
    borderColor: Palette.borderDark,
  },
  bannerBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: Spacing.space2 + 2,
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
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
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
  diffBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  diffBadgeText: {
    ...Typography.supporting,
    fontSize: 10.5,
    fontWeight: '700',
  },
  bannerTitle: {
    ...Typography.pageTitle,
    fontSize: 24,
    lineHeight: 30,
    color: Palette.white,
    fontWeight: '800',
    marginBottom: 6,
  },
  bannerDescription: {
    ...Typography.body,
    fontSize: 13.5,
    color: 'rgba(255, 255, 255, 0.85)',
    lineHeight: 19,
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
  progressValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    marginBottom: 8,
  },
  progressNumber: {
    ...Typography.stats,
    fontSize: 28,
    color: Palette.ink,
  },
  progressGoal: {
    ...Typography.supporting,
    fontSize: 13,
    color: Palette.muted,
  },
  progressTrack: {
    height: 10,
    borderRadius: Radius.full,
    backgroundColor: Palette.surfaceSubtle,
    overflow: 'hidden',
    marginBottom: Spacing.space2,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Palette.forest,
    borderRadius: Radius.full,
  },
  progressFillCompleted: {
    backgroundColor: Palette.lime,
  },
  progressFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  progressPercentText: {
    ...Typography.supporting,
    fontSize: 12,
    fontWeight: '700',
    color: Palette.forest,
  },
  progressRemainingText: {
    ...Typography.supporting,
    fontSize: 11.5,
    color: Palette.muted,
  },
  objectiveGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.space3,
  },
  objectiveItem: {
    width: '47%',
    flexGrow: 1,
    backgroundColor: Palette.surfaceHighlight,
    borderRadius: Radius.sm,
    padding: Spacing.space3,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  objectiveLabel: {
    ...Typography.supporting,
    fontSize: 11,
    color: Palette.muted,
    marginBottom: 2,
  },
  objectiveValue: {
    ...Typography.bodyBold,
    fontSize: 13,
    color: Palette.ink,
  },
  rewardCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Palette.white,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Palette.border,
    padding: Spacing.space4,
    marginBottom: Spacing.space4,
    gap: 14,
  },
  rewardIconCircle: {
    width: 48,
    height: 48,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(232, 163, 74, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rewardTextWrap: {
    flex: 1,
  },
  rewardTitle: {
    ...Typography.supporting,
    fontSize: 11,
    color: Palette.muted,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  rewardPoints: {
    ...Typography.cardHeading,
    fontSize: 17,
    color: Palette.ink,
    marginVertical: 2,
  },
  rewardNote: {
    ...Typography.supporting,
    fontSize: 11.5,
    color: Palette.muted,
    lineHeight: 16,
  },
  squadSummary: {
    backgroundColor: Palette.surfaceHighlight,
    borderRadius: Radius.sm,
    padding: Spacing.space3,
    marginBottom: Spacing.space3,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  squadName: {
    ...Typography.bodyBold,
    fontSize: 14,
    color: Palette.ink,
  },
  squadProgressText: {
    ...Typography.supporting,
    fontSize: 12,
    color: Palette.muted,
    marginTop: 2,
  },
  squadMembersTitle: {
    ...Typography.supporting,
    fontSize: 11.5,
    fontWeight: '700',
    color: Palette.muted,
    marginBottom: Spacing.space2,
  },
  squadMembersList: {
    gap: 8,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
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
  memberName: {
    ...Typography.bodyBold,
    fontSize: 12.5,
    color: Palette.ink,
  },
  memberUsername: {
    ...Typography.supporting,
    fontSize: 11,
    color: Palette.muted,
  },
  memberContribution: {
    ...Typography.bodyBold,
    fontSize: 12,
    color: Palette.forest,
  },
  rulesList: {
    gap: 8,
    marginBottom: Spacing.space3,
  },
  ruleItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  ruleBullet: {
    fontSize: 14,
    color: Palette.forest,
    lineHeight: 18,
  },
  ruleText: {
    ...Typography.body,
    fontSize: 12.5,
    color: Palette.ink,
    lineHeight: 18,
    flex: 1,
  },
  eligibilityBlock: {
    backgroundColor: Palette.surfaceHighlight,
    borderRadius: Radius.sm,
    padding: Spacing.space3,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  eligibilityLabel: {
    ...Typography.supporting,
    fontSize: 11,
    fontWeight: '700',
    color: Palette.muted,
    marginBottom: 2,
  },
  eligibilityText: {
    ...Typography.body,
    fontSize: 12,
    color: Palette.ink,
  },
  participantsList: {
    gap: 8,
  },
  participantItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  participantAvatar: {
    width: 32,
    height: 32,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  participantEmoji: {
    fontSize: 15,
  },
  participantInfo: {
    flex: 1,
  },
  participantName: {
    ...Typography.bodyBold,
    fontSize: 12.5,
    color: Palette.ink,
  },
  participantUsername: {
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
  completedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    backgroundColor: Palette.surfaceSubtle,
    borderRadius: Radius.btn,
  },
  completedBannerText: {
    ...Typography.bodyBold,
    fontSize: 13.5,
    color: Palette.ink,
  },
});
