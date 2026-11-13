/**
 * src/context/community-context.tsx
 * ─────────────────────────────────────────────────────────────────
 * Supabase-backed Community Context.
 * Real-time club synchronization, member state, and leaderboard.
 * ─────────────────────────────────────────────────────────────────
 */
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import { CommunityClub, CommunityEvent } from '@/types/community';
import { INITIAL_EVENTS } from '@/constants/community-data';
import {
  fetchCommunityClubs,
  joinClubInDB,
  leaveClubInDB,
  subscribeToCommunity,
} from '@/services/community-service';
import { useAuth } from '@/context/auth-context';

export type CommunitySection = 'clubs' | 'leaderboard' | 'events';

interface CommunityContextType {
  activeSection: CommunitySection;
  setActiveSection: (section: CommunitySection) => void;
  clubs: CommunityClub[];
  myClubs: CommunityClub[];
  campusLeaderboard: CommunityClub[];
  isLoading: boolean;
  getClubById: (id: string) => CommunityClub | undefined;
  toggleJoinClub: (id: string) => Promise<void>;
  refreshCommunity: () => Promise<void>;
  events: CommunityEvent[];
  myEvents: CommunityEvent[];
  pastEvents: CommunityEvent[];
  getEventById: (id: string) => CommunityEvent | undefined;
  toggleRegisterEvent: (id: string) => void;
}

const CommunityContext = createContext<CommunityContextType | undefined>(undefined);

export function CommunityProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState<CommunitySection>('clubs');
  const [clubs, setClubs] = useState<CommunityClub[]>([]);
  const [myClubs, setMyClubs] = useState<CommunityClub[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [events, setEvents] = useState<CommunityEvent[]>(INITIAL_EVENTS);

  const loadClubs = useCallback(async () => {
    try {
      const data = await fetchCommunityClubs(user?.id);
      setClubs(data.clubs);
      setMyClubs(data.myClubs);
    } catch (err) {
      console.warn('[community-context] loadClubs error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadClubs();
  }, [loadClubs]);

  // Real-time updates on clubs, members, and posts
  useEffect(() => {
    const unsubscribe = subscribeToCommunity(() => {
      loadClubs();
    });
    return () => {
      unsubscribe();
    };
  }, [loadClubs]);

  const campusLeaderboard = useMemo(() => {
    return [...clubs].sort((a, b) => b.totalPoints - a.totalPoints);
  }, [clubs]);

  const getClubById = useCallback(
    (id: string): CommunityClub | undefined => {
      return clubs.find((c) => c.id === id);
    },
    [clubs]
  );

  const toggleJoinClub = async (id: string) => {
    const targetClub = clubs.find((c) => c.id === id);
    if (!targetClub) return;

    const willBeJoined = !targetClub.joined;

    // Optimistic UI update
    setClubs((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;
        return {
          ...c,
          joined: willBeJoined,
          memberCount: willBeJoined
            ? c.memberCount + 1
            : Math.max(0, c.memberCount - 1),
        };
      })
    );

    setMyClubs((prev) => {
      if (willBeJoined) {
        return [...prev, { ...targetClub, joined: true, memberCount: targetClub.memberCount + 1 }];
      } else {
        return prev.filter((c) => c.id !== id);
      }
    });

    if (user?.id) {
      if (willBeJoined) {
        await joinClubInDB(id, user.id);
      } else {
        await leaveClubInDB(id, user.id);
      }
    }

    await loadClubs();
  };

  const myEvents = useMemo(
    () => events.filter((e) => e.registered && e.status === 'upcoming'),
    [events]
  );

  const pastEvents = useMemo(
    () => events.filter((e) => e.status === 'past'),
    [events]
  );

  const getEventById = (id: string): CommunityEvent | undefined => {
    return events.find((e) => e.id === id);
  };

  const toggleRegisterEvent = (id: string) => {
    setEvents((prev) =>
      prev.map((e) => {
        if (e.id !== id) return e;
        const newRegistered = !e.registered;
        return {
          ...e,
          registered: newRegistered,
          participantCount: newRegistered
            ? e.participantCount + 1
            : Math.max(0, e.participantCount - 1),
        };
      })
    );
  };

  const value = useMemo(
    () => ({
      activeSection,
      setActiveSection,
      clubs,
      myClubs,
      campusLeaderboard,
      isLoading,
      getClubById,
      toggleJoinClub,
      refreshCommunity: loadClubs,
      events,
      myEvents,
      pastEvents,
      getEventById,
      toggleRegisterEvent,
    }),
    [
      activeSection,
      clubs,
      myClubs,
      campusLeaderboard,
      isLoading,
      getClubById,
      loadClubs,
      events,
      myEvents,
      pastEvents,
    ]
  );

  return (
    <CommunityContext.Provider value={value}>
      {children}
    </CommunityContext.Provider>
  );
}

export function useCommunity() {
  const context = useContext(CommunityContext);
  if (!context) {
    throw new Error('useCommunity must be used within a CommunityProvider');
  }
  return context;
}
