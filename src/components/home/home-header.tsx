import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Palette, Radius, Spacing, Typography } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';

export function HomeHeader() {
  const { profile } = useAuth();

  const collegeName = profile?.college || 'AEC Campus';
  const shortCollege = collegeName.length > 20 ? collegeName.split('(')[0].trim() : collegeName;

  return (
    <View style={styles.headerContainer}>
      <View style={styles.headerRow}>
        {/* Brand & Campus Status */}
        <View style={styles.brandCol}>
          <Text style={styles.brandTitle}>MUVIBE</Text>
          <View style={styles.campusBadge}>
            <View style={styles.pulsingDot} />
            <Text style={styles.campusBadgeText} numberOfLines={1}>
              {shortCollege}
            </Text>
          </View>
          <Text style={styles.subtitle}>Your Campus Fitness & Community Hub</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    paddingVertical: Spacing.space2,
    marginBottom: Spacing.space3,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandCol: {
    flex: 1,
    paddingTop: 4,
    justifyContent: 'flex-start',
  },
  brandTitle: {
    ...Typography.pageTitle,
    color: Palette.forest,
    letterSpacing: -0.5,
    fontWeight: '900',
    fontSize: 32,
    lineHeight: 36,
  },
  campusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(24, 53, 45, 0.08)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
    alignSelf: 'flex-start',
    marginTop: 4,
    maxWidth: 240,
  },
  pulsingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#34D399',
  },
  campusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: Palette.forest,
  },
  subtitle: {
    fontSize: 12,
    color: Palette.muted,
    fontWeight: '500',
    marginTop: 6,
  },
});
