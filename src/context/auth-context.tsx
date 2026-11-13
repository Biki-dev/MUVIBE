/**
 * src/context/auth-context.tsx
 * ─────────────────────────────────────────────────────────────────
 * Authentication & onboarding context backed by Supabase Auth.
 *
 * What it does
 * ─────────────────────────────────────────────────────────────────
 * • Listens to Supabase auth state changes (onAuthStateChange).
 * • signUpWithEmail  → creates Supabase auth user + inserts a row
 *                      into public.users with the user's id/email.
 * • signInWithEmail  → Supabase email/password sign-in.
 * • logout           → Supabase sign-out + clears local state.
 * • updateProfile    → upserts the public.users row + persists
 *                      onboarding data in AsyncStorage for fast
 *                      offline reads.
 * • Google sign-in is intentionally left as a stub — will be
 *   wired up in a future session.
 * ─────────────────────────────────────────────────────────────────
 */
import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { clearAllActivities } from '@/services/activity-storage';
import { User, StudentProfile, OnboardingData } from '@/types/auth';

// ── Storage keys ──────────────────────────────────────────────────
const STORAGE_KEY_ONBOARDING = '@muvibe_onboarding_v1';

// ── Types ─────────────────────────────────────────────────────────
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

  signInWithEmail: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  signUpWithEmail: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  signInWithGoogle: () => Promise<{ success: boolean; error?: string }>;
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

// ── Defaults ──────────────────────────────────────────────────────
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

// ── Helper: map Supabase session → our User type ──────────────────
function sessionToUser(session: Session): User {
  return {
    id: session.user.id,
    email: session.user.email ?? '',
    name: session.user.user_metadata?.full_name ?? session.user.email?.split('@')[0] ?? '',
    provider: (session.user.app_metadata?.provider as 'email' | 'google') ?? 'email',
  };
}

