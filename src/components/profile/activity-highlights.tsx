import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Palette, Radius, Spacing, Typography } from '@/constants/theme';
import { AppIcon } from '@/components/ui/icon';
import { INITIAL_ACTIVITY_HIGHLIGHTS } from '@/constants/profile-data';

export function ActivityHighlights() {
  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Activity Highlights</Text>

      <View style={styles.grid}>
        {INITIAL_ACTIVITY_HIGHLIGHTS.map((item) => (
          <View key={item.id} style={styles.card}>
            <View style={styles.iconWrap}>
              <AppIcon name={item.iconName} size={15} color={Palette.forest} />
            </View>
            <Text style={styles.label}>{item.label}</Text>
            <Text style={styles.value}>{item.value}</Text>
            <Text style={styles.sublabel}>{item.sublabel}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.space5,
  },
  sectionTitle: {
    ...Typography.sectionHeading,
    color: Palette.ink,
    marginBottom: Spacing.space3,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.space3,
  },
  card: {
    width: '48%',
    flexGrow: 1,
    backgroundColor: Palette.white,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Palette.border,
    padding: Spacing.space3 + 2,
    minHeight: 90,
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: Radius.sm,
    backgroundColor: Palette.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  label: {
    ...Typography.supporting,
    fontSize: 10,
    fontWeight: '700',
    color: Palette.muted,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  value: {
    ...Typography.cardHeading,
    fontSize: 16,
    color: Palette.ink,
    marginBottom: 1,
  },
  sublabel: {
    ...Typography.supporting,
    fontSize: 11,
    color: Palette.muted,
  },
});
