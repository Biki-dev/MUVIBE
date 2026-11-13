import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Palette, Radius, Spacing, Typography, FontFamily } from '@/constants/theme';
import { ProgressHeader } from '@/components/onboarding/progress-header';
import { ActivityTile } from '@/components/onboarding/activity-tile';
import { Button } from '@/components/ui/button';
import { AppIcon } from '@/components/ui/icon';
import { useAuth } from '@/context/auth-context';
import { ACTIVITIES } from '@/constants/mock-data';

export default function ChooseActivitiesScreen() {
  const router = useRouter();
  const { selectedActivities, toggleActivity } = useAuth();

  const handleContinue = () => {
    router.push('/onboarding/location');
  };

  const handleSkip = () => {
    router.push('/onboarding/location');
  };

  const selectedCount = selectedActivities.length;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ProgressHeader
        currentStep={2}
        totalSteps={6}
        showBack={true}
        canSkip={true}
        onSkip={handleSkip}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Heading & Subtitle */}
        <View style={styles.headerBlock}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>What do you enjoy doing?</Text>
            {selectedCount > 0 && (
              <View style={styles.countBadge}>
                <Text style={styles.countText}>{selectedCount} selected</Text>
              </View>
            )}
          </View>
          <Text style={styles.subtitle}>
            Choose activities you're interested in. You can always change them later.
          </Text>
        </View>

        {/* 12-Item Activity Grid */}
        <View style={styles.grid}>
          {ACTIVITIES.map((activity) => {
            const isSelected = selectedActivities.includes(activity.id);
            return (
              <View key={activity.id} style={styles.gridItem}>
                <ActivityTile
                  activity={activity}
                  isSelected={isSelected}
                  onToggle={toggleActivity}
                />
              </View>
            );
          })}
        </View>

        {/* Informational callout */}
        <View style={styles.infoCallout}>
          <AppIcon name="information-circle-outline" size={18} color={Palette.muted} />
          <Text style={styles.infoText}>
            These preferences help personalize campus recommendations. They are never treated as a fitness prescription.
          </Text>
        </View>

        {/* Footer with Continue & Skip actions */}
        <View style={styles.bottomBar}>
          <Button
            label={selectedCount === 0 ? 'Select at least 1 or Continue' : `Continue with ${selectedCount} ${selectedCount === 1 ? 'activity' : 'activities'}`}
            variant="primary"
            size="lg"
            onPress={handleContinue}
            icon={<AppIcon name="arrow-forward" size={18} color={Palette.ink} />}
            iconPosition="right"
          />

          <Pressable
            onPress={handleSkip}
            style={({ pressed }) => [styles.skipButton, pressed && styles.pressed]}
            hitSlop={8}>
            <Text style={styles.skipButtonText}>Skip for now</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Palette.canvas,
  },
  scrollContent: {
    paddingHorizontal: Spacing.space4,
    paddingTop: Spacing.space2,
    paddingBottom: Spacing.space6,
    maxWidth: 540,
    width: '100%',
    alignSelf: 'center',
  },
  headerBlock: {
    marginBottom: Spacing.space4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: Spacing.space1,
  },
  title: {
    ...Typography.pageTitle,
    color: Palette.ink,
    flex: 1,
  },
  countBadge: {
    backgroundColor: Palette.forest,
    paddingHorizontal: Spacing.space2 + 2,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  countText: {
    ...Typography.supporting,
    color: Palette.lime,
    fontWeight: '700',
    fontFamily: FontFamily.bold,
    fontSize: 11.5,
  },
  subtitle: {
    ...Typography.body,
    color: Palette.muted,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -Spacing.space1,
  },
  gridItem: {
    width: '50%',
    padding: Spacing.space1,
  },
  infoCallout: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Palette.white,
    borderWidth: 1,
    borderColor: Palette.border,
    borderRadius: Radius.sm,
    padding: Spacing.space3,
    marginTop: Spacing.space4,
    gap: 10,
  },
  infoText: {
    ...Typography.supporting,
    color: Palette.muted,
    flex: 1,
    lineHeight: 17,
  },
  bottomBar: {
    marginTop: Spacing.space5,
    width: '100%',
    alignItems: 'center',
    gap: Spacing.space3,
  },
  skipButton: {
    paddingVertical: Spacing.space2,
    paddingHorizontal: Spacing.space4,
  },
  skipButtonText: {
    ...Typography.supporting,
    color: Palette.muted,
    fontWeight: '600',
    fontFamily: FontFamily.medium,
    fontSize: 13.5,
  },
  pressed: {
    opacity: 0.7,
  },
});
