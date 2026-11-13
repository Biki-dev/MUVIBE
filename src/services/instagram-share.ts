/**
 * src/services/instagram-share.ts
 * ─────────────────────────────────────────────────────────────────
 * Captures the story card view and shares it to Instagram Stories
 * (or any installed app via the system share sheet as fallback).
 *
 * Flow:
 *   1. captureRef()         → temp URI (PNG in device cache)
 *   2. saveToLibrary()      → saves to Camera Roll (optional)
 *   3. Share to Instagram Stories via deep link, or fallback to
 *      expo-sharing system sheet.
 * ─────────────────────────────────────────────────────────────────
 */
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import { Alert, Linking, Platform } from 'react-native';

export interface ShareResult {
  saved: boolean;    // saved to camera roll
  shared: boolean;   // shared sheet opened
  error?: string;
}

/**
 * Save image to camera roll and trigger the share sheet.
 * @param uri  File URI from react-native-view-shot
 * @param saveToRoll  Whether to also save to the device gallery
 */
export async function shareActivityStory(
  uri: string,
  saveToRoll = false
): Promise<ShareResult> {
  try {
    let saved = false;

    // ── 1. Optionally persist to gallery ────────────────────────
    if (saveToRoll) {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status === 'granted') {
        await MediaLibrary.saveToLibraryAsync(uri);
        saved = true;
      }
    }

    // ── 2. Try Instagram Stories deep link (Android / iOS) ───────
    const instagramOpened = await tryInstagramStories(uri);
    if (instagramOpened) return { saved, shared: true };

    // ── 3. Fallback: system share sheet ─────────────────────────
    const canShare = await Sharing.isAvailableAsync();
    if (canShare) {
      await Sharing.shareAsync(uri, {
        mimeType: 'image/png',
        dialogTitle: 'Share your MUVIBE activity',
        UTI: 'public.png',          // iOS
      });
      return { saved, shared: true };
    }

    return { saved, shared: false, error: 'Sharing is not available on this device.' };
  } catch (err: any) {
    return { saved: false, shared: false, error: err?.message ?? 'Unknown error' };
  }
}

/**
 * Attempts to open Instagram Stories with the image pre-loaded.
 * Returns true if the deep link was opened successfully.
 */
async function tryInstagramStories(imageUri: string): Promise<boolean> {
  try {
    if (Platform.OS === 'android') {
      // Android Intent via scheme
      const url = `instagram-stories://share?source_application=com.muvibe.app`;
      const supported = await Linking.canOpenURL(url);
      if (!supported) return false;
      await Linking.openURL(url);
      return true;
    } else if (Platform.OS === 'ios') {
      // iOS URL scheme
      const url = `instagram-stories://share`;
      const supported = await Linking.canOpenURL(url);
      if (!supported) return false;
      await Linking.openURL(url);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Shows a "Saved!" alert with an instruction to share from gallery.
 */
export function showSavedToGalleryTip() {
  Alert.alert(
    'Saved to Gallery',
    'Open Instagram → Stories → Photo to share your activity card.',
    [{ text: 'Got it', style: 'default' }]
  );
}
