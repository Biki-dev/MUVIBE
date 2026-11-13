/**
 * src/components/challenge/race-live-map.tsx
 * ─────────────────────────────────────────────────────────────────
 * Interactive Campus Map Canvas for selecting rally destinations and
 * tracking live runner positions in real-time over WebSocket.
 * ─────────────────────────────────────────────────────────────────
 */

import React from 'react';
import { View, Text, StyleSheet, Pressable, Image, Platform } from 'react-native';
import { Palette, Radius, Spacing } from '@/constants/theme';
import { AppIcon } from '@/components/ui/icon';
import { RaceDestination, RaceParticipant } from '@/types/race';

interface RaceLiveMapProps {
  destination: RaceDestination;
  participants?: RaceParticipant[];
  isInteractiveSelection?: boolean;
  onSelectCoordinates?: (xPercent: number, yPercent: number) => void;
  style?: any;
}

export function RaceLiveMap({
  destination,
  participants = [],
  isInteractiveSelection = false,
  onSelectCoordinates,
  style,
}: RaceLiveMapProps) {
  const handleMapPress = (e: any) => {
    if (!isInteractiveSelection || !onSelectCoordinates) return;
    const { nativeEvent } = e;
    const locationX = nativeEvent.locationX;
    const locationY = nativeEvent.locationY;

    // Estimate based on a standard container width/height or target dimensions
    const width = 320;
    const height = 180;
    const xPct = Math.max(10, Math.min(90, Math.round((locationX / width) * 100)));
    const yPct = Math.max(10, Math.min(90, Math.round((locationY / height) * 100)));

    onSelectCoordinates(xPct, yPct);
  };

  return (
    <Pressable
      onPress={handleMapPress}
      style={[styles.mapContainer, style]}
      accessibilityRole={isInteractiveSelection ? 'button' : undefined}
      accessibilityLabel="Interactive Campus Race Map">
      {/* ── 1. CAMPUS TERRAIN GRAPHICS ── */}
      {/* Lake / Water Body */}
      <View style={styles.lakeGraphic} />
      {/* Campus Athletic Oval */}
      <View style={styles.stadiumOval} />
      {/* Campus Paths & Roads */}
      <View style={styles.mainAvenueLine} />
      <View style={styles.crossCampusRoad} />
      <View style={styles.perimeterLoop} />

      {/* Grid Coordinates Overlay */}
      <View style={styles.gridOverlay}>
        <Text style={styles.gridCoordText}>26.14°N • 91.66°E</Text>
        <Text style={styles.gridScaleText}>100m</Text>
      </View>

      {/* ── 2. DESTINATION TARGET FINISH PIN ── */}
      <View
        style={[
          styles.destinationPinWrapper,
          {
            left: `${destination.mapXPercent}%`,
            top: `${destination.mapYPercent}%`,
          },
        ]}>
        {/* Pulsing Target Radar Rings */}
        <View style={styles.targetPulseRingOuter} />
        <View style={styles.targetPulseRingInner} />

        {/* Flag Icon */}
        <View style={styles.flagPinBadge}>
          <AppIcon name="flag" size={13} color={Palette.forest} />
        </View>

        {/* Destination Name Banner */}
        <View style={styles.destLabelBox}>
          <Text style={styles.destLabelText} numberOfLines={1}>
            🏁 {destination.name}
          </Text>
        </View>
      </View>

      {/* ── 3. LIVE PARTICIPANT RUNNER PINS ── */}
      {participants.map((participant) => {
        // Calculate position interpolating from start point towards destination
        const progress = (participant.progressPercent || 0) / 100;
        // Start origin points for runners
        const startX = participant.isCurrentUser ? 18 : participant.id === 'p_rohan' ? 24 : 12;
        const startY = participant.isCurrentUser ? 82 : participant.id === 'p_rohan' ? 88 : 76;

        const currentX = startX + (destination.mapXPercent - startX) * progress;
        const currentY = startY + (destination.mapYPercent - startY) * progress;

        return (
          <View
            key={participant.id}
            style={[
              styles.runnerPinWrapper,
              {
                left: `${currentX}%`,
                top: `${currentY}%`,
              },
            ]}>
            {/* Rank Bubble */}
            <View
              style={[
                styles.runnerRankBadge,
                { backgroundColor: participant.color || Palette.lime },
              ]}>
              <Text style={styles.runnerRankText}>{participant.currentRank}</Text>
            </View>

            {/* Runner Avatar Dot */}
            <View
              style={[
                styles.runnerAvatarRing,
                participant.isCurrentUser && styles.runnerAvatarRingUser,
                { borderColor: participant.color || Palette.lime },
              ]}>
              <Image source={{ uri: participant.avatar }} style={styles.runnerAvatar} />
            </View>

            {/* Runner Info Label */}
            <View style={styles.runnerLabelBox}>
              <Text style={styles.runnerNameText} numberOfLines={1}>
                {participant.isCurrentUser ? 'YOU' : participant.name.split(' ')[0]}
              </Text>
              <Text style={styles.runnerSpeedText}>
                {participant.hasFinished ? 'FINISHED' : `${participant.distanceRemainingMeters}m`}
              </Text>
            </View>
          </View>
        );
      })}

      {/* Mode Tag */}
      <View style={styles.mapFooterBar}>
        <View style={styles.statusDot} />
        <Text style={styles.mapFooterText}>
          {isInteractiveSelection
            ? 'Tap anywhere on campus map to set custom finish pin'
            : 'Live GPS WebSocket Feed • First to Flag Wins'}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  mapContainer: {
    height: 190,
    backgroundColor: '#0A1C16',
    borderRadius: Radius.card,
    borderWidth: 1.5,
    borderColor: 'rgba(197, 243, 107, 0.3)',
    position: 'relative',
    overflow: 'hidden',
    marginBottom: Spacing.space3,
  },
  // Terrain details
  lakeGraphic: {
    position: 'absolute',
    top: 10,
    left: '34%',
    width: 60,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1E3A5F',
    borderWidth: 1,
    borderColor: '#38BDF8',
    opacity: 0.7,
  },
  stadiumOval: {
    position: 'absolute',
    top: 25,
    right: 25,
    width: 55,
    height: 35,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#4ADE80',
    backgroundColor: 'rgba(74, 222, 128, 0.12)',
  },
  mainAvenueLine: {
    position: 'absolute',
    top: '52%',
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  crossCampusRoad: {
    position: 'absolute',
    left: '46%',
    top: 0,
    bottom: 0,
    width: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  perimeterLoop: {
    position: 'absolute',
    top: 15,
    left: 15,
    right: 15,
    bottom: 25,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 14,
    borderStyle: 'dashed',
  },
  gridOverlay: {
    position: 'absolute',
    top: 6,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  gridCoordText: {
    fontSize: 8.5,
    color: 'rgba(255, 255, 255, 0.4)',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  gridScaleText: {
    fontSize: 8.5,
    color: 'rgba(197, 243, 107, 0.6)',
    fontWeight: '700',
  },
  // Destination Pin
  destinationPinWrapper: {
    position: 'absolute',
    transform: [{ translateX: -16 }, { translateY: -28 }],
    alignItems: 'center',
    zIndex: 20,
  },
  targetPulseRingOuter: {
    position: 'absolute',
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(197, 243, 107, 0.15)',
    top: -6,
  },
  targetPulseRingInner: {
    position: 'absolute',
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(197, 243, 107, 0.25)',
    top: 0,
  },
  flagPinBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Palette.lime,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 5,
  },
  destLabelBox: {
    backgroundColor: 'rgba(15, 36, 30, 0.9)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.sm,
    borderWidth: 0.5,
    borderColor: Palette.lime,
    marginTop: 2,
  },
  destLabelText: {
    fontSize: 9,
    fontWeight: '800',
    color: Palette.lime,
  },
  // Runner Pins
  runnerPinWrapper: {
    position: 'absolute',
    transform: [{ translateX: -14 }, { translateY: -14 }],
    alignItems: 'center',
    zIndex: 30,
  },
  runnerRankBadge: {
    position: 'absolute',
    top: -5,
    right: -4,
    width: 13,
    height: 13,
    borderRadius: 6.5,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 35,
  },
  runnerRankText: {
    fontSize: 7.5,
    fontWeight: '900',
    color: Palette.forest,
  },
  runnerAvatarRing: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    overflow: 'hidden',
    backgroundColor: Palette.surfaceSubtle,
  },
  runnerAvatarRingUser: {
    borderWidth: 2.5,
    shadowColor: Palette.lime,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 4,
  },
  runnerAvatar: {
    width: '100%',
    height: '100%',
  },
  runnerLabelBox: {
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
    marginTop: 1,
    alignItems: 'center',
  },
  runnerNameText: {
    fontSize: 7.5,
    fontWeight: '800',
    color: Palette.white,
  },
  runnerSpeedText: {
    fontSize: 7,
    fontWeight: '700',
    color: Palette.lime,
  },
  mapFooterBar: {
    position: 'absolute',
    bottom: 6,
    left: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: Palette.lime,
  },
  mapFooterText: {
    fontSize: 8.5,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
  },
});

