import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Palette } from '@/constants/theme';
import { FitConnectLogo } from '@/components/brand/logo';
import { useAuth } from '@/context/auth-context';

export default function SplashScreen() {
  const router = useRouter();
  const {
    isCheckingSession,
    hasValidSession,
    hasSeenIntro,
    isOnboardingCompleted,
    getNextOnboardingRoute,
  } = useAuth();

  useEffect(() => {
    if (!isCheckingSession) {
      if (!hasSeenIntro && !hasValidSession) {
        // First install → intro slides, then Guest / Sign in
        router.replace('/intro' as any);
      } else if (hasValidSession && isOnboardingCompleted) {
        // Valid session + completed onboarding → Home
        router.replace('/(tabs)');
      } else if (hasValidSession && !isOnboardingCompleted) {
        // Valid session + incomplete onboarding → Resume onboarding
        const nextRoute = getNextOnboardingRoute();
        router.replace(nextRoute as any);
      } else {
        // No valid session → Welcome/Auth
        router.replace('/auth');
      }
    }
  }, [
    isCheckingSession,
    hasValidSession,
    hasSeenIntro,
    isOnboardingCompleted,
    router,
    getNextOnboardingRoute,
  ]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.centerContent}>
        <FitConnectLogo
          size="lg"
          showTagline={true}
          animatedLine={true}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Palette.canvas,
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
