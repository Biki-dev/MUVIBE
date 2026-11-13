import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Palette, Radius, Spacing, Typography, FontFamily } from '@/constants/theme';
import { DepartmentRankItem } from '@/types/community';
import { AppIcon } from '@/components/ui/icon';

interface DepartmentLeaderboardProps {
  departments: DepartmentRankItem[];
}

export function DepartmentLeaderboard({ departments }: DepartmentLeaderboardProps) {
  return (
    <View style={styles.container}>
      <View style={styles.noteBox}>
        <AppIcon name="information-circle-outline" size={15} color={Palette.forest} />
        <Text style={styles.noteText}>
          Ranked by average points per active student to maintain fair inter-department competition.
        </Text>
      </View>

      {departments.map((dept) => (
        <View
          key={dept.id}
          style={[styles.card, dept.isUserDepartment && styles.userDeptCard]}>
          <View style={styles.headerRow}>
            <View style={styles.rankBadge}>
              <Text style={styles.rankNum}>#{dept.rank}</Text>
            </View>
            <View style={styles.nameBlock}>
              <View style={styles.deptNameRow}>
                <Text style={styles.deptName} numberOfLines={1}>
                  {dept.name}
                </Text>
                {dept.isUserDepartment && (
                  <View style={styles.yourDeptBadge}>
                    <Text style={styles.yourDeptText}>YOUR DEPT</Text>
                  </View>
                )}
              </View>
              <Text style={styles.studentsCount}>
                {dept.studentCount} participating students
              </Text>
            </View>
          </View>

          <View style={styles.metricsRow}>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Total Points</Text>
              <Text style={styles.metricValue}>{dept.totalPoints.toLocaleString()} pts</Text>
            </View>

            <View style={styles.metricDivider} />

            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Avg / Student</Text>
              <Text style={[styles.metricValue, styles.highlightAvg]}>
                {dept.avgPointsPerStudent} pts
              </Text>
            </View>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.space4,
  },
  noteBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Palette.surfaceSubtle,
    padding: Spacing.space3,
    borderRadius: Radius.sm,
    marginBottom: Spacing.space3,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  noteText: {
    ...Typography.supporting,
    fontSize: 11.5,
    color: Palette.muted,
    flex: 1,
    lineHeight: 16,
  },
  card: {
    backgroundColor: Palette.white,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Palette.border,
    padding: Spacing.space3 + 2,
    marginBottom: Spacing.space3,
  },
  userDeptCard: {
    borderColor: Palette.lime,
    borderWidth: 1.5,
    backgroundColor: Palette.surfaceHighlight,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: Spacing.space3,
  },
  rankBadge: {
    width: 32,
    height: 32,
    borderRadius: Radius.full,
    backgroundColor: Palette.forest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankNum: {
    ...Typography.bodyBold,
    fontSize: 12.5,
    color: Palette.white,
  },
  nameBlock: {
    flex: 1,
  },
  deptNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  deptName: {
    ...Typography.cardHeading,
    fontSize: 14.5,
    color: Palette.ink,
  },
  yourDeptBadge: {
    backgroundColor: Palette.lime,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: Radius.full,
  },
  yourDeptText: {
    fontSize: 9,
    fontWeight: '800',
    fontFamily: FontFamily.bold,
    color: Palette.ink,
  },
  studentsCount: {
    ...Typography.supporting,
    fontSize: 11.5,
    color: Palette.muted,
    marginTop: 1,
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Palette.surfaceHighlight,
    borderRadius: Radius.sm,
    padding: Spacing.space2 + 2,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricLabel: {
    ...Typography.supporting,
    fontSize: 11,
    color: Palette.muted,
    marginBottom: 2,
  },
  metricValue: {
    ...Typography.bodyBold,
    fontSize: 13,
    color: Palette.ink,
  },
  highlightAvg: {
    color: Palette.forest,
  },
  metricDivider: {
    width: 1,
    height: 24,
    backgroundColor: Palette.border,
  },
});
