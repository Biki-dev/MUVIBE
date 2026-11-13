import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Palette, Radius, Spacing, Typography } from '@/constants/theme';
import { AppIcon } from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/auth-context';

const AVATAR_OPTIONS = [
  { id: 'av_runner', emoji: '🏃', label: 'Runner', bg: '#C5F36B' },
  { id: 'av_cyclist', emoji: '🚴', label: 'Cyclist', bg: '#5279F6' },
  { id: 'av_strength', emoji: '🏋️', label: 'Power', bg: '#18352D' },
  { id: 'av_yoga', emoji: '🧘', label: 'Zen', bg: '#E8A34A' },
];

const AVAILABLE_INTERESTS = [
  'Running',
  'Walking',
  'Cycling',
  'Gym & Strength',
  'Jump Rope',
  'Yoga',
  'Swimming',
  'Hiking',
  'Football',
  'Badminton',
];

export default function EditProfileScreen() {
  const router = useRouter();
  const { user, profile, updateProfile, selectedActivities } = useAuth();

  const [avatar, setAvatar] = useState(profile.avatarUrl || 'av_runner');
  const [fullName, setFullName] = useState(
    profile.fullName || user?.name || user?.email?.split('@')[0] || ''
  );
  const [username, setUsername] = useState(
    profile.username || user?.email?.split('@')[0] || ''
  );
  const [college, setCollege] = useState(profile.college || 'Assam Engineering College');
  const [department, setDepartment] = useState(profile.department || '');
  const [academicYear, setAcademicYear] = useState(profile.academicYear || '');
  const [bio, setBio] = useState(profile.bio || '');
  const [interests, setInterests] = useState<string[]>(
    selectedActivities.length > 0
      ? selectedActivities
      : ['Running', 'Walking', 'Gym & Strength']
  );
  const [isSaving, setIsSaving] = useState(false);

  const toggleInterest = (interest: string) => {
    if (interests.includes(interest)) {
      setInterests(interests.filter((i) => i !== interest));
    } else {
      setInterests([...interests, interest]);
    }
  };

  const handleSave = async () => {
    if (!fullName.trim()) {
      Alert.alert('Required Field', 'Please enter your full name.');
      return;
    }
    if (!username.trim()) {
      Alert.alert('Required Field', 'Please enter a username.');
      return;
    }

    setIsSaving(true);
    try {
      await updateProfile({
        fullName: fullName.trim(),
        username: username.trim().toLowerCase().replace('@', ''),
        college: college.trim(),
        department: department.trim(),
        academicYear: academicYear.trim(),
        avatarUrl: avatar,
        bio: bio.trim(),
      });
      router.back();
    } catch (err: any) {
      Alert.alert('Save Error', err?.message || 'Failed to update profile.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardContainer}>
        {/* Top Header */}
        <View style={styles.topHeader}>
          <Pressable onPress={() => router.back()} style={styles.backButton} hitSlop={10}>
            <AppIcon name="arrow-back" size={24} color={Palette.ink} />
          </Pressable>
          <Text style={styles.topHeaderTitle}>Edit Profile</Text>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          {/* Avatar Selector */}
          <View style={styles.avatarSection}>
            <Text style={styles.sectionLabel}>CHOOSE AVATAR</Text>
            <View style={styles.avatarRow}>
              {AVATAR_OPTIONS.map((opt) => {
                const isSelected = avatar === opt.id;
                return (
                  <Pressable
                    key={opt.id}
                    onPress={() => setAvatar(opt.id)}
                    style={[
                      styles.avatarOption,
                      isSelected && styles.avatarOptionSelected,
                    ]}>
                    <View style={[styles.avatarCircle, { backgroundColor: opt.bg }]}>
                      <Text style={styles.avatarEmoji}>{opt.emoji}</Text>
                    </View>
                    <Text style={styles.avatarLabel}>{opt.label}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Form Fields */}
          <View style={styles.formGroup}>
            <Text style={styles.fieldLabel}>Full Name *</Text>
            <TextInput
              style={styles.input}
              value={fullName}
              onChangeText={setFullName}
              placeholder="e.g. Biki Kalita"
              placeholderTextColor={Palette.muted}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.fieldLabel}>Username *</Text>
            <View style={styles.usernameInputWrap}>
              <Text style={styles.atSign}>@</Text>
              <TextInput
                style={[styles.input, styles.usernameInput]}
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                placeholder="username"
                placeholderTextColor={Palette.muted}
              />
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.fieldLabel}>College / Institution *</Text>
            <TextInput
              style={styles.input}
              value={college}
              onChangeText={setCollege}
              placeholder="e.g. Assam Engineering College"
              placeholderTextColor={Palette.muted}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.fieldLabel}>Department *</Text>
            <TextInput
              style={styles.input}
              value={department}
              onChangeText={setDepartment}
              placeholder="e.g. Mechanical Engineering"
              placeholderTextColor={Palette.muted}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.fieldLabel}>Academic Year *</Text>
            <TextInput
              style={styles.input}
              value={academicYear}
              onChangeText={setAcademicYear}
              placeholder="e.g. 2nd Year"
              placeholderTextColor={Palette.muted}
            />
          </View>

          <View style={styles.formGroup}>
            <View style={styles.bioLabelRow}>
              <Text style={styles.fieldLabel}>Short Bio</Text>
              <Text style={styles.charCount}>{bio.length}/150</Text>
            </View>
            <TextInput
              style={[styles.input, styles.bioInput]}
              value={bio}
              onChangeText={setBio}
              multiline
              maxLength={150}
              placeholder="Share your fitness philosophy, favorite times to train..."
              placeholderTextColor={Palette.muted}
            />
          </View>

          {/* Activity Interests */}
          <View style={styles.interestsSection}>
            <Text style={styles.sectionLabel}>ACTIVITY INTERESTS</Text>
            <View style={styles.interestChipsWrap}>
              {AVAILABLE_INTERESTS.map((item) => {
                const isSelected = interests.includes(item);
                return (
                  <Pressable
                    key={item}
                    onPress={() => toggleInterest(item)}
                    style={[
                      styles.interestChip,
                      isSelected && styles.interestChipActive,
                    ]}>
                    <Text
                      style={[
                        styles.interestText,
                        isSelected && styles.interestTextActive,
                      ]}>
                      {item}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </ScrollView>

        {/* Sticky Bottom Actions */}
        <View style={styles.bottomBar}>
          <Button
            label="Save Changes"
            variant="primary"
            size="lg"
            onPress={handleSave}
            loading={isSaving}
            icon={<AppIcon name="checkmark" size={18} color={Palette.ink} />}
          />
          <Button
            label="Cancel"
            variant="outline"
            size="md"
            onPress={() => router.back()}
          />
        </View>
      </KeyboardAvoidingView>
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
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.space4,
    paddingVertical: Spacing.space3,
    backgroundColor: Palette.white,
    borderBottomWidth: 1,
    borderBottomColor: Palette.border,
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topHeaderTitle: {
    ...Typography.sectionHeading,
    fontSize: 16,
    color: Palette.ink,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.space4,
    paddingTop: Spacing.space4,
    paddingBottom: Spacing.space6,
    maxWidth: 600,
    width: '100%',
    alignSelf: 'center',
  },
  avatarSection: {
    backgroundColor: Palette.white,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Palette.border,
    padding: Spacing.space4,
    marginBottom: Spacing.space4,
  },
  sectionLabel: {
    ...Typography.supporting,
    fontSize: 11,
    fontWeight: '700',
    color: Palette.muted,
    letterSpacing: 0.6,
    marginBottom: Spacing.space3,
  },
  avatarRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  avatarOption: {
    alignItems: 'center',
    padding: 6,
    borderRadius: Radius.card,
  },
  avatarOptionSelected: {
    backgroundColor: Palette.surfaceSubtle,
  },
  avatarCircle: {
    width: 52,
    height: 52,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
    borderWidth: 1.5,
    borderColor: Palette.white,
  },
  avatarEmoji: {
    fontSize: 24,
  },
  avatarLabel: {
    ...Typography.supporting,
    fontSize: 11,
    color: Palette.ink,
    fontWeight: '600',
  },
  formGroup: {
    marginBottom: Spacing.space4,
  },
  fieldLabel: {
    ...Typography.supporting,
    fontSize: 12.5,
    fontWeight: '600',
    color: Palette.ink,
    marginBottom: 6,
  },
  input: {
    backgroundColor: Palette.white,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Palette.border,
    paddingHorizontal: Spacing.space3,
    paddingVertical: 11,
    ...Typography.body,
    color: Palette.ink,
  },
  usernameInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Palette.white,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Palette.border,
    paddingLeft: Spacing.space3,
  },
  atSign: {
    ...Typography.bodyBold,
    color: Palette.forest,
  },
  usernameInput: {
    flex: 1,
    borderWidth: 0,
    paddingLeft: 4,
  },
  bioLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  charCount: {
    ...Typography.supporting,
    fontSize: 11,
    color: Palette.muted,
  },
  bioInput: {
    minHeight: 74,
    textAlignVertical: 'top',
  },
  interestsSection: {
    backgroundColor: Palette.white,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Palette.border,
    padding: Spacing.space4,
    marginBottom: Spacing.space4,
  },
  interestChipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  interestChip: {
    backgroundColor: Palette.surfaceSubtle,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Palette.border,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  interestChipActive: {
    backgroundColor: Palette.lime,
    borderColor: Palette.lime,
  },
  interestText: {
    ...Typography.supporting,
    fontSize: 12,
    color: Palette.muted,
  },
  interestTextActive: {
    color: Palette.ink,
    fontWeight: '700',
  },
  bottomBar: {
    paddingHorizontal: Spacing.space4,
    paddingTop: Spacing.space3,
    paddingBottom: Spacing.space4,
    backgroundColor: Palette.white,
    borderTopWidth: 1,
    borderTopColor: Palette.border,
    maxWidth: 600,
    width: '100%',
    alignSelf: 'center',
    gap: Spacing.space2,
  },
});
