import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '@/context/auth-context';
import { ChallengeProvider } from '@/context/challenge-context';
import { CommunityProvider } from '@/context/community-context';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  // SF Pro Display. The splash stays up until the cuts are ready so the
  // first frame never flashes the system font.
  const [fontsLoaded, fontError] = useFonts({
    'SFProDisplay-Regular': require('../../assets/fonts/SFProDisplay-Regular.otf'),
    'SFProDisplay-Medium': require('../../assets/fonts/SFProDisplay-Medium.otf'),
    'SFProDisplay-Bold': require('../../assets/fonts/SFProDisplay-Bold.otf'),
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    // SafeAreaProvider must wrap everything: useSafeAreaInsets throws
    // without it, and the tab bar needs the bottom inset to clear the
    // Android navigation bar. Screens using SafeAreaView rely on it too.
    <SafeAreaProvider>
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
              <Stack.Screen name="intro" options={{ animation: 'fade' }} />
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
    </SafeAreaProvider>
  );
}
