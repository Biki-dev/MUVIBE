import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Palette, Spacing, Typography, FontFamily } from '@/constants/theme';

export function ActivityHeader() {
  return (
    <View style={styles.header}>
      <Text style={styles.pageTitle}>Activity</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingVertical: Spacing.space3,
    marginBottom: Spacing.space2,
  },
  pageTitle: {
    ...Typography.pageTitle,
    color: Palette.forest,
    letterSpacing: -0.5,
    fontWeight: '800',
    fontFamily: FontFamily.bold,
  },
});
