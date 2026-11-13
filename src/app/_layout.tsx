import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { AuthProvider } from '@/context/auth-context';
import { ChallengeProvider } from '@/context/challenge-context';
import { CommunityProvider } from '@/context/community-context';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useEffect(() => {
    // Hide native splash screen once root layout mounts so FitConnect Screen 01 displays
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  return (
    <AuthProvider>
      <ChallengeProvider>
        <CommunityProvider>
          <StatusBar style="dark" />
          <Stack
            screenOptions={{
              headerShown: false,
              animation: 'fade',
              contentStyle: { backgroundColor: '#F5F7F2' },
            }}>
            <Stack.Screen name="index" options={{ animation: 'none' }} />
            <Stack.Screen name="auth/index" options={{ animation: 'fade' }} />
            <Stack.Screen name="onboarding" options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
            <Stack.Screen name="challenge" options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="club" options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="event" options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="profile" options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="settings" options={{ animation: 'slide_from_right' }} />
          </Stack>
        </CommunityProvider>
      </ChallengeProvider>
    </AuthProvider>
  );
}
