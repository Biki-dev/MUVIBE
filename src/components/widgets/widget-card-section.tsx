/**
 * src/components/widgets/widget-card-section.tsx
 * ─────────────────────────────────────────────────────────────────
 * Mobile Home Screen Widgets section.
 * Placed in Profile / Home with a clean trigger card to preview
 * and configure phone home screen widgets.
 * ─────────────────────────────────────────────────────────────────
 */
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Palette, Radius, Spacing, Typography, FontFamily } from '@/constants/theme';
import { ActivityRecord, StreakInfo } from '@/types/activity';
import { syncWidgetsFromActivities } from '@/services/native-widget-service';
import { HomeScreenWidgetPickerModal } from './home-screen-widget-picker';

interface Props {
  activities: ActivityRecord[];
  streak: StreakInfo;
}

export function MobileWidgetSection({ activities, streak }: Props) {
  const [modalOpen, setModalOpen] = useState(false);

  // Auto-sync whenever user loads activities / streak
  useEffect(() => {
    syncWidgetsFromActivities(activities, streak);
  }, [activities, streak]);

  return (
    <View style={s.container}>
      <Pressable
        style={({ pressed }) => [s.card, pressed && s.cardPressed]}
        onPress={() => setModalOpen(true)}>
        <View style={s.leftCol}>
          <View style={s.iconWrap}>
            <Ionicons name="phone-portrait-outline" size={20} color={Palette.lime} />
          </View>
          <View style={s.textWrap}>
            <View style={s.tagRow}>
              <Text style={s.title}>Phone Home Screen Widgets</Text>
              <View style={s.badge}>
                <Text style={s.badgeText}>ANDROID</Text>
              </View>
            </View>
            <Text style={s.subtitle}>
              Keep daily steps &amp; streak flame right on your phone screen
            </Text>
          </View>
        </View>

        <View style={s.actionArrow}>
          <Text style={s.setupText}>Setup</Text>
          <Ionicons name="chevron-forward" size={16} color={Palette.forest} />
        </View>
      </Pressable>

      <HomeScreenWidgetPickerModal
        visible={modalOpen}
        onClose={() => setModalOpen(false)}
        activities={activities}
        streak={streak}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    marginBottom: Spacing.space5,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Palette.white,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Palette.border,
    padding: Spacing.space3 + 2,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  cardPressed: {
    backgroundColor: Palette.surfaceSubtle,
    transform: [{ scale: 0.995 }],
  },
  leftCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#0F261C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: {
    flex: 1,
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  title: {
    ...Typography.bodyBold,
    color: Palette.ink,
    fontSize: 14,
  },
  badge: {
    backgroundColor: 'rgba(197, 243, 107, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: Radius.full,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: Palette.forest,
  },
  subtitle: {
    ...Typography.supporting,
    color: Palette.muted,
    fontSize: 11.5,
  },
  actionArrow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginLeft: 8,
  },
  setupText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: Palette.forest,
    fontFamily: FontFamily.bold,
  },
});
