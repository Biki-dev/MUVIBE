import { BlitzMode, BlitzModeSpec, Challenger } from '@/types/blitz';

export const NEARBY_CHALLENGERS: Challenger[] = [
  {
    id: 'challenger-1',
    name: 'Rohan Sharma',
    college: 'Assam Engineering College (AEC)',
    department: 'Computer Science',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=160&q=80',
    elo: 1480,
    locationTag: 'Hostel 4 Ground Floor',
    distanceMeters: 18,
    isOnline: true,
    streak: 6,
  },
  {
    id: 'challenger-2',
    name: 'Ananya Gogoi',
    college: 'Assam Engineering College (AEC)',
    department: 'Mechanical Eng.',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=160&q=80',
    elo: 1530,
    locationTag: 'Central Library 1st Floor',
    distanceMeters: 45,
    isOnline: true,
    streak: 9,
  },
  {
    id: 'challenger-3',
    name: 'Bikash Das',
    college: 'Assam Engineering College (AEC)',
    department: 'Electrical Eng.',
    avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=160&q=80',
    elo: 1395,
    locationTag: 'Hostel 2 Common Room',
    distanceMeters: 80,
    isOnline: true,
    streak: 3,
  },
  {
    id: 'challenger-4',
    name: 'Debashree Paul',
    college: 'Assam Engineering College (AEC)',
    department: 'Civil Eng.',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&q=80',
    elo: 1610,
    locationTag: 'Campus Sports Arena',
    distanceMeters: 140,
    isOnline: true,
    streak: 14,
  },
];

export const RIVAL_CHALLENGERS: Challenger[] = [
  {
    id: 'rival-1',
    name: 'Abhishek Roy',
    college: 'IIT Guwahati',
    department: 'Data Science',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=160&q=80',
    elo: 1590,
    isOnline: true,
    streak: 8,
  },
  {
    id: 'rival-2',
    name: 'Tanvi Borah',
    college: 'NIT Silchar',
    department: 'Electronics & Comm.',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=160&q=80',
    elo: 1640,
    isOnline: true,
    streak: 11,
  },
  {
    id: 'rival-3',
    name: 'Manish Kalita',
    college: 'Tezpur University',
    department: 'Energy Engineering',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=160&q=80',
    elo: 1465,
    isOnline: true,
    streak: 5,
  },
  {
    id: 'rival-4',
    name: 'Priyanka Saikia',
    college: 'Jorhat Engineering College (JEC)',
    department: 'Instrumentation',
    avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=160&q=80',
    elo: 1515,
    isOnline: true,
    streak: 7,
  },
];

export const CAMPUS_BRAWL_CHALLENGERS: Challenger[] = [
  {
    id: 'campus-1',
    name: 'Kaushik Deka',
    college: 'Assam Engineering College (AEC)',
    department: 'Mechanical',
    avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=160&q=80',
    elo: 1420,
    isOnline: true,
    streak: 4,
  },
  {
    id: 'campus-2',
    name: 'Sneha Barman',
    college: 'Assam Engineering College (AEC)',
    department: 'Chemical',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=160&q=80',
    elo: 1490,
    isOnline: true,
    streak: 6,
  },
];

export const BLITZ_MODES: BlitzModeSpec[] = [
  {
    id: 'run',
    name: 'Sprint Blitz',
    tagline: 'Cover the most ground in 60 seconds',
    durationSeconds: 60,
    measurement: 'distance_km',
    unit: 'm',
    icon: 'walk',
    // 200m in a minute is a brisk but ordinary student sprint pace.
    parScore: 200,
  },
  {
    id: 'walk',
    name: 'Step Blitz',
    tagline: 'Most steps in 90 seconds wins',
    durationSeconds: 90,
    measurement: 'steps',
    unit: 'steps',
    icon: 'footsteps',
    // ~120 steps a minute is a normal brisk walking cadence.
    parScore: 180,
  },
];

export const BLITZ_MODE_BY_ID: Record<BlitzMode, BlitzModeSpec> = {
  run: BLITZ_MODES[0],
  walk: BLITZ_MODES[1],
};