// ── Provider ──────────────────────────────────────────────────────
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfileState] = useState<StudentProfile>(defaultProfile);
  const [selectedActivities, setSelectedActivities] = useState<string[]>([]);
  const [locationEnabled, setLocationEnabledState] = useState<boolean>(false);
  const [joinedClubIds, setJoinedClubIds] = useState<string[]>([]);
  const [notificationsEnabled, setNotificationsEnabledState] = useState<boolean>(false);
  const [isOnboardingCompleted, setIsOnboardingCompleted] = useState<boolean>(false);
  const [isCheckingSession, setIsCheckingSession] = useState<boolean>(true);

  // ── Load cached onboarding data from AsyncStorage ───────────────
  const loadOnboardingCache = async () => {
    try {
      const json = await AsyncStorage.getItem(STORAGE_KEY_ONBOARDING);
      if (!json) return;
      const data: OnboardingData = JSON.parse(json);
      if (data.profile) setProfileState((p) => ({ ...p, ...data.profile }));
      if (Array.isArray(data.selectedActivities)) setSelectedActivities(data.selectedActivities);
      if (typeof data.locationEnabled === 'boolean') setLocationEnabledState(data.locationEnabled);
      if (Array.isArray(data.joinedClubIds)) setJoinedClubIds(data.joinedClubIds);
      if (typeof data.notificationsEnabled === 'boolean')
        setNotificationsEnabledState(data.notificationsEnabled);
      if (typeof data.isCompleted === 'boolean') setIsOnboardingCompleted(data.isCompleted);
    } catch {
      // safe to ignore — data will re-sync from Supabase on next write
    }
  };

  // ── Load profile from Supabase public.users ─────────────────────
  const loadProfileFromDB = async (userId: string) => {
    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (data) {
      const dbProfile: Partial<StudentProfile> = {
        fullName: data.full_name ?? '',
        username: data.username ?? '',
        college: data.college ?? defaultProfile.college,
        department: data.department ?? defaultProfile.department,
        academicYear: data.academic_year ?? defaultProfile.academicYear,
        avatarUrl: data.avatar_url ?? '',
        bio: data.bio ?? '',
      };
      setProfileState((p) => ({ ...p, ...dbProfile }));
      if (typeof data.onboarding_done === 'boolean') {
        setIsOnboardingCompleted(data.onboarding_done);
      }
    }
  };

  // ── Bootstrap: listen to Supabase auth changes ──────────────────
  useEffect(() => {
    // Initial session fetch
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        const u = sessionToUser(session);
        setUser(u);
        await Promise.all([loadOnboardingCache(), loadProfileFromDB(u.id)]);
      } else {
        await loadOnboardingCache();
      }
      setTimeout(() => setIsCheckingSession(false), 350);
    });

    // Subscribe to future changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session) {
          const u = sessionToUser(session);
          setUser(u);
          await loadProfileFromDB(u.id);
        } else {
          setUser(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // ── Persist onboarding data locally ─────────────────────────────
  const persistOnboarding = async (patch: Partial<OnboardingData>) => {
    try {
      const existing = await AsyncStorage.getItem(STORAGE_KEY_ONBOARDING);
      const current: OnboardingData = existing
        ? JSON.parse(existing)
        : {
            profile,
            selectedActivities,
            locationEnabled,
            joinedClubIds,
            notificationsEnabled,
            isCompleted: isOnboardingCompleted,
          };
      const merged = { ...current, ...patch };
      await AsyncStorage.setItem(STORAGE_KEY_ONBOARDING, JSON.stringify(merged));
    } catch {
      // non-fatal
    }
  };

  // ── Auth actions ─────────────────────────────────────────────────
  const signUpWithEmail = async (email: string, pass: string) => {
    if (!email || !pass) return { success: false, error: 'Please fill in all fields.' };

    const { data, error } = await supabase.auth.signUp({ email, password: pass });
    if (error) return { success: false, error: error.message };
    if (!data.user) return { success: false, error: 'Sign-up failed. Try again.' };

    // Insert initial user row into public.users
    const { error: insertError } = await supabase.from('users').insert({
      id: data.user.id,
      email: data.user.email ?? email,
      onboarding_done: false,
    });

    if (insertError && insertError.code !== '23505') {
      // 23505 = unique violation (user row already exists — harmless on retry)
      console.warn('[Supabase] users insert error:', insertError.message);
    }

    return { success: true };
  };

  const signInWithEmail = async (email: string, pass: string) => {
    if (!email || !pass) return { success: false, error: 'Please enter email and password.' };

    const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
    if (error) return { success: false, error: error.message };
    return { success: true };
  };

  const signInWithGoogle = async () => {
    // Google OAuth will be wired up in a future session using expo-auth-session.
    return { success: false, error: 'Google sign-in is coming soon.' };
  };

  // ── Profile actions ──────────────────────────────────────────────
  const updateProfile = async (updates: Partial<StudentProfile>) => {
    const updated = { ...profile, ...updates };
    setProfileState(updated);
    await persistOnboarding({ profile: updated });

    // Sync to Supabase if logged in
    if (user) {
      await supabase.from('users').upsert({
        id: user.id,
        email: user.email,
        full_name: updated.fullName,
        username: updated.username,
        college: updated.college,
        department: updated.department,
        academic_year: updated.academicYear,
        avatar_url: updated.avatarUrl,
        bio: updated.bio,
        updated_at: new Date().toISOString(),
      });
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await loadProfileFromDB(user.id);
    }
  };

  const toggleActivity = (actId: string) => {
    setSelectedActivities((prev) => {
      const next = prev.includes(actId) ? prev.filter((id) => id !== actId) : [...prev, actId];
      persistOnboarding({ selectedActivities: next });
      return next;
    });
  };

  const setActivities = (ids: string[]) => {
    setSelectedActivities(ids);
    persistOnboarding({ selectedActivities: ids });
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

    // Mark in DB
    if (user) {
      await supabase.from('users').upsert({ id: user.id, email: user.email, onboarding_done: true });
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfileState(defaultProfile);
    setIsOnboardingCompleted(false);
    await clearAllActivities();
    // Keep onboarding cache but mark as not completed so re-login re-runs onboarding check
    await persistOnboarding({ isCompleted: false });
  };

  const resetAll = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfileState(defaultProfile);
    setSelectedActivities([]);
    setLocationEnabledState(false);
    setJoinedClubIds([]);
    setNotificationsEnabledState(false);
    setIsOnboardingCompleted(false);
    await clearAllActivities();
    await AsyncStorage.removeItem(STORAGE_KEY_ONBOARDING);
  };

  const getNextOnboardingRoute = (): string => {
    if (!profile.fullName || !profile.username || !profile.college) return '/onboarding/profile';
    if (selectedActivities.length === 0) return '/onboarding/activities';
    return '/onboarding/clubs';
  };

  // ── Context value ─────────────────────────────────────────────────
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
      hasValidSession: !!user,
      signInWithEmail,
      signUpWithEmail,
      signInWithGoogle,
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
    [
      user,
      profile,
      selectedActivities,
      locationEnabled,
      joinedClubIds,
      notificationsEnabled,
      isOnboardingCompleted,
      isCheckingSession,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
