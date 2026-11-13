/**
 * src/constants/race-data.ts
 * ─────────────────────────────────────────────────────────────────
 * Campus Rally Points & Presets for Multiplayer Running Competitions.
 * ─────────────────────────────────────────────────────────────────
 */

import { RaceDestination, RaceParticipant } from '@/types/race';

export const CAMPUS_DESTINATIONS: RaceDestination[] = [
  {
    id: 'dest_stadium',
    name: 'Athletic Track & Stadium',
    area: 'Campus Sports Complex',
    description: 'All-weather 400m synthetic running track & pavilion',
    coords: { latitude: 26.1425, longitude: 91.6610 },
    defaultDistanceMeters: 850,
    mapXPercent: 74,
    mapYPercent: 28,
    icon: 'trophy',
  },
  {
    id: 'dest_library',
    name: 'Central Library Plaza',
    area: 'Academic Core Zone',
    description: 'Central campus fountain & clock tower monument',
    coords: { latitude: 26.1410, longitude: 91.6635 },
    defaultDistanceMeters: 620,
    mapXPercent: 54,
    mapYPercent: 48,
    icon: 'book',
  },
  {
    id: 'dest_maingate',
    name: 'Campus Main Gate',
    area: 'South Perimeter',
    description: 'Iconic gateway arch facing university boulevard',
    coords: { latitude: 26.1440, longitude: 91.6590 },
    defaultDistanceMeters: 1150,
    mapXPercent: 24,
    mapYPercent: 22,
    icon: 'business',
  },
  {
    id: 'dest_hostel4',
    name: 'Hostel 4 Sports Ground',
    area: 'Residential Hostel Block',
    description: 'Open turf ground near cafeteria & basketball courts',
    coords: { latitude: 26.1390, longitude: 91.6650 },
    defaultDistanceMeters: 780,
    mapXPercent: 82,
    mapYPercent: 76,
    icon: 'football',
  },
  {
    id: 'dest_lake',
    name: 'Botanical Lake Promenade',
    area: 'Eco Garden Sector',
    description: 'Lakeside trail with sprint finish boardwalk',
    coords: { latitude: 26.1455, longitude: 91.6620 },
    defaultDistanceMeters: 950,
    mapXPercent: 42,
    mapYPercent: 18,
    icon: 'leaf',
  },
];

export const INITIAL_RACE_PARTICIPANTS: RaceParticipant[] = [
  {
    id: 'p_rohan',
    name: 'Rohan Sharma',
    college: 'AEC Campus',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
    isHost: false,
    isCurrentUser: false,
    coords: { latitude: 26.1385, longitude: 91.6640 },
    distanceRemainingMeters: 850,
    speedKmh: 14.8,
    progressPercent: 0,
    currentRank: 2,
    hasFinished: false,
    color: '#38BDF8', // Cyan/Sky
  },
  {
    id: 'p_ananya',
    name: 'Ananya Dutta',
    college: 'AEC Campus',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&auto=format&fit=crop&q=80',
    isHost: false,
    isCurrentUser: false,
    coords: { latitude: 26.1392, longitude: 91.6630 },
    distanceRemainingMeters: 850,
    speedKmh: 13.5,
    progressPercent: 0,
    currentRank: 3,
    hasFinished: false,
    color: '#F472B6', // Pink/Coral
  },
];

