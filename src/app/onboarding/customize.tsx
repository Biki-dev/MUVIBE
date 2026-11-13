import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Modal,
  Alert,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Palette, Radius, Spacing, Typography } from '@/constants/theme';
import { ProgressHeader } from '@/components/onboarding/progress-header';
import { Button } from '@/components/ui/button';
import { AppIcon } from '@/components/ui/icon';
import { useAuth } from '@/context/auth-context';

const SPORTY_AVATARS = [
  { id: 'av_runner', emoji: '🏃', label: 'Runner', bg: '#C5F36B' },
  { id: 'av_cyclist', emoji: '🚴', label: 'Cyclist', bg: '#5279F6' },
  { id: 'av_strength', emoji: '🏋️', label: 'Power', bg: '#18352D' },
  { id: 'av_yoga', emoji: '🧘', label: 'Zen', bg: '#E8A34A' },
];

export default function ProfileCustomizationScreen() {
  const router = useRouter();
  const { profile, updateProfile } = useAuth();

  const [avatar, setAvatar] = useState(profile.avatarUrl || 'av_runner');
  const [bio, setBio] = useState(
    profile.bio || 'Early morning runner and fitness enthusiast at campus!'
  );
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);

  const handleContinue = async () => {
    await updateProfile({
      avatarUrl: avatar,
      bio: bio.trim(),
    });
    router.push('/onboarding/finish');
  };

  const selectedAvatarObj = SPORTY_AVATARS.find((a) => a.id === avatar) || SPORTY_AVATARS[0];

  return (
    <SafeAreaView style={styles.safeArea}>
      <ProgressHeader
        currentStep={5}
        totalSteps={6}
        showBack={true}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardContainer}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          {/* Header */}
          <View style={styles.headerBlock}>
            <Text style={styles.title}>Profile Customization</Text>
            <Text style={styles.subtitle}>
              This is a final visual customization step. Personalize your campus card before stepping onto leaderboards.
            </Text>
          </View>

          {/* Circular Avatar Upload */}
          <View style={styles.avatarSection}>
            <Pressable
              onPress={() => setIsPhotoModalOpen(true)}
              style={({ pressed }) => [styles.avatarPressable, pressed && styles.pressed]}
              accessibilityLabel="Upload profile photo">
              <View
                style={[
                  styles.avatarCircle,
                  { backgroundColor: selectedAvatarObj.bg },
                ]}>
                <Text style={styles.avatarEmoji}>{selectedAvatarObj.emoji}</Text>
              </View>

              {/* Camera icon badge */}
              <View style={styles.cameraBadge}>
                <AppIcon name="camera" size={16} color={Palette.ink} />
              </View>
            </Pressable>

            <Pressable
              onPress={() => setIsPhotoModalOpen(true)}
              style={styles.changePhotoButton}>
              <Text style={styles.changePhotoText}>Change Profile Picture</Text>
            </Pressable>
          </View>

          {/* Profile Details Summary Card */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Full Name</Text>
              <Text style={styles.summaryValue}>{profile.fullName || 'Student Athlete'}</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Username</Text>
              <Text style={styles.summaryValueHighlight}>@{profile.username || 'student'}</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>College</Text>
              <Text style={styles.summaryValue} numberOfLines={1}>
                {profile.college || 'Assam Engineering College'}
              </Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Department</Text>
              <Text style={styles.summaryValue} numberOfLines={1}>
                {profile.department || 'Engineering'}
              </Text>
            </View>
          </View>

          {/* Short Bio (Optional) */}
          <View style={styles.bioContainer}>
            <View style={styles.bioLabelRow}>
              <Text style={styles.bioLabel}>Short Bio</Text>
              <Text style={styles.optionalBadge}>Optional • {bio.length}/150</Text>
            </View>
            <View style={styles.bioInputContainer}>
              <TextInput
                style={styles.bioInput}
                multiline
                numberOfLines={3}
                maxLength={150}
                placeholder="Share your fitness goals, favorite workout times, or campus interests..."
                placeholderTextColor={Palette.muted}
                value={bio}
                onChangeText={setBio}
              />
            </View>
          </View>

          {/* Bottom Button */}
          <View style={styles.bottomBar}>
            <Button
              label="Save & Continue"
              variant="primary"
              size="lg"
              onPress={handleContinue}
              icon={<AppIcon name="arrow-forward" size={18} color={Palette.ink} />}
              iconPosition="right"
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Photo / Avatar Selector Modal */}
      <Modal
        visible={isPhotoModalOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setIsPhotoModalOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Choose Profile Avatar</Text>
              <Pressable onPress={() => setIsPhotoModalOpen(false)} hitSlop={8}>
                <AppIcon name="close" size={22} color={Palette.ink} />
              </Pressable>
            </View>

            <Text style={styles.avatarModalSubtitle}>
              Select a sporty avatar or upload from your device:
            </Text>

            {/* Sporty Preset Avatars */}
            <View style={styles.avatarPresetsGrid}>
              {SPORTY_AVATARS.map((item) => {
                const isSelected = avatar === item.id;
                return (
                  <Pressable
                    key={item.id}
                    onPress={() => {
                      setAvatar(item.id);
                      setIsPhotoModalOpen(false);
                    }}
                    style={[
                      styles.avatarPresetOption,
                      isSelected && styles.avatarPresetSelected,
                    ]}>
                    <View
                      style={[
                        styles.avatarPresetCircle,
                        { backgroundColor: item.bg },
                      ]}>
                      <Text style={styles.presetEmoji}>{item.emoji}</Text>
                    </View>
                    <Text style={styles.presetLabel}>{item.label}</Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Native Camera / Gallery action items */}
            <View style={styles.photoActionsList}>
              <Pressable
                onPress={() => {
                  setIsPhotoModalOpen(false);
                  Alert.alert('Camera Access', 'Photo permissions requested only when using camera.');
                }}
                style={styles.photoActionItem}>
                <AppIcon name="camera-outline" size={20} color={Palette.forest} />
                <Text style={styles.photoActionText}>Take Photo</Text>
              </Pressable>

              <Pressable
                onPress={() => {
                  setIsPhotoModalOpen(false);
                  Alert.alert('Gallery Access', 'Photo permissions requested only when accessing gallery.');
                }}
                style={styles.photoActionItem}>
                <AppIcon name="images-outline" size={20} color={Palette.forest} />
                <Text style={styles.photoActionText}>Choose from Gallery</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Palette.canvas,
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.space4,
    paddingTop: Spacing.space2,
    paddingBottom: Spacing.space6,
    maxWidth: 520,
    width: '100%',
    alignSelf: 'center',
  },
  headerBlock: {
    marginBottom: Spacing.space4,
  },
  title: {
    ...Typography.pageTitle,
    color: Palette.ink,
    marginBottom: Spacing.space1,
  },
  subtitle: {
    ...Typography.body,
    color: Palette.muted,
  },
  avatarSection: {
    alignItems: 'center',
    marginVertical: Spacing.space4,
  },
  avatarPressable: {
    position: 'relative',
  },
  avatarCircle: {
    width: 104,
    height: 104,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: Palette.white,
    shadowColor: Palette.forest,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  avatarEmoji: {
    fontSize: 48,
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 34,
    height: 34,
    borderRadius: Radius.full,
    backgroundColor: Palette.lime,
    borderWidth: 2,
    borderColor: Palette.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  changePhotoButton: {
    marginTop: Spacing.space2,
    paddingVertical: 4,
  },
  changePhotoText: {
    ...Typography.supporting,
    color: Palette.forest,
    fontWeight: '700',
    fontSize: 13,
  },
  summaryCard: {
    backgroundColor: Palette.white,
    borderRadius: Radius.card, // 18px
    borderWidth: 1,
    borderColor: Palette.border,
    padding: Spacing.space4,
    marginVertical: Spacing.space3,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.space1 + 2,
  },
  summaryLabel: {
    ...Typography.supporting,
    color: Palette.muted,
    fontSize: 13,
  },
  summaryValue: {
    ...Typography.bodyBold,
    color: Palette.ink,
    maxWidth: '65%',
    textAlign: 'right',
  },
  summaryValueHighlight: {
    ...Typography.bodyBold,
    color: Palette.forest,
  },
  divider: {
    height: 1,
    backgroundColor: Palette.surfaceSubtle,
    marginVertical: 4,
  },
  bioContainer: {
    marginTop: Spacing.space3,
    marginBottom: Spacing.space4,
  },
  bioLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.space1 + 2,
  },
  bioLabel: {
    ...Typography.supporting,
    fontWeight: '600',
    color: Palette.ink,
  },
  optionalBadge: {
    ...Typography.supporting,
    color: Palette.muted,
    fontSize: 11.5,
  },
  bioInputContainer: {
    backgroundColor: Palette.white,
    borderWidth: 1,
    borderColor: Palette.border,
    borderRadius: Radius.sm,
    padding: Spacing.space3,
    minHeight: 88,
  },
  bioInput: {
    ...Typography.body,
    color: Palette.ink,
    textAlignVertical: 'top',
    height: '100%',
  },
  bottomBar: {
    marginTop: Spacing.space4,
    width: '100%',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: Palette.overlay,
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: Palette.white,
    borderTopLeftRadius: Radius.lg,
    borderTopRightRadius: Radius.lg,
    padding: Spacing.space5,
    maxHeight: '60%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: Spacing.space3,
    borderBottomWidth: 1,
    borderBottomColor: Palette.surfaceSubtle,
  },
  modalTitle: {
    ...Typography.cardHeading,
    color: Palette.ink,
    fontSize: 17,
  },
  avatarModalSubtitle: {
    ...Typography.supporting,
    color: Palette.muted,
    marginTop: Spacing.space3,
    marginBottom: Spacing.space4,
  },
  avatarPresetsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: Spacing.space5,
  },
  avatarPresetOption: {
    alignItems: 'center',
    padding: 8,
    borderRadius: Radius.card,
  },
  avatarPresetSelected: {
    backgroundColor: Palette.surfaceSubtle,
  },
  avatarPresetCircle: {
    width: 58,
    height: 58,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  presetEmoji: {
    fontSize: 28,
  },
  presetLabel: {
    ...Typography.supporting,
    color: Palette.ink,
    fontWeight: '600',
    fontSize: 12,
  },
  photoActionsList: {
    borderTopWidth: 1,
    borderTopColor: Palette.surfaceSubtle,
    paddingTop: Spacing.space3,
    gap: 8,
  },
  photoActionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Palette.surfaceHighlight,
    borderWidth: 1,
    borderColor: Palette.border,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: Radius.btn,
  },
  photoActionText: {
    ...Typography.bodyBold,
    color: Palette.forest,
    fontSize: 14,
  },
  pressed: {
    opacity: 0.8,
  },
});
