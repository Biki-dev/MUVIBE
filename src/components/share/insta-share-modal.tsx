/**
 * src/components/share/insta-share-modal.tsx
 * ─────────────────────────────────────────────────────────────────
 * Bottom-sheet modal:
 *  • Hidden full-resolution ViewShot for capture
 *  • Scaled-down preview of the story card
 *  • Share to Instagram / Save to Gallery actions
 * ─────────────────────────────────────────────────────────────────
 */
import React, { useRef, useState, useCallback } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Alert,
} from 'react-native';
import ViewShot, { ViewShotRef } from 'react-native-view-shot';
import { Ionicons } from '@expo/vector-icons';
import { Palette, Radius, Spacing, Typography, FontFamily } from '@/constants/theme';
import { ActivityRecord } from '@/types/activity';
import {
  ActivityStoryCard,
  STORY_WIDTH,
  STORY_HEIGHT,
} from '@/components/share/activity-story-card';
import {
  shareActivityStory,
  showSavedToGalleryTip,
} from '@/services/instagram-share';

// ── Preview scale ─────────────────────────────────────────────────
const PREVIEW_SCALE = 0.50;
const PREVIEW_W = Math.round(STORY_WIDTH  * PREVIEW_SCALE);
const PREVIEW_H = Math.round(STORY_HEIGHT * PREVIEW_SCALE);

interface Props {
  visible:   boolean;
  onClose:   () => void;
  activity:  ActivityRecord;
  username:  string;
  avatarUrl?: string;
}

export function InstaShareModal({ visible, onClose, activity, username, avatarUrl }: Props) {
  const viewShotRef = useRef<ViewShotRef>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [isSaving,  setIsSaving]  = useState(false);

  const capture = useCallback(async (saveToRoll: boolean) => {
    if (!viewShotRef.current) return;
    if (saveToRoll) setIsSaving(true); else setIsSharing(true);

    try {
      const uri    = await viewShotRef.current.capture!();
      const result = await shareActivityStory(uri, saveToRoll);

      if (saveToRoll && result.saved) showSavedToGalleryTip();
      else if (!result.shared && result.error)
        Alert.alert('Could not share', result.error);
    } catch (err: any) {
      Alert.alert('Error', err?.message ?? 'Failed to capture card.');
    } finally {
      setIsSharing(false);
      setIsSaving(false);
    }
  }, []);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={s.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

        <View style={s.sheet}>
          {/* Handle */}
          <View style={s.handle} />

          {/* Header */}
          <View style={s.header}>
            <View>
              <Text style={s.title}>Share Activity</Text>
              <Text style={s.subtitle}>Your story card is ready 🎉</Text>
            </View>
            <Pressable onPress={onClose} hitSlop={12} style={s.closeBtn}>
              <Ionicons name="close" size={20} color={Palette.muted} />
            </Pressable>
          </View>

          {/* ── Hidden full-res ViewShot (off-screen) ── */}
          <View style={s.offscreen}>
            <ViewShot
              ref={viewShotRef}
              options={{ format: 'png', quality: 1.0, width: STORY_WIDTH, height: STORY_HEIGHT }}>
              <ActivityStoryCard
                activity={activity}
                username={username}
                avatarUrl={avatarUrl}
              />
            </ViewShot>
          </View>

          {/* ── Scaled preview ── */}
          <View style={s.previewWrapper}>
            {/* Fixed-size clip box */}
            <View style={[s.previewClip, { width: PREVIEW_W, height: PREVIEW_H }]}>
              {/* Full-size card scaled down, anchored top-left */}
              <View
                style={{
                  width: STORY_WIDTH,
                  height: STORY_HEIGHT,
                  transform: [{ scale: PREVIEW_SCALE }],
                  position: 'absolute',
                  top:  0,
                  left: 0,
                  transformOrigin: '0 0' as any,
                }}>
                <ActivityStoryCard
                  activity={activity}
                  username={username}
                  avatarUrl={avatarUrl}
                />
              </View>
            </View>
          </View>

          {/* ── Actions ── */}
          <View style={s.actions}>
            <Pressable
              style={({ pressed }) => [s.btnPrimary, pressed && s.pressed]}
              onPress={() => capture(false)}
              disabled={isSharing || isSaving}>
              {isSharing
                ? <ActivityIndicator color="#0C1E16" size="small" />
                : <>
                    <Ionicons name="logo-instagram" size={20} color="#0C1E16" />
                    <Text style={s.btnPrimaryText}>Share to Instagram</Text>
                  </>}
            </Pressable>

            <Pressable
              style={({ pressed }) => [s.btnSecondary, pressed && s.pressed]}
              onPress={() => capture(true)}
              disabled={isSharing || isSaving}>
              {isSaving
                ? <ActivityIndicator color={Palette.forest} size="small" />
                : <>
                    <Ionicons name="download-outline" size={19} color={Palette.forest} />
                    <Text style={s.btnSecondaryText}>Save to Gallery</Text>
                  </>}
            </Pressable>
          </View>

          <Text style={s.tip}>
            Saved to camera roll → open Instagram → New Story → pick the image
          </Text>
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
    paddingBottom: 36,
    paddingHorizontal: 24,
    paddingTop: 12,
    alignItems: 'center',
  },
  handle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: Palette.border,
    marginBottom: 20,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 20,
  },
  title: {
    color: Palette.ink,
    fontSize: 20,
    fontWeight: '800',
    fontFamily: FontFamily.bold,
    letterSpacing: -0.4,
  },
  subtitle: {
    color: Palette.muted,
    fontSize: 13,
    fontWeight: '400',
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
    marginTop: 2,
  },

  // Hidden capture view
  offscreen: {
    position: 'absolute',
    left: -9999,
    top:  -9999,
    width:  STORY_WIDTH,
    height: STORY_HEIGHT,
  },

  // Preview
  previewWrapper: {
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 20,
    elevation: 12,
  },
  previewClip: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#0C1E16',
  },

  // Buttons
  actions: {
    width: '100%',
    gap: 10,
    marginBottom: 14,
  },
  btnPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#C5F36B',
    borderRadius: 100,
    paddingVertical: 16,
  },
  btnPrimaryText: {
    color: '#0C1E16',
    fontSize: 16,
    fontWeight: '800',
    fontFamily: FontFamily.bold,
  },
  btnSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: Palette.surfaceSubtle,
    borderRadius: 100,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  btnSecondaryText: {
    color: Palette.forest,
    fontSize: 15,
    fontWeight: '700',
    fontFamily: FontFamily.bold,
  },
  pressed: {
    opacity: 0.75,
    transform: [{ scale: 0.985 }],
  },

  // Tip
  tip: {
    color: Palette.muted,
    fontSize: 11.5,
    textAlign: 'center',
    lineHeight: 17,
    paddingHorizontal: 8,
  },
});
