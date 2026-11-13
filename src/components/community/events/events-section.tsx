import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, ScrollView } from 'react-native';
import { Palette, Radius, Spacing, Typography, FontFamily } from '@/constants/theme';
import { AppIcon } from '@/components/ui/icon';
import { CommunityEvent, EventCategory, EventTab } from '@/types/community';
import { FeaturedEventCard } from './featured-event-card';
import { EventCard } from './event-card';
import { MyEvents } from './my-events';
import { PastEvents } from './past-events';
import { EmptyState } from '@/components/challenge/empty-state';

interface EventsSectionProps {
  events: CommunityEvent[];
  myEvents: CommunityEvent[];
  pastEvents: CommunityEvent[];
  onToggleRegister: (id: string) => void;
}

const EVENT_TABS: { key: EventTab; label: string }[] = [
  { key: 'discover', label: 'Discover' },
  { key: 'my_events', label: 'My Events' },
  { key: 'past_events', label: 'Past Events' },
];

const CATEGORIES: { key: EventCategory; label: string }[] = [
  { key: 'all', label: 'All Events' },
  { key: 'running', label: 'Running' },
  { key: 'cycling', label: 'Cycling' },
  { key: 'fitness', label: 'Fitness' },
  { key: 'sports', label: 'Sports' },
  { key: 'adventure', label: 'Adventure' },
];

export function EventsSection({
  events,
  myEvents,
  pastEvents,
  onToggleRegister,
}: EventsSectionProps) {
  const [activeTab, setActiveTab] = useState<EventTab>('discover');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<EventCategory>('all');

  const featuredEvent = useMemo(
    () => events.find((e) => e.featured) || events[0],
    [events]
  );

  const upcomingEvents = useMemo(() => {
    return events.filter((e) => {
      if (e.status !== 'upcoming') return false;

      // Search
      if (searchQuery.trim().length > 0) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = e.name.toLowerCase().includes(q);
        const matchesVenue = e.venue.toLowerCase().includes(q);
        const matchesOrg = e.organizer.toLowerCase().includes(q);
        if (!matchesName && !matchesVenue && !matchesOrg) return false;
      }

      // Category
      if (selectedCategory !== 'all' && e.category !== selectedCategory) {
        return false;
      }

      return true;
    });
  }, [events, searchQuery, selectedCategory]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerBlock}>
        <Text style={styles.title}>Campus Events</Text>
        <Text style={styles.subtitle}>
          Discover events. Take part. Make memories.
        </Text>
      </View>

      {/* Events Navigation: Discover | My Events | Past Events */}
      <View style={styles.tabBar}>
        {EVENT_TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <Pressable
              key={tab.key}
              onPress={() => setActiveTab(tab.key)}
              style={[styles.tabBtn, isActive && styles.tabBtnActive]}>
              <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                {tab.label}
                {tab.key === 'my_events' && myEvents.length > 0 && ` (${myEvents.length})`}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Content based on Tab */}
      {activeTab === 'discover' && (
        <>
          {/* Featured Event */}
          {featuredEvent && (
            <FeaturedEventCard
              event={featuredEvent}
              onToggleRegister={onToggleRegister}
            />
          )}

          {/* Search Bar */}
          <View style={styles.searchBar}>
            <AppIcon name="search-outline" size={17} color={Palette.muted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search events by name or venue..."
              placeholderTextColor={Palette.muted}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
                <AppIcon name="close-circle" size={16} color={Palette.muted} />
              </Pressable>
            )}
          </View>

          {/* Category Chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesScroll}>
            {CATEGORIES.map((cat) => {
              const isActive = selectedCategory === cat.key;
              return (
                <Pressable
                  key={cat.key}
                  onPress={() => setSelectedCategory(cat.key)}
                  style={[styles.catChip, isActive && styles.catChipActive]}>
                  <Text
                    style={[
                      styles.catChipText,
                      isActive && styles.catChipTextActive,
                    ]}>
                    {cat.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Upcoming Events Heading */}
          <View style={styles.sectionHeadingBlock}>
            <Text style={styles.sectionHeading}>Upcoming Events</Text>
            <Text style={styles.sectionSubtitle}>
              Official campus and club tournaments
            </Text>
          </View>

          {upcomingEvents.length > 0 ? (
            upcomingEvents.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                onToggleRegister={onToggleRegister}
              />
            ))
          ) : (
            <EmptyState
              iconName="calendar-outline"
              title="No Events Found"
              message="No upcoming events matched your filter. Try clearing your search."
              actionLabel="Reset Search"
              onAction={() => {
                setSearchQuery('');
                setSelectedCategory('all');
              }}
            />
          )}
        </>
      )}

      {activeTab === 'my_events' && (
        <MyEvents
          events={myEvents}
          onToggleRegister={onToggleRegister}
          onExploreEvents={() => setActiveTab('discover')}
        />
      )}

      {activeTab === 'past_events' && (
        <PastEvents events={pastEvents} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.space6,
  },
  headerBlock: {
    marginBottom: Spacing.space3,
  },
  title: {
    ...Typography.sectionHeading,
    color: Palette.ink,
    marginBottom: 2,
  },
  subtitle: {
    ...Typography.body,
    fontSize: 13,
    color: Palette.muted,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: Palette.surfaceSubtle,
    borderRadius: Radius.btn,
    padding: 3,
    marginBottom: Spacing.space4,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  tabBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: Radius.sm,
  },
  tabBtnActive: {
    backgroundColor: Palette.white,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    ...Typography.supporting,
    fontSize: 12.5,
    fontWeight: '500',
    fontFamily: FontFamily.medium,
    color: Palette.muted,
  },
  tabTextActive: {
    color: Palette.forest,
    fontWeight: '700',
    fontFamily: FontFamily.bold,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Palette.white,
    borderRadius: Radius.btn,
    borderWidth: 1,
    borderColor: Palette.border,
    paddingHorizontal: Spacing.space3,
    paddingVertical: 10,
    marginBottom: Spacing.space3,
  },
  searchInput: {
    flex: 1,
    ...Typography.body,
    fontSize: 13.5,
    color: Palette.ink,
    paddingVertical: 0,
  },
  categoriesScroll: {
    gap: 6,
    paddingBottom: Spacing.space3,
    marginBottom: Spacing.space2,
  },
  catChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
    backgroundColor: Palette.surfaceSubtle,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  catChipActive: {
    backgroundColor: Palette.lime,
    borderColor: Palette.lime,
  },
  catChipText: {
    ...Typography.supporting,
    fontSize: 11.5,
    fontWeight: '500',
    fontFamily: FontFamily.medium,
    color: Palette.ink,
  },
  catChipTextActive: {
    fontWeight: '700',
    fontFamily: FontFamily.bold,
  },
  sectionHeadingBlock: {
    marginBottom: Spacing.space3,
  },
  sectionHeading: {
    ...Typography.cardHeading,
    fontSize: 16,
    color: Palette.ink,
    marginBottom: 2,
  },
  sectionSubtitle: {
    ...Typography.supporting,
    fontSize: 12,
    color: Palette.muted,
  },
});
