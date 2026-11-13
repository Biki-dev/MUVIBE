/**
 * src/components/challenge/blitz-challenge-card.tsx
 * ─────────────────────────────────────────────────────────────────
 * Entry point for Blitz Battle on the Challenges tab. Two bout
 * formats, three queues, all scored from the phone's own sensors.
 * ─────────────────────────────────────────────────────────────────
 */

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { FontFamily, Palette, Radius, Spacing, Typography } from '@/constants/theme';
import { AppIcon } from '@/components/ui/icon';
import { BlitzMode, BlitzQueueType } from '@/types/blitz';
import { BLITZ_MODES } from '@/constants/blitz-data';

interface BlitzChallengeCardProps {
  onSelectQueue: (queue: BlitzQueueType) => void;
  onStartMode?: (mode: BlitzMode) => void;
}

const QUEUES: { id: BlitzQueueType; title: string; meta: string; icon: string }[] = [
  {
    id: 'stranger',
    title: 'Campus Brawl',
    meta: 'Random rival from another college',
    icon: 'flash',
  },
  {
    id: 'nearby',
    title: 'Nearby',
    meta: 'Someone within a few hundred metres',
    icon: 'navigate',
  },
  {
    id: 'custom',
    title: 'Private Room',
    meta: 'Battle a friend on your own campus',
    icon: 'key',
  },
];

export function BlitzChallengeCard({ onSelectQueue, onStartMode }: BlitzChallengeCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.title}>Blitz Battle</Text>
          <Text style={styles.subtitle}>
            Short head to head bouts, scored on your steps and distance.
          </Text>
        </View>
        <View style={styles.livePill}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>LIVE</Text>
        </View>
      </View>

      {/* Two bout formats, straight in. */}
      <View style={styles.modeRow}>
        {BLITZ_MODES.map((m) => (
          <Pressable
            key={m.id}
            onPress={() => onStartMode?.(m.id)}
            style={({ pressed }) => [styles.modeTile, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel={m.name}>
            <View style={styles.modeIcon}>
              <AppIcon name={m.icon} size={18} color={Palette.forest} />
            </View>
            <Text style={styles.modeName}>{m.name}</Text>
            <Text style={styles.modeMeta}>
              {m.durationSeconds}s · {m.unit}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.divider} />

      <Text style={styles.queueHeading}>Or pick a queue</Text>

      <View style={styles.queueList}>
        {QUEUES.map((q) => (
          <Pressable
            key={q.id}
            onPress={() => onSelectQueue(q.id)}
            style={({ pressed }) => [styles.queueRow, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel={q.title}>
            <View style={styles.queueIcon}>
              <AppIcon name={q.icon} size={15} color={Palette.muted} />
            </View>
            <View style={styles.queueText}>
              <Text style={styles.queueTitle} numberOfLines={1}>
                {q.title}
              </Text>
              <Text style={styles.queueMeta} numberOfLines={1}>
                {q.meta}
              </Text>
            </View>
            <AppIcon name="chevron-forward" size={14} color={Palette.muted} />
          </Pressable>
        ))}
      </View>
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
    gap: Spacing.space3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.space3,
  },
  headerText: {
    flex: 1,
    gap: 2,
  },
  title: {
    ...Typography.sectionHeading,
    color: Palette.ink,
  },
  subtitle: {
    ...Typography.supporting,
    color: Palette.muted,
  },
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
    backgroundColor: Palette.surfaceSubtle,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#34D399',
  },
  liveText: {
    fontSize: 10,
    fontFamily: FontFamily.bold,
    fontWeight: '700',
    color: Palette.forest,
    letterSpacing: 0.4,
  },

  modeRow: {
    flexDirection: 'row',
    gap: Spacing.space3,
  },
  modeTile: {
    flex: 1,
    padding: Spacing.space3,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Palette.border,
    backgroundColor: Palette.surfaceHighlight,
    gap: 6,
  },
  modeIcon: {
    width: 34,
    height: 34,
    borderRadius: Radius.sm,
    backgroundColor: Palette.lime,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeName: {
    ...Typography.bodyBold,
    color: Palette.ink,
  },
  modeMeta: {
    ...Typography.supporting,
    color: Palette.muted,
  },

  divider: {
    height: 1,
    backgroundColor: Palette.border,
  },
  queueHeading: {
    ...Typography.supporting,
    fontFamily: FontFamily.medium,
    color: Palette.muted,
  },
  queueList: {
    gap: Spacing.space2,
  },
  queueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.space3,
    paddingVertical: Spacing.space2,
    paddingHorizontal: Spacing.space3,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Palette.border,
    backgroundColor: Palette.white,
  },
  queueIcon: {
    width: 30,
    height: 30,
    borderRadius: Radius.sm,
    backgroundColor: Palette.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  queueText: {
    flex: 1,
  },
  queueTitle: {
    ...Typography.bodyBold,
    color: Palette.ink,
  },
  queueMeta: {
    ...Typography.supporting,
    color: Palette.muted,
  },
  pressed: {
    opacity: 0.7,
  },
});
