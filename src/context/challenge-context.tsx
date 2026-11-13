import React, { createContext, useContext, useState, useMemo } from 'react';
import { Challenge } from '@/types/challenge';
import { INITIAL_CHALLENGES } from '@/constants/challenge-data';

interface ChallengeContextType {
  challenges: Challenge[];
  activeChallenges: Challenge[];
  completedChallenges: Challenge[];
  getChallengeById: (id: string) => Challenge | undefined;
  joinChallenge: (id: string) => void;
  leaveChallenge: (id: string) => void;
}

const ChallengeContext = createContext<ChallengeContextType | undefined>(undefined);

export function ChallengeProvider({ children }: { children: React.ReactNode }) {
  const [challenges, setChallenges] = useState<Challenge[]>(INITIAL_CHALLENGES);

  const activeChallenges = useMemo(
    () => challenges.filter((c) => c.status === 'active'),
    [challenges]
  );

  const completedChallenges = useMemo(
    () => challenges.filter((c) => c.status === 'completed'),
    [challenges]
  );

  const getChallengeById = (id: string): Challenge | undefined => {
    return challenges.find((c) => c.id === id);
  };

  const joinChallenge = (id: string) => {
    setChallenges((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;
        if (c.status === 'active') return c; // Already joined
        return {
          ...c,
          status: 'active',
          participantsCount: c.participantsCount + 1,
          progress: c.progress > 0 ? c.progress : 0,
        };
      })
    );
  };

  const leaveChallenge = (id: string) => {
    setChallenges((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;
        if (c.status !== 'active') return c;
        return {
          ...c,
          status: 'not_joined',
          participantsCount: Math.max(0, c.participantsCount - 1),
        };
      })
    );
  };

  return (
    <ChallengeContext.Provider
      value={{
        challenges,
        activeChallenges,
        completedChallenges,
        getChallengeById,
        joinChallenge,
        leaveChallenge,
      }}>
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
