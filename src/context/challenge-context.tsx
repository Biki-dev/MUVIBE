/**
 * src/context/challenge-context.tsx
 * ─────────────────────────────────────────────────────────────────
 * Supabase-backed Challenges Context.
 * Real-time updates, participant counts, and progress tracking.
 * ─────────────────────────────────────────────────────────────────
 */
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { Challenge } from '@/types/challenge';
import { INITIAL_CHALLENGES } from '@/constants/challenge-data';
import {
  fetchAllChallenges,
  joinChallengeInDB,
  leaveChallengeInDB,
  subscribeToChallenges,
} from '@/services/challenge-service';
import { useAuth } from '@/context/auth-context';

interface ChallengeContextType {
  challenges: Challenge[];
  activeChallenges: Challenge[];
  completedChallenges: Challenge[];
  isLoading: boolean;
  getChallengeById: (id: string) => Challenge | undefined;
  joinChallenge: (id: string) => Promise<void>;
  leaveChallenge: (id: string) => Promise<void>;
  refreshChallenges: () => Promise<void>;
}

const ChallengeContext = createContext<ChallengeContextType | undefined>(undefined);

export function ChallengeProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [challenges, setChallenges] = useState<Challenge[]>(INITIAL_CHALLENGES);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const loadChallenges = useCallback(async () => {
    try {
      const data = await fetchAllChallenges(user?.id);
      setChallenges(data);
    } catch (err) {
      console.warn('[challenge-context] loadChallenges error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  // Initial fetch and on auth user change
  useEffect(() => {
    loadChallenges();
  }, [loadChallenges]);

  // Real-time subscription to Supabase challenge_participants & challenges
  useEffect(() => {
    const unsubscribe = subscribeToChallenges(() => {
      loadChallenges();
    });
    return () => {
      unsubscribe();
    };
  }, [loadChallenges]);

  const activeChallenges = useMemo(
    () => challenges.filter((c) => c.status === 'active'),
    [challenges]
  );

  const completedChallenges = useMemo(
    () => challenges.filter((c) => c.status === 'completed'),
    [challenges]
  );

  const getChallengeById = useCallback(
    (id: string): Challenge | undefined => {
      return challenges.find((c) => c.id === id);
    },
    [challenges]
  );

  const joinChallenge = async (id: string) => {
    // Optimistic UI update
    setChallenges((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;
        if (c.status === 'active') return c;
        return {
          ...c,
          status: 'active',
          participantsCount: c.participantsCount + 1,
        };
      })
    );

    if (user?.id) {
      await joinChallengeInDB(id, user.id);
    }
    // Refresh to calculate accurate progress based on user's activities
    await loadChallenges();
  };

  const leaveChallenge = async (id: string) => {
    // Optimistic UI update
    setChallenges((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;
        return {
          ...c,
          status: 'not_joined',
          progress: 0,
          participantsCount: Math.max(0, c.participantsCount - 1),
        };
      })
    );

    if (user?.id) {
      await leaveChallengeInDB(id, user.id);
    }
    await loadChallenges();
  };

  const value = useMemo(
    () => ({
      challenges,
      activeChallenges,
      completedChallenges,
      isLoading,
      getChallengeById,
      joinChallenge,
      leaveChallenge,
      refreshChallenges: loadChallenges,
    }),
    [challenges, activeChallenges, completedChallenges, isLoading, getChallengeById, loadChallenges]
  );

  return (
    <ChallengeContext.Provider value={value}>
      {children}
    </ChallengeContext.Provider>
  );
}

export function useChallenges() {
  const context = useContext(ChallengeContext);
  if (!context) {
    throw new Error('useChallenges must be used within a ChallengeProvider');
  }
  return context;
}
