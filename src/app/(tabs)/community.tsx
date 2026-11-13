import React, { useRef } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Palette, Spacing } from '@/constants/theme';
import { useCommunity } from '@/context/community-context';
import { CommunityHeader } from '@/components/community/community-header';
import { CommunitySectionSelector } from '@/components/community/community-section-selector';
import { MyClubs } from '@/components/community/clubs/my-clubs';
import { DiscoverClubs } from '@/components/community/clubs/discover-clubs';
import { LeaderboardSection } from '@/components/community/leaderboard/leaderboard-section';
import { EventsSection } from '@/components/community/events/events-section';

export default function CommunityScreen() {
  const {
    activeSection,
    setActiveSection,
    clubs,
    myClubs,
    toggleJoinClub,
    events,
    myEvents,
    pastEvents,
    toggleRegisterEvent,
  } = useCommunity();

  const scrollRef = useRef<any>(null);

  const handleExploreClubs = () => {
    // Scroll down to Discover Clubs area
    scrollRef.current?.scrollTo({ y: 240, animated: true });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Section 1 — Page Header */}
        <CommunityHeader />

        {/* Section 2 — Community Navigation: Clubs | Leaderboard | Events */}
        <CommunitySectionSelector
          activeSection={activeSection}
          onSelectSection={setActiveSection}
        />

        {/* Section 3 — Clubs */}
        {activeSection === 'clubs' && (
          <>
            <MyClubs
              clubs={myClubs}
              onToggleJoin={toggleJoinClub}
              onExploreClubs={handleExploreClubs}
            />
            <DiscoverClubs
              clubs={clubs}
              onToggleJoin={toggleJoinClub}
            />
          </>
        )}

        {/* Section 4 — Leaderboard */}
        {activeSection === 'leaderboard' && <LeaderboardSection />}

        {/* Section 5 — Events */}
        {activeSection === 'events' && (
          <EventsSection
            events={events}
            myEvents={myEvents}
            pastEvents={pastEvents}
            onToggleRegister={toggleRegisterEvent}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Palette.canvas,
  },
  scrollContent: {
    paddingHorizontal: Spacing.space4,
    paddingTop: Spacing.space2,
    paddingBottom: Spacing.space8,
    maxWidth: 600,
    width: '100%',
    alignSelf: 'center',
  },
});
