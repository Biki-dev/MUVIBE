import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Palette, Radius, Spacing, Typography, FontFamily } from '@/constants/theme';
import { ProgressHeader } from '@/components/onboarding/progress-header';
import { ClubCard } from '@/components/onboarding/club-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AppIcon } from '@/components/ui/icon';
import { useAuth } from '@/context/auth-context';
import { SEEDED_CLUBS, CLUB_CATEGORIES } from '@/constants/mock-data';
import { Club, ClubCategory } from '@/types/club';

export default function SelectClubsScreen() {
  const router = useRouter();
  const { profile, locationEnabled, joinedClubIds, toggleClub } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ClubCategory | 'All'>('All');
  const [onlyNearby, setOnlyNearby] = useState(false);
  const [selectedClubForDetails, setSelectedClubForDetails] = useState<Club | null>(null);

  // Filter logic
  const filteredClubs = useMemo(() => {
    return SEEDED_CLUBS.filter((club) => {
      // 1. Search Query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = club.name.toLowerCase().includes(query);
        const matchesDesc = club.shortDescription.toLowerCase().includes(query);
        const matchesCategory = club.category.toLowerCase().includes(query);
        if (!matchesName && !matchesDesc && !matchesCategory) return false;
      }

      // 2. Category Filter
      if (selectedCategory !== 'All' && club.category !== selectedCategory) {
        return false;
      }

      // 3. Nearby Filter (when toggled)
      if (onlyNearby && !club.isNearby) {
        return false;
      }

      return true;
    });
  }, [searchQuery, selectedCategory, onlyNearby]);

  const handleContinue = () => {
    router.push('/onboarding/customize');
  };

  const handleSkip = () => {
    router.push('/onboarding/customize');
  };

  const joinedCount = joinedClubIds.length;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ProgressHeader
        currentStep={4}
        totalSteps={6}
        showBack={true}
        canSkip={true}
        onSkip={handleSkip}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        {/* Top section: College badge & Header */}
        <View style={styles.headerBlock}>
          <View style={styles.collegeBadgeRow}>
            <View style={styles.collegePill}>
              <AppIcon name="school" size={13} color={Palette.forest} />
              <Text style={styles.collegePillText} numberOfLines={1}>
                {profile.college || 'Assam Engineering College (AEC)'}
              </Text>
            </View>
            {joinedCount > 0 && (
              <Badge
                label={`${joinedCount} Joined`}
                variant="lime"
                icon={<AppIcon name="checkmark-circle" size={12} color={Palette.ink} />}
              />
            )}
          </View>

          <Text style={styles.title}>Select your college clubs</Text>
          <Text style={styles.subtitle}>
            Connect with campus fitness culture. Join student clubs to participate in events and challenges.
          </Text>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <AppIcon name="search-outline" size={18} color={Palette.muted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search clubs, sports, communities..."
            placeholderTextColor={Palette.muted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            clearButtonMode="while-editing"
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
              <AppIcon name="close-circle" size={16} color={Palette.muted} />
            </Pressable>
          )}
        </View>

        {/* Filters Row: Categories & Nearby Toggle */}
        <View style={styles.filterSection}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryScroll}>
            {/* Nearby clubs filter (only when location enabled or user toggle) */}
            {locationEnabled && (
              <Pressable
                onPress={() => setOnlyNearby((prev) => !prev)}
                style={[
                  styles.filterChip,
                  onlyNearby && styles.filterChipNearbyActive,
                ]}>
                <AppIcon
                  name="navigate"
                  size={13}
                  color={onlyNearby ? Palette.forest : Palette.ink}
                />
                <Text
                  style={[
                    styles.filterChipText,
                    onlyNearby && styles.filterChipTextNearbyActive,
                  ]}>
                  Nearby
                </Text>
              </Pressable>
            )}

            {CLUB_CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat;
              return (
                <Pressable
                  key={cat}
                  onPress={() => setSelectedCategory(cat)}
                  style={[
                    styles.filterChip,
                    isSelected && styles.filterChipActive,
                  ]}>
                  <Text
                    style={[
                      styles.filterChipText,
                      isSelected && styles.filterChipTextActive,
                    ]}>
                    {cat}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* Club List */}
        <View style={styles.clubList}>
          {filteredClubs.length > 0 ? (
            filteredClubs.map((club) => {
              const isJoined = joinedClubIds.includes(club.id);
              return (
                <ClubCard
                  key={club.id}
                  club={club}
                  isJoined={isJoined}
                  onToggleJoin={toggleClub}
                  onPressDetails={(c) => setSelectedClubForDetails(c)}
                />
              );
            })
          ) : (
            <View style={styles.emptyState}>
              <AppIcon name="search" size={32} color={Palette.muted} />
              <Text style={styles.emptyTitle}>No matching clubs found</Text>
              <Text style={styles.emptySubtitle}>
                Try adjusting your search query or reset the category filters.
              </Text>
              <Button
                label="Reset Filters"
                variant="outline"
                size="sm"
                fullWidth={false}
                onPress={() => {
                  setSearchQuery('');
                  setSelectedCategory('All');
                  setOnlyNearby(false);
                }}
                style={styles.resetButton}
              />
            </View>
          )}
        </View>

        {/* Bottom Actions */}
        <View style={styles.bottomBar}>
          <Button
            label={
              joinedCount > 0
                ? `Continue with ${joinedCount} ${joinedCount === 1 ? 'club' : 'clubs'} joined`
                : 'Continue'
            }
            variant="primary"
            size="lg"
            onPress={handleContinue}
            icon={<AppIcon name="arrow-forward" size={18} color={Palette.ink} />}
            iconPosition="right"
          />

          <Pressable
            onPress={handleSkip}
            style={({ pressed }) => [styles.skipButton, pressed && styles.pressed]}
            hitSlop={8}>
            <Text style={styles.skipButtonText}>Skip joining for now</Text>
          </Pressable>
        </View>
      </ScrollView>

      {/* Club Details Modal */}
      <Modal
        visible={!!selectedClubForDetails}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedClubForDetails(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            {selectedClubForDetails && (
              <>
                <View style={styles.modalHeader}>
                  <View style={styles.modalHeaderTitleGroup}>
                    <Text style={styles.modalClubName}>
                      {selectedClubForDetails.name}
                    </Text>
                    <Text style={styles.modalCollege}>
                      {selectedClubForDetails.college}
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => setSelectedClubForDetails(null)}
                    hitSlop={8}>
                    <AppIcon name="close" size={22} color={Palette.ink} />
                  </Pressable>
                </View>

                <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                  <View style={styles.modalTagRow}>
                    <Badge
                      label={selectedClubForDetails.category}
                      variant="lime"
                    />
                    <Badge
                      label={`${selectedClubForDetails.memberCount} active members`}
                      variant="neutral"
                    />
                  </View>

                  <Text style={styles.modalSectionHeading}>About this Club</Text>
                  <Text style={styles.modalDescription}>
                    {selectedClubForDetails.shortDescription}
                  </Text>

                  <Text style={styles.modalSectionHeading}>Meeting Schedule</Text>
                  <View style={styles.modalScheduleCard}>
                    <AppIcon name="time-outline" size={16} color={Palette.forest} />
                    <Text style={styles.modalScheduleText}>
                      {selectedClubForDetails.schedule}
                    </Text>
                  </View>

                  <Text style={styles.modalSectionHeading}>Campus Location</Text>
                  <View style={styles.modalScheduleCard}>
                    <AppIcon name="location-outline" size={16} color={Palette.forest} />
                    <Text style={styles.modalScheduleText}>
                      {selectedClubForDetails.meetingSpot}
                    </Text>
                  </View>
                </ScrollView>

                <View style={styles.modalFooter}>
                  {joinedClubIds.includes(selectedClubForDetails.id) ? (
                    <Button
                      label="Leave Club"
                      variant="outline"
                      size="md"
                      onPress={() => {
                        toggleClub(selectedClubForDetails.id);
                        setSelectedClubForDetails(null);
                      }}
                    />
                  ) : (
                    <Button
                      label="Join this Club"
                      variant="primary"
                      size="md"
                      onPress={() => {
                        toggleClub(selectedClubForDetails.id);
                        setSelectedClubForDetails(null);
                      }}
                      icon={<AppIcon name="add" size={18} color={Palette.ink} />}
                    />
                  )}
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
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
    paddingBottom: Spacing.space6,
    maxWidth: 540,
    width: '100%',
    alignSelf: 'center',
  },
  headerBlock: {
    marginBottom: Spacing.space4,
  },
  collegeBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.space2,
  },
  collegePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Palette.white,
    borderWidth: 1,
    borderColor: Palette.border,
    paddingHorizontal: Spacing.space2 + 2,
    paddingVertical: 4,
    borderRadius: Radius.full,
    gap: 6,
    maxWidth: '70%',
  },
  collegePillText: {
    ...Typography.supporting,
    color: Palette.forest,
    fontWeight: '700',
    fontFamily: FontFamily.bold,
    fontSize: 11.5,
  },
  title: {
    ...Typography.pageTitle,
    color: Palette.ink,
    marginBottom: Spacing.space1,
  },
  subtitle: {
    ...Typography.body,
    color: Palette.muted,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Palette.white,
    borderWidth: 1,
    borderColor: Palette.border,
    borderRadius: Radius.sm, // 10px
    paddingHorizontal: Spacing.space3,
    minHeight: 46,
    gap: 8,
    marginBottom: Spacing.space3,
  },
  searchInput: {
    flex: 1,
    ...Typography.body,
    color: Palette.ink,
    paddingVertical: 8,
  },
  filterSection: {
    marginBottom: Spacing.space4,
    marginHorizontal: -Spacing.space4,
  },
  categoryScroll: {
    paddingHorizontal: Spacing.space4,
    gap: 8,
    flexDirection: 'row',
  },
  filterChip: {
    backgroundColor: Palette.white,
    borderWidth: 1,
    borderColor: Palette.border,
    borderRadius: Radius.full,
    paddingVertical: 7,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  filterChipActive: {
    backgroundColor: Palette.forest,
    borderColor: Palette.forest,
  },
  filterChipNearbyActive: {
    backgroundColor: Palette.lime,
    borderColor: Palette.lime,
  },
  filterChipText: {
    ...Typography.supporting,
    fontWeight: '600',
    fontFamily: FontFamily.medium,
    color: Palette.ink,
  },
  filterChipTextActive: {
    color: Palette.white,
  },
  filterChipTextNearbyActive: {
    color: Palette.forest,
  },
  clubList: {
    width: '100%',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.space6,
    backgroundColor: Palette.white,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Palette.border,
    paddingHorizontal: Spacing.space4,
  },
  emptyTitle: {
    ...Typography.cardHeading,
    color: Palette.ink,
    marginTop: Spacing.space3,
    marginBottom: 4,
  },
  emptySubtitle: {
    ...Typography.supporting,
    color: Palette.muted,
    textAlign: 'center',
    marginBottom: Spacing.space4,
  },
  resetButton: {
    minWidth: 120,
  },
  bottomBar: {
    marginTop: Spacing.space5,
    width: '100%',
    alignItems: 'center',
    gap: Spacing.space3,
  },
  skipButton: {
    paddingVertical: Spacing.space2,
    paddingHorizontal: Spacing.space4,
  },
  skipButtonText: {
    ...Typography.supporting,
    color: Palette.muted,
    fontWeight: '600',
    fontFamily: FontFamily.medium,
    fontSize: 13.5,
  },
  pressed: {
    opacity: 0.7,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: Palette.overlay,
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: Palette.white,
    borderTopLeftRadius: Radius.lg,
    borderTopRightRadius: Radius.lg,
    padding: Spacing.space4,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingBottom: Spacing.space3,
    borderBottomWidth: 1,
    borderBottomColor: Palette.surfaceSubtle,
  },
  modalHeaderTitleGroup: {
    flex: 1,
    marginRight: Spacing.space2,
  },
  modalClubName: {
    ...Typography.cardHeading,
    fontSize: 18,
    color: Palette.ink,
  },
  modalCollege: {
    ...Typography.supporting,
    color: Palette.muted,
    marginTop: 2,
  },
  modalBody: {
    marginVertical: Spacing.space3,
  },
  modalTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: Spacing.space4,
  },
  modalSectionHeading: {
    ...Typography.cardHeading,
    fontSize: 14,
    color: Palette.ink,
    marginBottom: Spacing.space1,
    marginTop: Spacing.space2,
  },
  modalDescription: {
    ...Typography.body,
    color: Palette.ink,
    lineHeight: 20,
    marginBottom: Spacing.space3,
  },
  modalScheduleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Palette.surfaceHighlight,
    borderWidth: 1,
    borderColor: Palette.border,
    borderRadius: Radius.sm,
    padding: Spacing.space3,
    gap: 10,
    marginBottom: Spacing.space3,
  },
  modalScheduleText: {
    ...Typography.body,
    fontSize: 13.5,
    color: Palette.ink,
    flex: 1,
  },
  modalFooter: {
    paddingTop: Spacing.space3,
    borderTopWidth: 1,
    borderTopColor: Palette.surfaceSubtle,
  },
});
