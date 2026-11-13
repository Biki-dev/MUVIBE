import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Palette, Radius, Spacing, Typography } from '@/constants/theme';
import { AppIcon } from '@/components/ui/icon';
import { BlitzQueueType } from '@/types/blitz';

interface BlitzChallengeCardProps {
  onSelectQueue: (queue: BlitzQueueType) => void;
  onStartSolo?: (exercise: 'pushups' | 'squats') => void;
}

export function BlitzChallengeCard({ onSelectQueue, onStartSolo }: BlitzChallengeCardProps) {
  return (
    <View style={styles.cardContainer}>
      {/* Top Header Row with Status & Badges */}
      <View style={styles.cardHeader}>
        <View style={styles.titleCol}>
          <View style={styles.titleBadgeRow}>
            <View style={styles.arenaPill}>
              <AppIcon name="flash" size={14} color={Palette.lime} />
              <Text style={styles.arenaPillText}>60-SECOND BLITZ ARENA</Text>
            </View>
            <View style={styles.liveBadge}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>LIVE</Text>
            </View>
          </View>
          <Text style={styles.subtitleText}>
            Real-time on-device AI form gating & live rep battles powered by Ultralytics YOLO26
          </Text>
        </View>
      </View>

      {/* 3 Queues Container */}
      <View style={styles.queuesContainer}>
        {/* Queue 1: Rapid Stranger */}
        <Pressable
          onPress={() => onSelectQueue('stranger')}
          style={({ pressed }) => [
            styles.queueOptionCard,
            pressed && styles.queueOptionCardPressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Rapid fight with stranger">
          <View style={[styles.iconWrapper, { backgroundColor: 'rgba(197, 243, 107, 0.18)' }]}>
            <AppIcon name="flash" size={18} color={Palette.lime} />
          </View>
          <View style={styles.queueContentCol}>
            <View style={styles.queueTitleRow}>
              <Text style={styles.queueTitle}>Fight Stranger</Text>
              <View style={styles.queueTag}>
                <Text style={styles.queueTagText}>~1.8s Match</Text>
              </View>
            </View>
            <Text style={styles.queueSubtitle}>
              Campus Brawl (Intra-College) or Inter-College Turf War
            </Text>
          </View>
          <AppIcon name="chevron-forward" size={16} color="rgba(255,255,255,0.4)" />
        </Pressable>

        {/* Queue 2: With Nearby People */}
        <Pressable
          onPress={() => onSelectQueue('nearby')}
          style={({ pressed }) => [
            styles.queueOptionCard,
            pressed && styles.queueOptionCardPressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Fight with nearby people">
          <View style={[styles.iconWrapper, { backgroundColor: 'rgba(82, 121, 246, 0.22)' }]}>
            <AppIcon name="navigate" size={18} color={Palette.electricBlue} />
          </View>
          <View style={styles.queueContentCol}>
            <View style={styles.queueTitleRow}>
              <Text style={styles.queueTitle}>Nearby People</Text>
              <View style={[styles.queueTag, { backgroundColor: 'rgba(82, 121, 246, 0.25)' }]}>
                <Text style={[styles.queueTagText, { color: Palette.electricBlue }]}>Geofenced</Text>
              </View>
            </View>
            <Text style={styles.queueSubtitle}>
              Proximity Ping radar scans students in hostel or library lounge
            </Text>
          </View>
          <AppIcon name="chevron-forward" size={16} color="rgba(255,255,255,0.4)" />
        </Pressable>

        {/* Queue 3: Custom Room */}
        <Pressable
          onPress={() => onSelectQueue('custom')}
          style={({ pressed }) => [
            styles.queueOptionCard,
            styles.queueOptionCardLast,
            pressed && styles.queueOptionCardPressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Custom room creation and matchmaking">
          <View style={[styles.iconWrapper, { backgroundColor: 'rgba(232, 163, 74, 0.22)' }]}>
            <AppIcon name="key" size={18} color={Palette.amber} />
          </View>
          <View style={styles.queueContentCol}>
            <View style={styles.queueTitleRow}>
              <Text style={styles.queueTitle}>Custom Room: Sprint & Blitz</Text>
              <View style={[styles.queueTag, { backgroundColor: 'rgba(232, 163, 74, 0.25)' }]}>
                <Text style={[styles.queueTagText, { color: Palette.amber }]}>2+ Runners Map Race</Text>
              </View>
            </View>
            <Text style={styles.queueSubtitle}>
              Race to a shared map checkpoint (live WebSocket GPS) or 60s blitz
            </Text>
          </View>
          <AppIcon name="chevron-forward" size={16} color="rgba(255,255,255,0.4)" />
        </Pressable>
      </View>

      {/* Quick Solo 60s AI Test Strip */}
      {onStartSolo && (
        <View style={styles.soloSectionRow}>
          <Pressable
            onPress={() => onStartSolo('pushups')}
            style={({ pressed }) => [styles.soloBtn, pressed && styles.soloBtnPressed]}>
            <AppIcon name="fitness" size={13} color={Palette.lime} />
            <Text style={styles.soloBtnText}>Solo 60s Push-ups</Text>
          </Pressable>

          <Pressable
            onPress={() => onStartSolo('squats')}
            style={({ pressed }) => [styles.soloBtn, pressed && styles.soloBtnPressed]}>
            <AppIcon name="body" size={13} color={Palette.electricBlue} />
            <Text style={styles.soloBtnText}>Solo 60s Squats</Text>
          </Pressable>
        </View>
      )}

      {/* Footer: Active AI Model & Privacy Tag */}
      <View style={styles.cardFooter}>
        <View style={styles.footerCol}>
          <View style={styles.footerAiRow}>
            <AppIcon name="hardware-chip-outline" size={11} color={Palette.lime} />
            <Text style={styles.footerAiText}>Ultralytics YOLO26n Pose (7.88 MB) Active</Text>
          </View>
          <Text style={styles.footerPrivacyText}>
            17 COCO Keypoints • AIGym Form Gate • Zero Video Leaves Device
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: '#0F241E',
    borderRadius: Radius.card,
    padding: Spacing.space4,
    borderWidth: 1.5,
    borderColor: 'rgba(197, 243, 107, 0.35)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
    width: '100%',
    marginBottom: Spacing.space4,
  },
  cardHeader: {
    marginBottom: Spacing.space3,
  },
  titleCol: {
    gap: 4,
  },
  titleBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  arenaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  arenaPillText: {
    fontSize: 14,
    fontWeight: '900',
    color: Palette.lime,
    letterSpacing: 0.8,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(197, 243, 107, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: 'rgba(197, 243, 107, 0.3)',
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Palette.lime,
  },
  liveText: {
    fontSize: 10,
    fontWeight: '800',
    color: Palette.lime,
    letterSpacing: 0.5,
  },
  subtitleText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.72)',
    lineHeight: 16,
    fontWeight: '500',
    marginTop: 2,
  },
  queuesContainer: {
    gap: 8,
    marginBottom: Spacing.space3,
  },
  queueOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    borderRadius: Radius.btn,
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  queueOptionCardLast: {
    marginBottom: 0,
  },
  queueOptionCardPressed: {
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    transform: [{ scale: 0.99 }],
  },
  iconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  queueContentCol: {
    flex: 1,
  },
  queueTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  queueTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: Palette.white,
    letterSpacing: 0.2,
  },
  queueTag: {
    backgroundColor: 'rgba(197, 243, 107, 0.18)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  queueTagText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: Palette.lime,
  },
  queueSubtitle: {
    fontSize: 10.5,
    color: 'rgba(255, 255, 255, 0.65)',
    lineHeight: 14,
    marginTop: 2,
  },
  soloSectionRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: Spacing.space3,
  },
  soloBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: Radius.sm,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  soloBtnPressed: {
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
  },
  soloBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: Palette.white,
  },
  cardFooter: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  footerCol: {
    gap: 2,
  },
  footerAiRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  footerAiText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: Palette.lime,
    letterSpacing: 0.3,
  },
  footerPrivacyText: {
    fontSize: 9,
    color: 'rgba(255, 255, 255, 0.55)',
  },
});
