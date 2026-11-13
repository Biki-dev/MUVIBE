import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Palette, Radius, Spacing, Typography, FontFamily } from '@/constants/theme';
import { IndividualRankItem } from '@/types/community';
import { AppIcon } from '@/components/ui/icon';

interface PodiumViewProps {
  topThree: IndividualRankItem[];
}

export function PodiumView({ topThree }: PodiumViewProps) {
  if (topThree.length < 3) return null;

  // Visual layout order: 2nd place (left), 1st place (center), 3rd place (right)
  const first = topThree[0];
  const second = topThree[1];
  const third = topThree[2];

  return (
    <View style={styles.container}>
      {/* 2nd Place */}
      <View style={[styles.podiumCol, styles.secondCol]}>
        <View style={styles.avatarWrap}>
          <View style={[styles.avatarCircle, { backgroundColor: second.avatarColor }]}>
            <Text style={styles.avatarEmoji}>{second.avatarEmoji}</Text>
          </View>
          <View style={[styles.rankBadge, styles.rankBadge2]}>
            <Text style={styles.rankNum}>2</Text>
          </View>
        </View>
        <Text style={styles.name} numberOfLines={1}>{second.name}</Text>
        <Text style={styles.dept} numberOfLines={1}>{second.department.split('&')[0].trim()}</Text>
        <Text style={styles.points}>{second.points.toLocaleString()} pts</Text>
      </View>

      {/* 1st Place */}
      <View style={[styles.podiumCol, styles.firstCol]}>
        <View style={styles.crownWrap}>
          <AppIcon name="trophy" size={20} color={Palette.amber} />
        </View>
        <View style={styles.avatarWrap}>
          <View style={[styles.avatarCircle, styles.avatarCircleFirst, { backgroundColor: first.avatarColor }]}>
            <Text style={styles.avatarEmojiFirst}>{first.avatarEmoji}</Text>
          </View>
          <View style={[styles.rankBadge, styles.rankBadge1]}>
            <Text style={styles.rankNum1}>1</Text>
          </View>
        </View>
        <Text style={[styles.name, styles.firstName]} numberOfLines={1}>{first.name}</Text>
        <Text style={styles.dept} numberOfLines={1}>{first.department.split('&')[0].trim()}</Text>
        <Text style={[styles.points, styles.firstPoints]}>{first.points.toLocaleString()} pts</Text>
      </View>

      {/* 3rd Place */}
      <View style={[styles.podiumCol, styles.thirdCol]}>
        <View style={styles.avatarWrap}>
          <View style={[styles.avatarCircle, { backgroundColor: third.avatarColor }]}>
            <Text style={styles.avatarEmoji}>{third.avatarEmoji}</Text>
          </View>
          <View style={[styles.rankBadge, styles.rankBadge3]}>
            <Text style={styles.rankNum}>3</Text>
          </View>
        </View>
        <Text style={styles.name} numberOfLines={1}>{third.name}</Text>
        <Text style={styles.dept} numberOfLines={1}>{third.department.split('&')[0].trim()}</Text>
        <Text style={styles.points}>{third.points.toLocaleString()} pts</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: Palette.white,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Palette.border,
    paddingVertical: Spacing.space4,
    paddingHorizontal: Spacing.space2,
    marginBottom: Spacing.space4,
  },
  podiumCol: {
    flex: 1,
    alignItems: 'center',
  },
  firstCol: {
    paddingBottom: 4,
  },
  secondCol: {
    paddingTop: 16,
  },
  thirdCol: {
    paddingTop: 24,
  },
  crownWrap: {
    marginBottom: 4,
  },
  avatarWrap: {
    position: 'relative',
    marginBottom: 8,
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Palette.border,
  },
  avatarCircleFirst: {
    width: 58,
    height: 58,
    borderColor: Palette.lime,
    borderWidth: 2.5,
  },
  avatarEmoji: {
    fontSize: 22,
    fontFamily: FontFamily.regular,
  },
  avatarEmojiFirst: {
    fontSize: 26,
    fontFamily: FontFamily.regular,
  },
  rankBadge: {
    position: 'absolute',
    bottom: -4,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: Palette.white,
  },
  rankBadge1: {
    backgroundColor: Palette.forest,
  },
  rankBadge2: {
    backgroundColor: Palette.borderDark,
  },
  rankBadge3: {
    backgroundColor: Palette.amber,
  },
  rankNum: {
    fontSize: 10,
    fontWeight: '800',
    fontFamily: FontFamily.bold,
    color: Palette.white,
  },
  rankNum1: {
    fontSize: 11,
    fontWeight: '800',
    fontFamily: FontFamily.bold,
    color: Palette.lime,
  },
  name: {
    ...Typography.bodyBold,
    fontSize: 12.5,
    color: Palette.ink,
    textAlign: 'center',
  },
  firstName: {
    fontSize: 13.5,
    fontWeight: '800',
    fontFamily: FontFamily.bold,
  },
  dept: {
    ...Typography.supporting,
    fontSize: 10.5,
    color: Palette.muted,
    marginBottom: 2,
  },
  points: {
    ...Typography.bodyBold,
    fontSize: 12,
    color: Palette.forest,
  },
  firstPoints: {
    fontSize: 13,
    fontFamily: FontFamily.regular,
  },
});
