import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Palette, Radius, Spacing, Typography } from '@/constants/theme';
import { AppIcon } from '@/components/ui/icon';
import { BlitzQueueType } from '@/types/blitz';

interface BlitzCardProps {
  onSelectQueue: (queue: BlitzQueueType) => void;
}

export function BlitzCard({ onSelectQueue }: BlitzCardProps) {
  return (
    <View style={styles.cardContainer}>
      {/* Card Header with Glowing Live Dot */}
      <View style={styles.cardHeader}>
        <View style={styles.titleRow}>
          <AppIcon name="flash" size={14} color={Palette.lime} />
          <Text style={styles.titleText}>60s BLITZ</Text>
        </View>
        <View style={styles.liveBadge}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>LIVE</Text>
        </View>
      </View>

      <Text style={styles.subtitleText}>Real-Time Matchmaking</Text>

      {/* 3 Matchmaking Options */}
      <View style={styles.optionsList}>
        {/* Option 1: Rapid fight with stranger */}
        <Pressable
          onPress={() => onSelectQueue('stranger')}
          style={({ pressed }) => [
            styles.optionButton,
            pressed && styles.optionButtonPressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Rapid fight with stranger">
          <View style={[styles.iconWrapper, { backgroundColor: 'rgba(197, 243, 107, 0.18)' }]}>
            <AppIcon name="flash" size={13} color={Palette.lime} />
          </View>
          <View style={styles.optionContent}>
            <Text style={styles.optionTitle} numberOfLines={1}>
              Fight Stranger
            </Text>
            <Text style={styles.optionMeta} numberOfLines={1}>
              Campus Brawl / Turf War
            </Text>
          </View>
          <AppIcon name="chevron-forward" size={12} color="rgba(255,255,255,0.4)" />
        </Pressable>

        {/* Option 2: With nearby people */}
        <Pressable
          onPress={() => onSelectQueue('nearby')}
          style={({ pressed }) => [
            styles.optionButton,
            pressed && styles.optionButtonPressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Fight with nearby people">
          <View style={[styles.iconWrapper, { backgroundColor: 'rgba(82, 121, 246, 0.22)' }]}>
            <AppIcon name="navigate" size={13} color={Palette.electricBlue} />
          </View>
          <View style={styles.optionContent}>
            <Text style={styles.optionTitle} numberOfLines={1}>
              Nearby People
            </Text>
            <Text style={styles.optionMeta} numberOfLines={1}>
              Proximity Ping (Hostel/Lounge)
            </Text>
          </View>
          <AppIcon name="chevron-forward" size={12} color="rgba(255,255,255,0.4)" />
        </Pressable>

        {/* Option 3: Custom room creation and matchmaking */}
        <Pressable
          onPress={() => onSelectQueue('custom')}
          style={({ pressed }) => [
            styles.optionButton,
            styles.optionButtonLast,
            pressed && styles.optionButtonPressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Custom room creation and matchmaking">
          <View style={[styles.iconWrapper, { backgroundColor: 'rgba(232, 163, 74, 0.22)' }]}>
            <AppIcon name="key" size={13} color={Palette.amber} />
          </View>
          <View style={styles.optionContent}>
            <Text style={styles.optionTitle} numberOfLines={1}>
              Custom Room
            </Text>
            <Text style={styles.optionMeta} numberOfLines={1}>
              Create or join room code
            </Text>
          </View>
          <AppIcon name="chevron-forward" size={12} color="rgba(255,255,255,0.4)" />
        </Pressable>
      </View>

      {/* YOLO26 Model Tag */}
      <View style={styles.yoloCardFooter}>
        <AppIcon name="hardware-chip-outline" size={10} color={Palette.lime} />
        <Text style={styles.yoloFooterText}>YOLO26n-Pose (7.8MB) Active</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: Palette.forest,
    borderRadius: Radius.card,
    padding: Spacing.space3,
    borderWidth: 1.5,
    borderColor: 'rgba(197, 243, 107, 0.35)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 8,
    elevation: 4,
    minWidth: 200,
    maxWidth: 235,
    flexShrink: 0,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  titleText: {
    fontSize: 13,
    fontWeight: '800',
    color: Palette.lime,
    letterSpacing: 0.6,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(197, 243, 107, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Palette.lime,
  },
  liveText: {
    fontSize: 9,
    fontWeight: '800',
    color: Palette.lime,
    letterSpacing: 0.5,
  },
  subtitleText: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.65)',
    marginBottom: Spacing.space2,
    fontWeight: '500',
  },
  optionsList: {
    gap: 5,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: Radius.sm,
    paddingVertical: 5,
    paddingHorizontal: 7,
    gap: 7,
  },
  optionButtonLast: {
    marginBottom: 0,
  },
  optionButtonPressed: {
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    transform: [{ scale: 0.98 }],
  },
  iconWrapper: {
    width: 22,
    height: 22,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: Palette.white,
    lineHeight: 14,
  },
  optionMeta: {
    fontSize: 9,
    color: 'rgba(255, 255, 255, 0.6)',
    lineHeight: 11,
    marginTop: 1,
  },
  yoloCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  yoloFooterText: {
    fontSize: 8.5,
    fontWeight: '700',
    color: Palette.lime,
    letterSpacing: 0.3,
  },
});

