import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, StudentProfile, OnboardingData } from '@/types/auth';

const STORAGE_KEY_USER = '@fitconnect_user_v1';
const STORAGE_KEY_ONBOARDING = '@fitconnect_onboarding_v1';

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

  // Actions
  signInWithEmail: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  signUpWithEmail: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  signInWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  updateProfile: (updates: Partial<StudentProfile>) => Promise<void>;
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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfileState] = useState<StudentProfile>(defaultProfile);
  const [selectedActivities, setSelectedActivities] = useState<string[]>([]);
  const [locationEnabled, setLocationEnabledState] = useState<boolean>(false);
  const [joinedClubIds, setJoinedClubIds] = useState<string[]>([]);
  const [notificationsEnabled, setNotificationsEnabledState] = useState<boolean>(false);
  const [isOnboardingCompleted, setIsOnboardingCompleted] = useState<boolean>(false);
  const [isCheckingSession, setIsCheckingSession] = useState<boolean>(true);

  // Initialize and check existing session
  useEffect(() => {
    async function loadSession() {
      try {
        const [storedUserJson, storedOnboardingJson] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEY_USER),
          AsyncStorage.getItem(STORAGE_KEY_ONBOARDING),
        ]);

        if (storedUserJson) {
          const parsedUser: User = JSON.parse(storedUserJson);
          setUser(parsedUser);
        }

        if (storedOnboardingJson) {
          const parsedOnboarding: OnboardingData = JSON.parse(storedOnboardingJson);
          if (parsedOnboarding.profile) {
            setProfileState((prev) => ({ ...prev, ...parsedOnboarding.profile }));
          }
          if (Array.isArray(parsedOnboarding.selectedActivities)) {
            setSelectedActivities(parsedOnboarding.selectedActivities);
          }
          if (typeof parsedOnboarding.locationEnabled === 'boolean') {
            setLocationEnabledState(parsedOnboarding.locationEnabled);
          }
          if (Array.isArray(parsedOnboarding.joinedClubIds)) {
            setJoinedClubIds(parsedOnboarding.joinedClubIds);
          }
          if (typeof parsedOnboarding.notificationsEnabled === 'boolean') {
            setNotificationsEnabledState(parsedOnboarding.notificationsEnabled);
          }
          if (typeof parsedOnboarding.isCompleted === 'boolean') {
            setIsOnboardingCompleted(parsedOnboarding.isCompleted);
          }
        }
      } catch (err) {
        console.warn('Failed to restore session from storage:', err);
      } finally {
        // Minimum natural pause to feel responsive without jarring flash
        setTimeout(() => {
          setIsCheckingSession(false);
        }, 450);
      }
    }

    loadSession();
  }, []);

  const persistOnboarding = async (newData: Partial<OnboardingData>) => {
    try {
      const currentRaw = await AsyncStorage.getItem(STORAGE_KEY_ONBOARDING);
      const current: OnboardingData = currentRaw
        ? JSON.parse(currentRaw)
        : {
            profile,
            selectedActivities,
            locationEnabled,
            joinedClubIds,
            notificationsEnabled,
            isCompleted: isOnboardingCompleted,
          };

      const merged: OnboardingData = {
        ...current,
        ...newData,
        profile: newData.profile ? { ...current.profile, ...newData.profile } : current.profile,
      };

      await AsyncStorage.setItem(STORAGE_KEY_ONBOARDING, JSON.stringify(merged));
    } catch (err) {
      console.warn('Error saving onboarding data:', err);
    }
  };

  const signInWithEmail = async (email: string, pass: string) => {
    if (!email || !pass) {
      return { success: false, error: 'Please enter both email and password.' };
    }
    const mockUser: User = {
      id: 'usr_' + Date.now().toString(36),
      email,
      name: email.split('@')[0],
      provider: 'email',
    };
    setUser(mockUser);
    await AsyncStorage.setItem(STORAGE_KEY_USER, JSON.stringify(mockUser));
    return { success: true };
  };

  const signUpWithEmail = async (email: string, pass: string) => {
    if (!email || !pass) {
      return { success: false, error: 'Please enter all required fields.' };
    }
    const mockUser: User = {
      id: 'usr_' + Date.now().toString(36),
      email,
      name: email.split('@')[0],
      provider: 'email',
    };
    setUser(mockUser);
    await AsyncStorage.setItem(STORAGE_KEY_USER, JSON.stringify(mockUser));
    return { success: true };
  };

  const signInWithGoogle = async () => {
    // Simulated Google SSO identity return
    const mockUser: User = {
      id: 'usr_g_' + Math.random().toString(36).substring(2, 9),
      email: 'student.athlete@aec.ac.in',
      name: 'Arup Sarma',
      provider: 'google',
    };
    setUser(mockUser);
    // Google provides the identity and email; onboarding still collects campus info
    setProfileState((prev) => ({
      ...prev,
      fullName: prev.fullName || 'Arup Sarma',
      username: prev.username || 'arups',
    }));
    await AsyncStorage.setItem(STORAGE_KEY_USER, JSON.stringify(mockUser));
    await persistOnboarding({
      profile: {
        fullName: profile.fullName || 'Arup Sarma',
        username: profile.username || 'arups',
      },
    });
    return { success: true };
  };

  const updateProfile = async (updates: Partial<StudentProfile>) => {
    const updated = { ...profile, ...updates };
    setProfileState(updated);
    await persistOnboarding({ profile: updated });
  };

  const toggleActivity = (actId: string) => {
    setSelectedActivities((prev) => {
      const next = prev.includes(actId) ? prev.filter((id) => id !== actId) : [...prev, actId];
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
      const next = prev.includes(clubId) ? prev.filter((id) => id !== clubId) : [...prev, clubId];
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
  };

  const logout = async () => {
    setUser(null);
    setIsOnboardingCompleted(false);
    await AsyncStorage.removeItem(STORAGE_KEY_USER);
  };

  const resetAll = async () => {
    setUser(null);
    setProfileState(defaultProfile);
    setSelectedActivities([]);
    setLocationEnabledState(false);
    setJoinedClubIds([]);
    setNotificationsEnabledState(false);
    setIsOnboardingCompleted(false);
    await AsyncStorage.multiRemove([STORAGE_KEY_USER, STORAGE_KEY_ONBOARDING]);
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
      hasValidSession: !!user,
      signInWithEmail,
      signUpWithEmail,
      signInWithGoogle,
      updateProfile,
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
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
