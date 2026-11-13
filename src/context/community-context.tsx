import React, { createContext, useContext, useState, useMemo } from 'react';
import { CommunityClub, CommunityEvent } from '@/types/community';
import { INITIAL_CLUBS, INITIAL_EVENTS } from '@/constants/community-data';

export type CommunitySection = 'clubs' | 'leaderboard' | 'events';

interface CommunityContextType {
  activeSection: CommunitySection;
  setActiveSection: (section: CommunitySection) => void;
  clubs: CommunityClub[];
  myClubs: CommunityClub[];
  getClubById: (id: string) => CommunityClub | undefined;
  toggleJoinClub: (id: string) => void;
  events: CommunityEvent[];
  myEvents: CommunityEvent[];
  pastEvents: CommunityEvent[];
  getEventById: (id: string) => CommunityEvent | undefined;
  toggleRegisterEvent: (id: string) => void;
}

const CommunityContext = createContext<CommunityContextType | undefined>(undefined);

export function CommunityProvider({ children }: { children: React.ReactNode }) {
  const [activeSection, setActiveSection] = useState<CommunitySection>('clubs');
  const [clubs, setClubs] = useState<CommunityClub[]>(INITIAL_CLUBS);
  const [events, setEvents] = useState<CommunityEvent[]>(INITIAL_EVENTS);

  const myClubs = useMemo(() => clubs.filter((c) => c.joined), [clubs]);

  const myEvents = useMemo(
    () => events.filter((e) => e.registered && e.status === 'upcoming'),
    [events]
  );

  const pastEvents = useMemo(
    () => events.filter((e) => e.status === 'past'),
    [events]
  );

  const getClubById = (id: string): CommunityClub | undefined => {
    return clubs.find((c) => c.id === id);
  };

  const toggleJoinClub = (id: string) => {
    setClubs((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;
        const newJoined = !c.joined;
        return {
          ...c,
          joined: newJoined,
          memberCount: newJoined ? c.memberCount + 1 : Math.max(0, c.memberCount - 1),
        };
      })
    );
  };

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

  return (
    <CommunityContext.Provider
      value={{
        activeSection,
        setActiveSection,
        clubs,
        myClubs,
        getClubById,
        toggleJoinClub,
        events,
        myEvents,
        pastEvents,
        getEventById,
        toggleRegisterEvent,
      }}>
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
