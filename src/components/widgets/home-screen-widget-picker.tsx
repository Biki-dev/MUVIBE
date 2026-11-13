/**
 * src/components/widgets/home-screen-widget-picker.tsx
 * ─────────────────────────────────────────────────────────────────
 * Interactive in-app Widgets setup & preview modal.
 *
 * Shows real-time interactive previews of the Android Home Screen
 * widgets:
 *  1. Quick Stats Widget (Steps, Distance, Calories)
 *  2. Streak Flame Widget (Consistency & Flame)
 *
 * Provides a one-tap button to sync live data and clear instructions
 * on how to pin widgets to the Android mobile home screen.
 * ─────────────────────────────────────────────────────────────────
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  ScrollView,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Palette, Radius, Spacing, Typography, FontFamily } from '@/constants/theme';
import { ActivityRecord, StreakInfo } from '@/types/activity';
import { syncWidgetsFromActivities } from '@/services/native-widget-service';

interface Props {
  visible: boolean;
  onClose: () => void;
  activities: ActivityRecord[];
  streak: StreakInfo;
}

export function HomeScreenWidgetPickerModal({
  visible,
  onClose,
  activities,
  streak,
}: Props) {
  const [selectedWidget, setSelectedWidget] = useState<'quick' | 'streak'>('quick');
  const [isSyncing, setIsSyncing] = useState(false);

  // Today aggregates
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const todayActs = activities.filter((a) => {
    const d = new Date(a.startedAt);
    return (
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` ===
      todayStr
    );
  });

  let todaySteps = 0;
  let todayDist = 0;
  let todayCals = 0;
  for (const a of todayActs) {
    todaySteps += a.steps || 0;
    todayCals += a.calories || 0;
    if (a.distanceKm) todayDist += a.distanceKm;
  }

  const handleManualSync = async () => {
    setIsSyncing(true);
    await syncWidgetsFromActivities(activities, streak);
    setIsSyncing(false);
    Alert.alert(
      'Widgets Synchronized',
      'Latest workout & streak stats were pushed to your phone home screen widgets!'
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={s.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

        <View style={s.sheet}>
          <View style={s.handle} />

          {/* Header */}
          <View style={s.header}>
            <View>
              <Text style={s.title}>Phone Home Screen Widgets</Text>
              <Text style={s.subtitle}>Add MUVIBE directly to your phone screen</Text>
            </View>
            <Pressable onPress={onClose} hitSlop={12} style={s.closeBtn}>
              <Ionicons name="close" size={22} color={Palette.muted} />
            </Pressable>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={s.scrollContent}>
            {/* Widget Selector Pills */}
            <View style={s.pillRow}>
              <Pressable
                onPress={() => setSelectedWidget('quick')}
                style={[
                  s.selectorPill,
                  selectedWidget === 'quick' && s.selectorPillActive,
                ]}>
                <Ionicons
                  name="speedometer"
                  size={15}
                  color={selectedWidget === 'quick' ? '#0C1E16' : Palette.muted}
                />
                <Text
                  style={[
                    s.selectorPillText,
                    selectedWidget === 'quick' && s.selectorPillTextActive,
                  ]}>
                  Daily Stats (Dark)
                </Text>
              </Pressable>

              <Pressable
                onPress={() => setSelectedWidget('streak')}
                style={[
                  s.selectorPill,
                  selectedWidget === 'streak' && s.selectorPillActive,
                ]}>
                <Ionicons
                  name="flame"
                  size={15}
                  color={selectedWidget === 'streak' ? '#0C1E16' : Palette.muted}
                />
                <Text
                  style={[
                    s.selectorPillText,
                    selectedWidget === 'streak' && s.selectorPillTextActive,
                  ]}>
                  Flame Streak (Light)
                </Text>
              </Pressable>
            </View>

            {/* Live Visual Mockup Preview */}
            <View style={s.previewContainer}>
              <Text style={s.previewHeaderLabel}>LIVE PHONE WIDGET PREVIEW</Text>

              {selectedWidget === 'quick' ? (
                /* Dark Aesthetic Quick Stats Mockup */
                <View style={s.darkWidgetBox}>
                  <View style={s.widgetTopRow}>
                    <Text style={s.darkBrand}>MUVIBE</Text>
                    <View style={s.darkPillBadge}>
                      <Text style={s.darkPillText}>TODAY</Text>
                    </View>
                  </View>

                  <View style={s.widgetCenterRow}>
                    <Text style={s.darkLargeNumber}>
                      {todaySteps > 0 ? todaySteps.toLocaleString() : '6,420'}
                    </Text>
                    <Text style={s.darkUnit}>steps today</Text>
                  </View>

                  <View style={s.widgetBottomRow}>
                    <Text style={s.darkStat1}>
                      {todayDist > 0 ? `${todayDist.toFixed(1)} km` : '4.8 km'}
                    </Text>
                    <Text style={s.darkStat2}>
                      {todayCals > 0 ? `${todayCals} kcal` : '340 kcal'}
                    </Text>
                  </View>
                </View>
              ) : (
                /* Light Aesthetic Streak Flame Mockup */
                <View style={s.lightWidgetBox}>
                  <View style={s.widgetTopRow}>
                    <Text style={s.lightBrand}>MUVIBE</Text>
                    <Text style={s.lightFlameTag}>🔥 STREAK</Text>
                  </View>

                  <View style={s.widgetCenterRow}>
                    <Text style={s.lightLargeNumber}>{streak.currentStreak || 5}</Text>
                    <Text style={s.lightUnit}>days consistent</Text>
                  </View>

                  <Text style={s.lightMsg}>
                    {streak.currentStreak > 0
                      ? 'Keep moving today!'
                      : 'Log a workout to start!'}
                  </Text>
                </View>
              )}
            </View>

            {/* Instructions on how to add to mobile home screen */}
            <View style={s.guideCard}>
              <View style={s.guideTitleRow}>
                <Ionicons name="phone-portrait-outline" size={18} color={Palette.forest} />
                <Text style={s.guideTitle}>How to place on your Home Screen</Text>
              </View>

              <View style={s.stepRow}>
                <View style={s.stepNumberBadge}>
                  <Text style={s.stepNumberText}>1</Text>
                </View>
                <Text style={s.stepText}>
                  Go to your phone’s home screen and touch & hold an empty space.
                </Text>
              </View>

              <View style={s.stepRow}>
                <View style={s.stepNumberBadge}>
                  <Text style={s.stepNumberText}>2</Text>
                </View>
                <Text style={s.stepText}>
                  Tap <Text style={s.stepBold}>Widgets</Text> from the menu.
                </Text>
              </View>

              <View style={s.stepRow}>
                <View style={s.stepNumberBadge}>
                  <Text style={s.stepNumberText}>3</Text>
                </View>
                <Text style={s.stepText}>
                  Scroll to <Text style={s.stepBold}>MUVIBE</Text> and drag the widget to your screen!
                </Text>
              </View>
            </View>

            {/* Sync Button */}
            <Pressable
              style={({ pressed }) => [s.syncBtn, pressed && s.syncBtnPressed]}
              onPress={handleManualSync}>
              <Ionicons name="sync-outline" size={18} color="#0C1E16" />
              <Text style={s.syncBtnText}>
                {isSyncing ? 'Updating Widgets...' : 'Push Live Data to Phone Widgets'}
              </Text>
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.65)',
  },
  sheet: {
    backgroundColor: Palette.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 12,
    paddingHorizontal: 20,
    paddingBottom: 32,
    maxHeight: '90%',
  },
  handle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: Palette.border,
    alignSelf: 'center',
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 18,
  },
  title: {
    ...Typography.sectionHeading,
    color: Palette.ink,
    fontSize: 18,
  },
  subtitle: {
    ...Typography.body,
    color: Palette.muted,
    fontSize: 12.5,
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
  },
  scrollContent: {
    paddingBottom: 16,
  },
  pillRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 18,
  },
  selectorPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Palette.surfaceSubtle,
    paddingVertical: 10,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  selectorPillActive: {
    backgroundColor: Palette.lime,
    borderColor: Palette.lime,
  },
  selectorPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: Palette.muted,
  },
  selectorPillTextActive: {
    color: '#0C1E16',
    fontWeight: '800',
  },
  previewContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  previewHeaderLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    color: Palette.muted,
    letterSpacing: 1,
    marginBottom: 10,
  },

  // Dark Mockup
  darkWidgetBox: {
    width: 220,
    height: 140,
    backgroundColor: '#0F261C',
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: 'rgba(197, 243, 107, 0.25)',
    padding: 14,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 4,
  },
  widgetTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  darkBrand: {
    fontSize: 11,
    fontWeight: '900',
    color: Palette.lime,
    letterSpacing: 1,
  },
  darkPillBadge: {
    backgroundColor: 'rgba(197, 243, 107, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(197, 243, 107, 0.3)',
    borderRadius: 100,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  darkPillText: {
    color: Palette.lime,
    fontSize: 8.5,
    fontWeight: '700',
  },
  widgetCenterRow: {
    justifyContent: 'center',
  },
  darkLargeNumber: {
    fontSize: 26,
    fontWeight: '900',
    color: '#FFFFFF',
    fontFamily: FontFamily.bold,
  },
  darkUnit: {
    fontSize: 10.5,
    color: '#8FB39E',
  },
  widgetBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  darkStat1: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  darkStat2: {
    fontSize: 11,
    fontWeight: '700',
    color: Palette.lime,
  },

  // Light Mockup
  lightWidgetBox: {
    width: 220,
    height: 140,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: Palette.border,
    padding: 14,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 3,
  },
  lightBrand: {
    fontSize: 11,
    fontWeight: '900',
    color: Palette.forest,
    letterSpacing: 1,
  },
  lightFlameTag: {
    fontSize: 9.5,
    fontWeight: '800',
    color: Palette.forest,
  },
  lightLargeNumber: {
    fontSize: 28,
    fontWeight: '900',
    color: Palette.forest,
    fontFamily: FontFamily.bold,
  },
  lightUnit: {
    fontSize: 10.5,
    color: Palette.muted,
  },
  lightMsg: {
    fontSize: 10.5,
    fontWeight: '700',
    color: Palette.forest,
  },

  // Guide
  guideCard: {
    backgroundColor: Palette.surfaceSubtle,
    borderRadius: Radius.card,
    padding: Spacing.space3 + 2,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  guideTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  guideTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Palette.ink,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 8,
  },
  stepNumberBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Palette.forest,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  stepNumberText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  stepText: {
    flex: 1,
    fontSize: 12,
    color: Palette.ink,
    lineHeight: 18,
  },
  stepBold: {
    fontWeight: '700',
  },

  // Sync button
  syncBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Palette.lime,
    paddingVertical: 14,
    borderRadius: Radius.full,
  },
  syncBtnPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.985 }],
  },
  syncBtnText: {
    color: '#0C1E16',
    fontSize: 14,
    fontWeight: '800',
    fontFamily: FontFamily.bold,
  },
});
