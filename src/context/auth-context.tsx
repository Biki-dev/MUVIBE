/**
 * src/context/auth-context.tsx
 * ─────────────────────────────────────────────────────────────────
 * Authentication and onboarding. Supabase owns every account.
 *
 *   Guest   → supabase.auth.signInAnonymously(). A real Supabase user
 *             with no email or password, so the data is online and the
 *             same code paths work. It can be upgraded to a full account
 *             later with updateUser, keeping the same id and all data.
 *   Email   → signUp / signInWithPassword.
 *   Google  → OAuth through the system browser.
 *
 * There is no offline database. Reads fall back to a read-only JSON
 * snapshot, see lib/offline-cache.ts; writes need a connection.
 *
 * Onboarding preferences that are not part of the profile stay in
 * AsyncStorage, which is per-device by nature.
 * ─────────────────────────────────────────────────────────────────
 */
import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import type { Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { clearSnapshot } from '@/lib/offline-cache';
import { User, StudentProfile, OnboardingData } from '@/types/auth';

WebBrowser.maybeCompleteAuthSession();

const STORAGE_KEY_ONBOARDING = '@muvibe_onboarding_v1';
const STORAGE_KEY_INTRO = '@muvibe_intro_seen_v1';
const CLOUD_UNAVAILABLE =
  'This build has no Supabase keys. Add them to .env and restart the dev server.';

interface AuthResult {
  success: boolean;
  error?: string;
  /**
   * True when this account has already finished onboarding, so the
   * caller sends them Home instead of back through the six setup
   * steps. Read from the users row as part of signing in, because the
   * context state has not settled by the time the caller navigates.
   */
  onboardingDone?: boolean;
}

interface AuthContextType {
  user: User | null;
  profile: StudentProfile;
  selectedActivities: string[];
  locationEnabled: boolean;
  joinedClubIds: string[];
  notificationsEnabled: boolean;
  isOnboardingCompleted: boolean;
  isCheckingSession: boolean;
  hasValidSession: boolean;
  hasSeenIntro: boolean;
  isGuest: boolean;
  isCloudAvailable: boolean;

  continueAsGuest: () => Promise<AuthResult>;
  signInWithEmail: (email: string, pass: string) => Promise<AuthResult>;
  signUpWithEmail: (email: string, pass: string) => Promise<AuthResult>;
  signInWithGoogle: () => Promise<AuthResult>;
  /** Turns the current anonymous account into a real one, keeping its data. */
  upgradeGuestToEmail: (email: string, pass: string) => Promise<AuthResult>;
  markIntroSeen: () => Promise<void>;
  updateProfile: (updates: Partial<StudentProfile>) => Promise<void>;
  refreshProfile: () => Promise<void>;
  toggleActivity: (activityId: string) => void;
  setActivities: (activityIds: string[]) => void;
  setLocationPermission: (enabled: boolean) => Promise<void>;
  toggleClub: (clubId: string) => void;
  setNotifications: (enabled: boolean) => Promise<void>;
  completeOnboarding: () => Promise<void>;
  logout: () => Promise<void>;
  resetAll: () => Promise<void>;
  getNextOnboardingRoute: () => string;
}

const defaultProfile: StudentProfile = {
  fullName: '',
  username: '',
  college: 'Assam Engineering College (AEC)',
  department: 'Computer Science & Engineering',
  academicYear: '1st Year (Freshman)',
  avatarUrl: '',
  bio: '',
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/** Supabase marks anonymous users with the "anonymous" authenticator claim. */
function isAnonymousSession(session: Session): boolean {
  const user = session.user as unknown as { is_anonymous?: boolean };
  if (typeof user.is_anonymous === 'boolean') return user.is_anonymous;
  return !session.user.email;
}

function sessionToUser(session: Session): User {
  if (isAnonymousSession(session)) {
    return { id: session.user.id, email: '', name: 'Guest', provider: 'guest' };
  }
  const provider = session.user.app_metadata?.provider;
  return {
    id: session.user.id,
    email: session.user.email ?? '',
    name:
      session.user.user_metadata?.full_name ??
      session.user.user_metadata?.name ??
      session.user.email?.split('@')[0] ??
      '',
    provider: provider === 'google' ? 'google' : 'email',
  };
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfileState] = useState<StudentProfile>(defaultProfile);
  const [selectedActivities, setSelectedActivities] = useState<string[]>([]);
  const [locationEnabled, setLocationEnabledState] = useState(false);
  const [joinedClubIds, setJoinedClubIds] = useState<string[]>([]);
  const [notificationsEnabled, setNotificationsEnabledState] = useState(false);
  const [isOnboardingCompleted, setIsOnboardingCompleted] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [hasSeenIntro, setHasSeenIntro] = useState(false);

  /* ── preferences cache ────────────────────────────────────────── */

  const loadOnboardingCache = async () => {
    try {
      const json = await AsyncStorage.getItem(STORAGE_KEY_ONBOARDING);
      if (!json) return;
      const data: OnboardingData = JSON.parse(json);
      if (Array.isArray(data.selectedActivities)) setSelectedActivities(data.selectedActivities);
      if (typeof data.locationEnabled === 'boolean') setLocationEnabledState(data.locationEnabled);
      if (Array.isArray(data.joinedClubIds)) setJoinedClubIds(data.joinedClubIds);
      if (typeof data.notificationsEnabled === 'boolean') {
        setNotificationsEnabledState(data.notificationsEnabled);
      }
    } catch {
      // A bad cache only costs defaults.
    }
  };

  const persistOnboarding = async (patch: Partial<OnboardingData>) => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY_ONBOARDING);
      const current: OnboardingData = raw
        ? JSON.parse(raw)
        : {
            profile,
            selectedActivities,
            locationEnabled,
            joinedClubIds,
            notificationsEnabled,
            isCompleted: isOnboardingCompleted,
          };
      await AsyncStorage.setItem(
        STORAGE_KEY_ONBOARDING,
        JSON.stringify({ ...current, ...patch })
      );
    } catch (error) {
      console.warn('[auth] persistOnboarding failed:', error);
    }
  };

  /* ── profile ──────────────────────────────────────────────────── */

  const loadProfileFromDB = async (userId: string): Promise<boolean> => {
    const { data } = await supabase.from('users').select('*').eq('id', userId).maybeSingle();
    if (!data) return false;
    setProfileState((p) => ({
      ...p,
      fullName: data.full_name ?? '',
      username: data.username ?? '',
      college: data.college ?? defaultProfile.college,
      department: data.department ?? defaultProfile.department,
      academicYear: data.academic_year ?? defaultProfile.academicYear,
      avatarUrl: data.avatar_url ?? '',
      bio: data.bio ?? '',
    }));
    const done = data.onboarding_done === true;
    setIsOnboardingCompleted(done);
    return done;
  };

  /**
   * Every account needs a public.users row, including anonymous ones,
   * because clubs, challenges and leaderboards all join against it.
   */
  const ensureUserRow = async (session: Session) => {
    const anon = isAnonymousSession(session);
    const { error } = await supabase.from('users').insert({
      id: session.user.id,
      email: session.user.email ?? `${session.user.id}@guest.muvibe`,
      full_name: anon ? 'Guest' : (session.user.user_metadata?.full_name ?? null),
      onboarding_done: false,
    });
    // 23505 is a unique violation: the row already exists, which is normal.
    if (error && error.code !== '23505') {
      console.warn('[auth] ensureUserRow failed:', error.message);
    }
  };

  const applySession = async (session: Session): Promise<boolean> => {
    // Profile first: a consumer watching hasValidSession would
    // otherwise see a signed-in user whose onboarding flag is still
    // the default false, and bounce them into onboarding.
    const done = await loadProfileFromDB(session.user.id);
    setUser(sessionToUser(session));
    return done;
  };

  /* ── boot ─────────────────────────────────────────────────────── */

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const seen = await AsyncStorage.getItem(STORAGE_KEY_INTRO);
        if (!cancelled) setHasSeenIntro(seen === '1');

        if (isSupabaseConfigured) {
          const { data } = await supabase.auth.getSession();
          if (data.session && !cancelled) await applySession(data.session);
        }

        await loadOnboardingCache();
      } catch (error) {
        console.warn('[auth] session restore failed:', error);
      } finally {
        if (!cancelled) setTimeout(() => setIsCheckingSession(false), 350);
      }
    })();

    if (!isSupabaseConfigured) {
      return () => {
        cancelled = true;
      };
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session) await applySession(session);
      else setUser(null);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── intro ────────────────────────────────────────────────────── */

  const markIntroSeen = async () => {
    setHasSeenIntro(true);
    await AsyncStorage.setItem(STORAGE_KEY_INTRO, '1');
  };

  /* ── guest, as an anonymous Supabase user ─────────────────────── */

  const continueAsGuest = async (): Promise<AuthResult> => {
    if (!isSupabaseConfigured) return { success: false, error: CLOUD_UNAVAILABLE };

    try {
      const { data, error } = await supabase.auth.signInAnonymously();
      if (error) {
        // The most common cause is the toggle being off in the dashboard.
        return {
          success: false,
          error: error.message.toLowerCase().includes('disabled')
            ? 'Anonymous sign-in is turned off in Supabase. Enable it under Authentication, Providers.'
            : error.message,
        };
      }
      if (!data.session) return { success: false, error: 'Could not start a guest session.' };

      await ensureUserRow(data.session);
      const onboardingDone = await applySession(data.session);
      return { success: true, onboardingDone };
    } catch (error) {
      console.error('[auth] continueAsGuest failed:', error);
      return { success: false, error: 'Could not start a guest session.' };
    }
  };

  /* ── email ────────────────────────────────────────────────────── */

  const signUpWithEmail = async (email: string, pass: string): Promise<AuthResult> => {
    if (!isSupabaseConfigured) return { success: false, error: CLOUD_UNAVAILABLE };
    if (!email || !pass) return { success: false, error: 'Please fill in all fields.' };
    if (!isValidEmail(email)) return { success: false, error: 'That email does not look right.' };
    if (pass.length < 6) {
      return { success: false, error: 'Password should be at least 6 characters.' };
    }

    const { data, error } = await supabase.auth.signUp({ email, password: pass });
    if (error) return { success: false, error: error.message };
    if (!data.user) return { success: false, error: 'Sign-up failed. Try again.' };

    if (!data.session) {
      // Supabase returns a user with no session when the project
      // requires email confirmation. Treating that as signed in is
      // what later strands the app with no session at all.
      return {
        success: false,
        error: 'Check your inbox to confirm your email, then sign in.',
      };
    }

    await ensureUserRow(data.session);
    const onboardingDone = await applySession(data.session);
    return { success: true, onboardingDone };
  };

  const signInWithEmail = async (email: string, pass: string): Promise<AuthResult> => {
    if (!isSupabaseConfigured) return { success: false, error: CLOUD_UNAVAILABLE };
    if (!email || !pass) return { success: false, error: 'Please enter email and password.' };

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: pass,
    });
    if (error) return { success: false, error: error.message };
    if (!data.session) return { success: false, error: 'Sign-in failed. Try again.' };

    // Adopt the session now so the caller can route on a settled
    // answer. onAuthStateChange fires too, which is harmless: it
    // reloads the same row.
    const onboardingDone = await applySession(data.session);
    return { success: true, onboardingDone };
  };

  /**
   * Attaches an email and password to the current anonymous account.
   * The user id does not change, so everything already logged carries over.
   */
  const upgradeGuestToEmail = async (email: string, pass: string): Promise<AuthResult> => {
    if (!isSupabaseConfigured) return { success: false, error: CLOUD_UNAVAILABLE };
    if (!isValidEmail(email)) return { success: false, error: 'That email does not look right.' };
    if (pass.length < 6) {
      return { success: false, error: 'Password should be at least 6 characters.' };
    }

    const { error } = await supabase.auth.updateUser({ email, password: pass });
    if (error) return { success: false, error: error.message };

    if (user) await supabase.from('users').update({ email }).eq('id', user.id);
    return { success: true };
  };

  /* ── google ───────────────────────────────────────────────────── */

  const signInWithGoogle = async (): Promise<AuthResult> => {
    if (!isSupabaseConfigured) return { success: false, error: CLOUD_UNAVAILABLE };

    try {
      const redirectTo = Linking.createURL('/auth/callback');

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo, skipBrowserRedirect: true },
      });
      if (error || !data.url) {
        return { success: false, error: error?.message ?? 'Could not start Google sign-in.' };
      }

      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
      if (result.type !== 'success') {
        return { success: false, error: 'Google sign-in was cancelled.' };
      }

      const params = new URLSearchParams(result.url.split('#')[1] ?? result.url.split('?')[1]);
      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');
      if (!accessToken || !refreshToken) {
        return { success: false, error: 'Google sign-in did not return a session.' };
      }

      const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
      if (sessionError) return { success: false, error: sessionError.message };
      if (!sessionData.session) {
        return { success: false, error: 'Google sign-in did not return a session.' };
      }

      await ensureUserRow(sessionData.session);
      const onboardingDone = await applySession(sessionData.session);
      return { success: true, onboardingDone };
    } catch (error) {
      console.error('[auth] signInWithGoogle failed:', error);
      return { success: false, error: 'Google sign-in failed.' };
    }
  };

  /* ── profile writes ───────────────────────────────────────────── */

  const updateProfile = async (updates: Partial<StudentProfile>) => {
    const next = { ...profile, ...updates };
    setProfileState(next);
    await persistOnboarding({ profile: next });
    if (!user) return;

    try {
      await supabase.from('users').upsert({
        id: user.id,
        email: user.email || `${user.id}@guest.muvibe`,
        full_name: next.fullName,
        username: next.username,
        college: next.college,
        department: next.department,
        academic_year: next.academicYear,
        avatar_url: next.avatarUrl,
        bio: next.bio,
        updated_at: new Date().toISOString(),
      });
      setUser((prev) => (prev ? { ...prev, name: next.fullName || prev.name } : prev));
    } catch (error) {
      console.warn('[auth] updateProfile failed:', error);
    }
  };

  const refreshProfile = async () => {
    if (!user) return;
    try {
      await loadProfileFromDB(user.id);
    } catch (error) {
      console.warn('[auth] refreshProfile failed:', error);
    }
  };

  /* ── onboarding preferences ───────────────────────────────────── */

  const toggleActivity = (activityId: string) => {
    setSelectedActivities((prev) => {
      const next = prev.includes(activityId)
        ? prev.filter((id) => id !== activityId)
        : [...prev, activityId];
      persistOnboarding({ selectedActivities: next });
      return next;
    });
  };

  const setActivities = (activityIds: string[]) => {
    setSelectedActivities(activityIds);
    persistOnboarding({ selectedActivities: activityIds });
  };

  const setLocationPermission = async (enabled: boolean) => {
    setLocationEnabledState(enabled);
    await persistOnboarding({ locationEnabled: enabled });
  };

  const toggleClub = (clubId: string) => {
    setJoinedClubIds((prev) => {
      const next = prev.includes(clubId)
        ? prev.filter((id) => id !== clubId)
        : [...prev, clubId];
      persistOnboarding({ joinedClubIds: next });
      return next;
    });
  };

  const setNotifications = async (enabled: boolean) => {
    setNotificationsEnabledState(enabled);
    await persistOnboarding({ notificationsEnabled: enabled });
  };

  const completeOnboarding = async () => {
    setIsOnboardingCompleted(true);
    await persistOnboarding({ isCompleted: true });
    if (user) {
      await supabase.from('users').update({ onboarding_done: true }).eq('id', user.id);
    }
  };

  /* ── sign out and reset ───────────────────────────────────────── */

  const logout = async () => {
    // Signing out must not depend on reaching Supabase. The server
    // call was previously awaited bare, so a slow or failed request
    // left the caller hanging: the screen never navigated and the
    // session stayed on the device, which reads as a dead button.
    //
    // scope 'local' clears this device without waiting on the server,
    // and the race caps how long even that can take.
    if (isSupabaseConfigured) {
      try {
        await Promise.race([
          supabase.auth.signOut({ scope: 'local' }),
          new Promise((resolve) => setTimeout(resolve, 3000)),
        ]);
      } catch (error) {
        console.warn('[auth] signOut failed, clearing locally anyway:', error);
      }
    }
    await clearSnapshot();
    setUser(null);
    setProfileState(defaultProfile);
    setIsOnboardingCompleted(false);
  };

  const resetAll = async () => {
    if (isSupabaseConfigured) await supabase.auth.signOut();
    await clearSnapshot();
    await AsyncStorage.multiRemove([STORAGE_KEY_ONBOARDING, STORAGE_KEY_INTRO]);
    setUser(null);
    setProfileState(defaultProfile);
    setSelectedActivities([]);
    setLocationEnabledState(false);
    setJoinedClubIds([]);
    setNotificationsEnabledState(false);
    setIsOnboardingCompleted(false);
    setHasSeenIntro(false);
  };

  const getNextOnboardingRoute = (): string => {
    if (!profile.fullName || !profile.username || !profile.college) {
      return '/onboarding/profile';
    }
    if (selectedActivities.length === 0) {
      return '/onboarding/activities';
    }
    return '/onboarding/clubs';
  };

  const value = useMemo(
    () => ({
      user,
      profile,
      selectedActivities,
      locationEnabled,
      joinedClubIds,
      notificationsEnabled,
      isOnboardingCompleted,
      isCheckingSession,
      hasValidSession: Boolean(user),
      hasSeenIntro,
      isGuest: user?.provider === 'guest',
      isCloudAvailable: isSupabaseConfigured,
      continueAsGuest,
      signInWithEmail,
      signUpWithEmail,
      signInWithGoogle,
      upgradeGuestToEmail,
      markIntroSeen,
      updateProfile,
      refreshProfile,
      toggleActivity,
      setActivities,
      setLocationPermission,
      toggleClub,
      setNotifications,
      completeOnboarding,
      logout,
      resetAll,
      getNextOnboardingRoute,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      user,
      profile,
      selectedActivities,
      locationEnabled,
      joinedClubIds,
      notificationsEnabled,
      isOnboardingCompleted,
      isCheckingSession,
      hasSeenIntro,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
