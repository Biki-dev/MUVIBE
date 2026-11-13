import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Modal,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Palette, Radius, Spacing, Typography, FontFamily } from '@/constants/theme';
import { FitConnectLogo } from '@/components/brand/logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AppIcon } from '@/components/ui/icon';
import { useAuth } from '@/context/auth-context';

type AuthMode = 'welcome' | 'email_signup' | 'email_login';

export default function WelcomeAuthScreen() {
  const router = useRouter();
  const { signInWithEmail, signUpWithEmail, signInWithGoogle, continueAsGuest } = useAuth();

  const [mode, setMode] = useState<AuthMode>('welcome');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modals
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [showTermsModal, setShowTermsModal] = useState(false);

  const handleGoogleAuth = async () => {
    setErrorMessage('');
    setIsSubmitting(true);
    try {
      const res = await signInWithGoogle();
      if (res.success) {
        router.push('/onboarding/profile');
      } else {
        setErrorMessage(res.error || 'Google sign-in failed.');
      }
    } catch {
      setErrorMessage('Unable to reach Google sign-in.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Guest keeps everything on this phone: no account, no server.
  const handleGuest = async () => {
    setErrorMessage('');
    setIsSubmitting(true);
    try {
      const res = await continueAsGuest();
      if (res.success) {
        router.push('/onboarding/profile');
      } else {
        setErrorMessage(res.error || 'Could not start a guest session.');
      }
    } catch {
      setErrorMessage('Could not start a guest session.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEmailSubmit = async () => {
    setErrorMessage('');
    if (!email || !email.includes('@')) {
      setErrorMessage('Please enter a valid campus or personal email address.');
      return;
    }
    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
      return;
    }

    if (mode === 'email_signup') {
      if (password !== confirmPassword) {
        setErrorMessage('Passwords do not match.');
        return;
      }

      setIsSubmitting(true);
      const res = await signUpWithEmail(email, password);
      setIsSubmitting(false);

      if (res.success) {
        router.push('/onboarding/profile');
      } else {
        setErrorMessage(res.error || 'Account creation failed.');
      }
    } else {
      // Login mode
      setIsSubmitting(true);
      const res = await signInWithEmail(email, password);
      setIsSubmitting(false);

      if (res.success) {
        router.push('/onboarding/profile');
      } else {
        setErrorMessage(res.error || 'Invalid email or password.');
      }
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardContainer}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          {/* 1. FitConnect Logo */}
          <View style={styles.logoWrapper}>
            <FitConnectLogo size="sm" showTagline={false} />
          </View>

          {/* 2. Hero illustration / Athlete visual */}
          <View style={styles.heroVisualCard}>
            <View style={styles.heroInnerEmblem}>
              <View style={styles.heroPulseCircle} />
              <AppIcon name="fitness" size={44} color={Palette.lime} />
            </View>

            <View style={styles.heroBadgeRow}>
              <View style={styles.campusTag}>
                <AppIcon name="school" size={13} color={Palette.lime} />
                <Text style={styles.campusTagText}>Campus Fitness Network</Text>
              </View>
              <View style={styles.statPill}>
                <Text style={styles.statPillText}>⚡ 1,200+ Active Students</Text>
              </View>
            </View>
          </View>

          {/* 3. Heading & 4. Subtitle */}
          <View style={styles.textBlock}>
            <Text style={styles.heading}>Your fitness journey starts here.</Text>
            <Text style={styles.subtitle}>
              Stay active, find your people and grow together on campus.
            </Text>
          </View>

          {/* Error notice */}
          {!!errorMessage && (
            <View style={styles.errorContainer}>
              <AppIcon name="alert-circle" size={16} color={Palette.coral} />
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          )}

          {/* Screen mode routing */}
          {mode === 'welcome' ? (
            <View style={styles.authButtonsContainer}>
              {/* 5. Continue as Guest: local only, nothing leaves the phone */}
              <Button
                label="Continue as Guest"
                variant="primary"
                size="md"
                onPress={handleGuest}
                loading={isSubmitting}
                icon={<AppIcon name="person-outline" size={18} color={Palette.ink} />}
              />

              <Text style={styles.localNote}>
                No email needed. Add one later to keep your progress.
              </Text>

              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or sign in to sync</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* 6. Sign in with Email (Supabase) */}
              <Button
                label="Sign in with Email"
                variant="outline"
                size="md"
                onPress={() => setMode('email_signup')}
                icon={<AppIcon name="mail-outline" size={18} color={Palette.forest} />}
                style={styles.googleButton}
              />

              {/* 7. Sign in with Google (Supabase OAuth) */}
              <Button
                label="Continue with Google"
                variant="outline"
                size="md"
                onPress={handleGoogleAuth}
                loading={isSubmitting}
                icon={<AppIcon name="logo-google" size={18} color="#EA4335" />}
                style={styles.googleButton}
              />

              {/* 7. Existing user login / new user signup switch */}
              <View style={styles.switchRow}>
                <Text style={styles.switchPrompt}>Already have an account?</Text>
                <Pressable
                  onPress={() => setMode('email_login')}
                  hitSlop={8}
                  style={({ pressed }) => [pressed && styles.pressed]}>
                  <Text style={styles.switchAction}>Log In</Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <View style={styles.formCard}>
              <View style={styles.formHeaderRow}>
                <Text style={styles.formTitle}>
                  {mode === 'email_signup' ? 'Create Your Account' : 'Welcome Back'}
                </Text>
                <Pressable
                  onPress={() => {
                    setErrorMessage('');
                    setMode('welcome');
                  }}
                  hitSlop={8}>
                  <Text style={styles.cancelText}>Cancel</Text>
                </Pressable>
              </View>

              <Input
                label="College or Personal Email"
                required
                placeholder="e.g. rollnumber@aec.ac.in"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
                leftIcon={<AppIcon name="mail-outline" size={18} color={Palette.muted} />}
              />

              <Input
                label="Password"
                required
                placeholder="At least 6 characters"
                isPassword
                value={password}
                onChangeText={setPassword}
                leftIcon={<AppIcon name="lock-closed-outline" size={18} color={Palette.muted} />}
              />

              {mode === 'email_signup' && (
                <Input
                  label="Confirm Password"
                  required
                  placeholder="Re-enter password"
                  isPassword
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  leftIcon={<AppIcon name="shield-checkmark-outline" size={18} color={Palette.muted} />}
                />
              )}

              {mode === 'email_login' && (
                <Pressable
                  onPress={() => setShowForgotModal(true)}
                  style={styles.forgotPasswordButton}
                  hitSlop={8}>
                  <Text style={styles.forgotPasswordText}>Forgot password?</Text>
                </Pressable>
              )}

              <Button
                label={mode === 'email_signup' ? 'Create Account' : 'Log In'}
                variant="primary"
                size="md"
                onPress={handleEmailSubmit}
                loading={isSubmitting}
                style={styles.submitButton}
              />

              {/* Quick switch between login and signup */}
              <View style={styles.formSwitchRow}>
                <Text style={styles.switchPrompt}>
                  {mode === 'email_signup'
                    ? 'Already have an account?'
                    : "Don't have an account yet?"}
                </Text>
                <Pressable
                  onPress={() => {
                    setErrorMessage('');
                    setMode(mode === 'email_signup' ? 'email_login' : 'email_signup');
                  }}
                  hitSlop={8}>
                  <Text style={styles.switchAction}>
                    {mode === 'email_signup' ? 'Log In' : 'Sign Up'}
                  </Text>
                </Pressable>
              </View>
            </View>
          )}

          {/* 8. Terms and privacy links */}
          <View style={styles.footerContainer}>
            <Text style={styles.termsText}>
              By continuing, you agree to FitConnect's{' '}
              <Text
                style={styles.termsLink}
                onPress={() => setShowTermsModal(true)}>
                Terms of Service
              </Text>{' '}
              and{' '}
              <Text
                style={styles.termsLink}
                onPress={() => setShowTermsModal(true)}>
                Privacy Policy
              </Text>
              .
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Forgot Password Modal */}
      <Modal
        visible={showForgotModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowForgotModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Reset Password</Text>
            <Text style={styles.modalSubtitle}>
              Enter your student email and we'll send you instructions to reset your password.
            </Text>
            <Input
              label="Email Address"
              placeholder="e.g. student@aec.ac.in"
              value={forgotEmail}
              onChangeText={setForgotEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <View style={styles.modalActions}>
              <Button
                label="Cancel"
                variant="outline"
                size="sm"
                fullWidth={false}
                onPress={() => setShowForgotModal(false)}
                style={styles.modalCancelButton}
              />
              <Button
                label="Send Link"
                variant="primary"
                size="sm"
                fullWidth={false}
                onPress={() => {
                  setShowForgotModal(false);
                  Alert.alert('Reset Link Sent', 'Check your student inbox for password instructions.');
                }}
                style={styles.modalSubmitButton}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Terms and Privacy Modal */}
      <Modal
        visible={showTermsModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowTermsModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, styles.termsModalContent]}>
            <View style={styles.termsHeader}>
              <Text style={styles.modalTitle}>Terms & Campus Privacy</Text>
              <Pressable onPress={() => setShowTermsModal(false)} hitSlop={8}>
                <AppIcon name="close" size={22} color={Palette.ink} />
              </Pressable>
            </View>
            <ScrollView style={styles.termsScroll} showsVerticalScrollIndicator={false}>
              <Text style={styles.termsSectionTitle}>1. Campus Community Safety</Text>
              <Text style={styles.termsParagraph}>
                FitConnect is built exclusively for verified students and campus sports societies.
                Members are expected to foster mutual respect, safety during club group runs, and athletic sportsmanship.
              </Text>
              <Text style={styles.termsSectionTitle}>2. Privacy & Location Usage</Text>
              <Text style={styles.termsParagraph}>
                Your location is strictly used for nearby club discovery and campus perimeter checks.
                We never engage in background tracking or sell student data.
              </Text>
              <Text style={styles.termsSectionTitle}>3. Academic Respect</Text>
              <Text style={styles.termsParagraph}>
                Activity schedules are organized around college sessions to help maintain a healthy balance between academics and physical wellness.
              </Text>
            </ScrollView>
            <Button
              label="I Understand"
              variant="primary"
              size="md"
              onPress={() => setShowTermsModal(false)}
            />
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
    paddingTop: Spacing.space3,
    paddingBottom: Spacing.space6,
    alignItems: 'center',
    maxWidth: 500,
    width: '100%',
    alignSelf: 'center',
  },
  logoWrapper: {
    marginBottom: Spacing.space4,
  },
  heroVisualCard: {
    width: '100%',
    height: 190,
    backgroundColor: Palette.forest,
    borderRadius: Radius.lg, // 24px
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
    marginBottom: Spacing.space5,
    borderWidth: 1,
    borderColor: Palette.borderDark,
  },
  heroInnerEmblem: {
    width: 86,
    height: 86,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(197, 243, 107, 0.3)',
  },
  heroPulseCircle: {
    position: 'absolute',
    width: 104,
    height: 104,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: 'rgba(197, 243, 107, 0.15)',
  },
  heroBadgeRow: {
    position: 'absolute',
    bottom: Spacing.space3,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  campusTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    paddingHorizontal: Spacing.space2 + 2,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  campusTagText: {
    ...Typography.supporting,
    color: Palette.white,
    fontSize: 11,
    fontWeight: '600',
    fontFamily: FontFamily.medium,
  },
  statPill: {
    backgroundColor: 'rgba(197, 243, 107, 0.2)',
    paddingHorizontal: Spacing.space2 + 2,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  statPillText: {
    ...Typography.supporting,
    color: Palette.lime,
    fontSize: 11,
    fontWeight: '700',
    fontFamily: FontFamily.bold,
  },
  textBlock: {
    alignItems: 'center',
    marginBottom: Spacing.space5,
  },
  heading: {
    ...Typography.pageTitle,
    textAlign: 'center',
    color: Palette.ink,
    marginBottom: Spacing.space2,
  },
  subtitle: {
    ...Typography.body,
    textAlign: 'center',
    color: Palette.muted,
    paddingHorizontal: Spacing.space3,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(229, 108, 103, 0.1)',
    borderWidth: 1,
    borderColor: Palette.coral,
    borderRadius: Radius.sm,
    padding: Spacing.space3,
    marginBottom: Spacing.space4,
    width: '100%',
    gap: 8,
  },
  errorText: {
    ...Typography.supporting,
    color: Palette.coral,
    flex: 1,
    fontWeight: '500',
    fontFamily: FontFamily.medium,
  },
  authButtonsContainer: {
    width: '100%',
    gap: Spacing.space3,
  },
  googleButton: {
    borderColor: Palette.border,
  },
  localNote: {
    ...Typography.supporting,
    color: Palette.muted,
    textAlign: 'center',
    marginTop: 2,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.space3,
    marginVertical: Spacing.space1,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Palette.border,
  },
  dividerText: {
    ...Typography.supporting,
    color: Palette.muted,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: Spacing.space3,
  },
  switchPrompt: {
    ...Typography.supporting,
    color: Palette.muted,
  },
  switchAction: {
    ...Typography.supporting,
    color: Palette.forest,
    fontWeight: '700',
    fontFamily: FontFamily.bold,
  },
  formCard: {
    width: '100%',
    backgroundColor: Palette.white,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Palette.border,
    padding: Spacing.space4,
  },
  formHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.space4,
  },
  formTitle: {
    ...Typography.cardHeading,
    color: Palette.ink,
  },
  cancelText: {
    ...Typography.supporting,
    color: Palette.muted,
    fontWeight: '600',
    fontFamily: FontFamily.medium,
  },
  forgotPasswordButton: {
    alignSelf: 'flex-end',
    marginBottom: Spacing.space3,
  },
  forgotPasswordText: {
    ...Typography.supporting,
    color: Palette.electricBlue,
    fontWeight: '600',
    fontFamily: FontFamily.medium,
  },
  submitButton: {
    marginTop: Spacing.space2,
  },
  formSwitchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: Spacing.space4,
  },
  footerContainer: {
    marginTop: Spacing.space6,
    alignItems: 'center',
  },
  termsText: {
    ...Typography.supporting,
    color: Palette.muted,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: Spacing.space2,
  },
  termsLink: {
    color: Palette.forest,
    fontWeight: '600',
    fontFamily: FontFamily.medium,
    textDecorationLine: 'underline',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: Palette.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.space4,
  },
  modalContent: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: Palette.white,
    borderRadius: Radius.lg,
    padding: Spacing.space5,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  termsModalContent: {
    maxHeight: '80%',
  },
  termsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.space3,
  },
  termsScroll: {
    marginVertical: Spacing.space3,
  },
  termsSectionTitle: {
    ...Typography.cardHeading,
    fontSize: 14,
    color: Palette.ink,
    marginTop: Spacing.space2,
    marginBottom: 4,
  },
  termsParagraph: {
    ...Typography.body,
    fontSize: 13,
    color: Palette.muted,
    lineHeight: 19,
    marginBottom: Spacing.space3,
  },
  modalTitle: {
    ...Typography.cardHeading,
    fontSize: 18,
    color: Palette.ink,
    marginBottom: Spacing.space1,
  },
  modalSubtitle: {
    ...Typography.supporting,
    color: Palette.muted,
    marginBottom: Spacing.space4,
    lineHeight: 18,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: Spacing.space2,
  },
  modalCancelButton: {
    minWidth: 90,
  },
  modalSubmitButton: {
    minWidth: 110,
  },
  pressed: {
    opacity: 0.7,
  },
});
