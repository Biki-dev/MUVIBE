import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Palette, Radius, Spacing, Typography, FontFamily } from '@/constants/theme';
import { ProgressHeader } from '@/components/onboarding/progress-header';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { AppIcon } from '@/components/ui/icon';
import { useAuth } from '@/context/auth-context';
import { COLLEGES, DEPARTMENTS, ACADEMIC_YEARS } from '@/constants/mock-data';

export default function BasicProfileScreen() {
  const router = useRouter();
  const { profile, updateProfile, user } = useAuth();

  const [fullName, setFullName] = useState(profile.fullName || user?.name || '');
  const [username, setUsername] = useState(
    profile.username || (user?.email ? user.email.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '') : '')
  );
  const [college, setCollege] = useState(profile.college || 'Assam Engineering College (AEC)');
  const [department, setDepartment] = useState(profile.department || 'Computer Science & Engineering');
  const [academicYear, setAcademicYear] = useState(profile.academicYear || '1st Year (Freshman)');

  // Modals for selection
  const [collegeModalVisible, setCollegeModalVisible] = useState(false);
  const [deptModalVisible, setDeptModalVisible] = useState(false);

  // Errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!fullName.trim()) {
      errs.fullName = 'Full name is required';
    }
    if (!username.trim()) {
      errs.username = 'Username is required';
    } else if (username.length < 3) {
      errs.username = 'Username must be at least 3 characters';
    } else if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      errs.username = 'Only letters, numbers, and underscores allowed';
    }
    if (!college) {
      errs.college = 'College selection is required';
    }
    if (!department) {
      errs.department = 'Department is required';
    }
    if (!academicYear) {
      errs.academicYear = 'Academic year is required';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleContinue = async () => {
    if (!validate()) return;

    await updateProfile({
      fullName: fullName.trim(),
      username: username.trim().toLowerCase(),
      college,
      department,
      academicYear,
    });

    router.push('/onboarding/activities');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ProgressHeader
        currentStep={1}
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
          {/* Header text */}
          <View style={styles.headerBlock}>
            <Text style={styles.title}>Basic Profile</Text>
            <Text style={styles.subtitle}>
              Set up your campus identity so clubs and workout peers can discover and connect with you.
            </Text>
          </View>

          {/* Form fields */}
          <View style={styles.formContainer}>
            {/* Full Name */}
            <Input
              label="Full Name"
              required
              placeholder="e.g. Priyam Barman"
              value={fullName}
              onChangeText={(text) => {
                setFullName(text);
                if (errors.fullName) setErrors((prev) => ({ ...prev, fullName: '' }));
              }}
              error={errors.fullName}
              leftIcon={<AppIcon name="person-outline" size={18} color={Palette.muted} />}
            />

            {/* Username */}
            <Input
              label="Username"
              required
              placeholder="e.g. priyam_fit"
              autoCapitalize="none"
              value={username}
              onChangeText={(text) => {
                const cleaned = text.toLowerCase().replace(/[^a-z0-9_]/g, '');
                setUsername(cleaned);
                if (errors.username) setErrors((prev) => ({ ...prev, username: '' }));
              }}
              error={errors.username}
              helperText="Unique campus handle (visible on leaderboards)"
              leftIcon={<AppIcon name="at-outline" size={18} color={Palette.muted} />}
            />

            {/* College (Required - Selection must come before club discovery) */}
            <View style={styles.selectFieldContainer}>
              <View style={styles.labelRow}>
                <Text style={styles.fieldLabel}>College / Institution</Text>
                <Text style={styles.requiredStar}>*</Text>
              </View>
              <Pressable
                onPress={() => setCollegeModalVisible(true)}
                style={[styles.selectBox, !!errors.college && styles.selectBoxError]}>
                <View style={styles.selectLeft}>
                  <AppIcon name="school-outline" size={18} color={Palette.forest} />
                  <Text style={styles.selectValue} numberOfLines={1}>
                    {college || 'Select your college'}
                  </Text>
                </View>
                <AppIcon name="chevron-forward" size={18} color={Palette.muted} />
              </Pressable>
              {errors.college ? (
                <Text style={styles.errorText}>{errors.college}</Text>
              ) : (
                <Text style={styles.fieldNote}>
                  Available campus clubs will depend on your college.
                </Text>
              )}
            </View>

            {/* Department */}
            <View style={styles.selectFieldContainer}>
              <View style={styles.labelRow}>
                <Text style={styles.fieldLabel}>Department / Major</Text>
                <Text style={styles.requiredStar}>*</Text>
              </View>
              <Pressable
                onPress={() => setDeptModalVisible(true)}
                style={[styles.selectBox, !!errors.department && styles.selectBoxError]}>
                <View style={styles.selectLeft}>
                  <AppIcon name="library-outline" size={18} color={Palette.forest} />
                  <Text style={styles.selectValue} numberOfLines={1}>
                    {department || 'Select your department'}
                  </Text>
                </View>
                <AppIcon name="chevron-forward" size={18} color={Palette.muted} />
              </Pressable>
              {errors.department ? (
                <Text style={styles.errorText}>{errors.department}</Text>
              ) : null}
            </View>

            {/* Academic Year */}
            <View style={styles.selectFieldContainer}>
              <View style={styles.labelRow}>
                <Text style={styles.fieldLabel}>Academic Year</Text>
                <Text style={styles.requiredStar}>*</Text>
              </View>
              <View style={styles.yearChipsWrap}>
                {ACADEMIC_YEARS.map((yr) => {
                  const isSelected = academicYear === yr;
                  const shortLabel = yr.split(' ')[0] + ' ' + yr.split(' ')[1];
                  return (
                    <Pressable
                      key={yr}
                      onPress={() => setAcademicYear(yr)}
                      style={[
                        styles.yearChip,
                        isSelected && styles.yearChipSelected,
                      ]}>
                      <Text
                        style={[
                          styles.yearChipText,
                          isSelected && styles.yearChipTextSelected,
                        ]}>
                        {shortLabel}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </View>

          {/* Continue button */}
          <View style={styles.bottomBar}>
            <Button
              label="Continue to Activities"
              variant="primary"
              size="lg"
              onPress={handleContinue}
              icon={<AppIcon name="arrow-forward" size={18} color={Palette.ink} />}
              iconPosition="right"
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* College Selection Modal */}
      <Modal
        visible={collegeModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setCollegeModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select College</Text>
              <Pressable onPress={() => setCollegeModalVisible(false)} hitSlop={8}>
                <AppIcon name="close" size={22} color={Palette.ink} />
              </Pressable>
            </View>
            <ScrollView style={styles.modalList}>
              {COLLEGES.map((item) => {
                const isSelected = college === item;
                return (
                  <Pressable
                    key={item}
                    onPress={() => {
                      setCollege(item);
                      setCollegeModalVisible(false);
                      if (errors.college) setErrors((prev) => ({ ...prev, college: '' }));
                    }}
                    style={[styles.modalItem, isSelected && styles.modalItemSelected]}>
                    <Text
                      style={[
                        styles.modalItemText,
                        isSelected && styles.modalItemTextSelected,
                      ]}>
                      {item}
                    </Text>
                    {isSelected && <AppIcon name="checkmark" size={18} color={Palette.forest} />}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Department Selection Modal */}
      <Modal
        visible={deptModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setDeptModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Department</Text>
              <Pressable onPress={() => setDeptModalVisible(false)} hitSlop={8}>
                <AppIcon name="close" size={22} color={Palette.ink} />
              </Pressable>
            </View>
            <ScrollView style={styles.modalList}>
              {DEPARTMENTS.map((item) => {
                const isSelected = department === item;
                return (
                  <Pressable
                    key={item}
                    onPress={() => {
                      setDepartment(item);
                      setDeptModalVisible(false);
                      if (errors.department) setErrors((prev) => ({ ...prev, department: '' }));
                    }}
                    style={[styles.modalItem, isSelected && styles.modalItemSelected]}>
                    <Text
                      style={[
                        styles.modalItemText,
                        isSelected && styles.modalItemTextSelected,
                      ]}>
                      {item}
                    </Text>
                    {isSelected && <AppIcon name="checkmark" size={18} color={Palette.forest} />}
                  </Pressable>
                );
              })}
            </ScrollView>
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
    marginBottom: Spacing.space5,
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
  formContainer: {
    width: '100%',
  },
  selectFieldContainer: {
    marginBottom: Spacing.space4,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.space1 + 2,
  },
  fieldLabel: {
    ...Typography.supporting,
    fontWeight: '600',
    fontFamily: FontFamily.medium,
    color: Palette.ink,
  },
  requiredStar: {
    color: Palette.coral,
    marginLeft: 3,
    fontSize: 13,
    fontWeight: '700',
    fontFamily: FontFamily.bold,
  },
  selectBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Palette.white,
    borderWidth: 1,
    borderColor: Palette.border,
    borderRadius: Radius.sm, // 10px
    paddingHorizontal: Spacing.space3,
    minHeight: 48,
  },
  selectBoxError: {
    borderColor: Palette.coral,
  },
  selectLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
    marginRight: 8,
  },
  selectValue: {
    ...Typography.body,
    color: Palette.ink,
  },
  fieldNote: {
    ...Typography.supporting,
    color: Palette.muted,
    marginTop: Spacing.space1,
    fontSize: 11.5,
  },
  errorText: {
    ...Typography.supporting,
    color: Palette.coral,
    marginTop: Spacing.space1,
  },
  yearChipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  yearChip: {
    backgroundColor: Palette.white,
    borderWidth: 1,
    borderColor: Palette.border,
    borderRadius: Radius.full,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  yearChipSelected: {
    backgroundColor: Palette.forest,
    borderColor: Palette.forest,
  },
  yearChipText: {
    ...Typography.supporting,
    fontWeight: '600',
    fontFamily: FontFamily.medium,
    color: Palette.ink,
  },
  yearChipTextSelected: {
    color: Palette.white,
  },
  bottomBar: {
    marginTop: Spacing.space5,
    width: '100%',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: Palette.overlay,
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: Palette.white,
    borderTopLeftRadius: Radius.lg, // 24px top corners
    borderTopRightRadius: Radius.lg,
    padding: Spacing.space4,
    maxHeight: '75%',
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
    fontSize: 17,
    color: Palette.ink,
  },
  modalList: {
    marginTop: Spacing.space2,
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.space3,
    paddingHorizontal: Spacing.space2,
    borderBottomWidth: 1,
    borderBottomColor: Palette.surfaceSubtle,
  },
  modalItemSelected: {
    backgroundColor: Palette.surfaceHighlight,
  },
  modalItemText: {
    ...Typography.body,
    color: Palette.ink,
    flex: 1,
  },
  modalItemTextSelected: {
    fontWeight: '700',
    fontFamily: FontFamily.bold,
    color: Palette.forest,
  },
});
