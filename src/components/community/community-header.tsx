import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Palette, Spacing, Typography } from '@/constants/theme';

export function CommunityHeader() {
  return (
    <View style={styles.header}>
      <Text style={styles.pageTitle}>Community</Text>
      <Text style={styles.subtitle}>Find your people. Move together.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingVertical: Spacing.space3,
    marginBottom: Spacing.space1,
  },
  pageTitle: {
    ...Typography.pageTitle,
    color: Palette.forest,
    letterSpacing: -0.5,
    fontWeight: '800',
  },
  subtitle: {
    ...Typography.body,
    color: Palette.muted,
    fontSize: 13.5,
    marginTop: 2,
  },
});
