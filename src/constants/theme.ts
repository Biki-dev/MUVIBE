import '@/global.css';
import { Platform } from 'react-native';

/**
 * Active Minimalism Design Tokens for FitConnect
 */

export const Palette = {
  // Primary palette
  lime: '#C5F36B', // Primary accent
  forest: '#18352D', // Brand / dark surfaces
  canvas: '#F5F7F2', // Light background
  white: '#FFFFFF', // Cards and sheets
  ink: '#17231E', // Main text
  muted: '#738078', // Secondary text

  // Supporting colors
  electricBlue: '#5279F6', // Information and secondary actions
  amber: '#E8A34A', // Achievements and highlights
  coral: '#E56C67', // Errors and destructive actions

  // Neutrals and borders
  border: '#E3E8E1',
  borderDark: '#2C4940',
  surfaceSubtle: '#EDF1E9',
  surfaceHighlight: '#FAFBF8',
  overlay: 'rgba(23, 35, 30, 0.45)',
} as const;

export const Colors = {
  light: {
    background: Palette.canvas,
    card: Palette.white,
    cardForest: Palette.forest,
    text: Palette.ink,
    textSecondary: Palette.muted,
    textInverse: Palette.white,
    border: Palette.border,
    primary: Palette.lime,
    primaryText: Palette.ink,
    accent: Palette.forest,
    info: Palette.electricBlue,
    warning: Palette.amber,
    error: Palette.coral,
    backgroundElement: Palette.surfaceSubtle,
    backgroundSelected: Palette.lime,
  },
  dark: {
    background: '#0F1A16',
    card: '#162822',
    cardForest: '#1D3B32',
    text: '#F5F7F2',
    textSecondary: '#9EABA4',
    textInverse: '#17231E',
    border: '#243A33',
    primary: Palette.lime,
    primaryText: Palette.ink,
    accent: Palette.lime,
    info: Palette.electricBlue,
    warning: Palette.amber,
    error: Palette.coral,
    backgroundElement: '#182B24',
    backgroundSelected: '#26443A',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;
export type ThemeMode = 'light' | 'dark';

/**
 * SF Pro Display, loaded in app/_layout.tsx with expo-font.
 * Each weight is its own family name: React Native does not map
 * fontWeight onto a custom family's cuts, so styles name the cut
 * directly. Only the upright Regular, Medium and Bold cuts are bundled.
 */
export const FontFamily = {
  regular: 'SFProDisplay-Regular',
  medium: 'SFProDisplay-Medium',
  bold: 'SFProDisplay-Bold',
} as const;

/** Picks the bundled cut that matches a fontWeight value. */
export function fontFamilyForWeight(weight: string | number | undefined): string {
  const w = typeof weight === 'number' ? weight : parseInt(String(weight ?? '400'), 10);
  if (weight === 'bold' || w >= 700) return FontFamily.bold;
  if (w >= 500) return FontFamily.medium;
  return FontFamily.regular;
}

export const Typography = {
  pageTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '700' as const,
    letterSpacing: -0.5,
  },
  sectionHeading: {
    fontFamily: FontFamily.medium,
    fontSize: 19,
    lineHeight: 25,
    fontWeight: '600' as const,
    letterSpacing: -0.2,
  },
  cardHeading: {
    fontFamily: FontFamily.medium,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '600' as const,
  },
  body: {
    fontFamily: FontFamily.regular,
    fontSize: 14.5,
    lineHeight: 21,
    fontWeight: '400' as const,
  },
  bodyBold: {
    fontFamily: FontFamily.medium,
    fontSize: 14.5,
    lineHeight: 21,
    fontWeight: '600' as const,
  },
  supporting: {
    fontFamily: FontFamily.regular,
    fontSize: 12.5,
    lineHeight: 18,
    fontWeight: '400' as const,
  },
  stats: {
    fontFamily: FontFamily.bold,
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '700' as const,
    fontVariant: ['tabular-nums'] as ('tabular-nums')[],
  },
};

export const Spacing = {
  space1: 4, // Icon-text gap
  space2: 8, // Compact gap
  space3: 12, // Small card padding
  space4: 16, // Standard padding
  space5: 20, // Section spacing
  space6: 24, // Large spacing
  space8: 32, // Page separation

  // Backwards compatibility with starter tokens
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const Radius = {
  sm: 10, // Small controls
  btn: 14, // Buttons
  card: 18, // Cards
  lg: 24, // Large feature cards & bottom sheet top corners
  full: 9999, // Pills & circular avatars
} as const;

export const Fonts = Platform.select({
  ios: {
    sans: FontFamily.regular,
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  android: {
    sans: FontFamily.regular,
    serif: 'serif',
    rounded: 'sans-serif',
    mono: 'monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: `${FontFamily.regular}, var(--font-display), system-ui, sans-serif`,
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 640;

/**
 * Assam Engineering College, Jalukbari. Used as a fallback position when
 * a student opts in to Near Me but location is unavailable or refused.
 */
export const CAMPUS_COORDS = { latitude: 26.1445, longitude: 91.7362 } as const;

/* ── Gamification ──────────────────────────────────────────────────
 *
 * Reference point is campus varsity athletics: scoreboards, track lane
 * markings, stencilled team numerals. Deliberately NOT the default
 * "gamified app" look, which is why there are no purple-to-pink
 * gradients, no glass panels, no glow, no confetti and no emoji here.
 *
 * Colour rule: the tier ramp walks from stone to the brand lime, so the
 * top rank IS the brand accent. You earn your way into the palette
 * rather than the palette getting louder.
 * ──────────────────────────────────────────────────────────────── */

export type TierKey = 'rookie' | 'bronze' | 'silver' | 'gold' | 'apex';

export interface Tier {
  key: TierKey;
  label: string;
  /** Minimum level to hold this tier. */
  minLevel: number;
  color: string;
  /** Text colour when `color` is the background. */
  onColor: string;
}

export const TIERS: Tier[] = [
  { key: 'rookie', label: 'Rookie', minLevel: 1, color: '#8C9A91', onColor: '#FFFFFF' },
  { key: 'bronze', label: 'Bronze', minLevel: 5, color: '#C08552', onColor: '#FFFFFF' },
  { key: 'silver', label: 'Silver', minLevel: 12, color: '#9FB0A6', onColor: '#17231E' },
  { key: 'gold', label: 'Gold', minLevel: 22, color: '#E8A34A', onColor: '#17231E' },
  { key: 'apex', label: 'Apex', minLevel: 35, color: '#C5F36B', onColor: '#17231E' },
];

export const Game = {
  /** Lane markings on the XP bar. Fixed count so the bar reads as a scale. */
  xpSegments: 10,
  /** Hard-edged, not pill shaped: the bar is a gauge, not a bubble. */
  barRadius: 3,
  barHeight: 10,
  /** Scoreboard numerals: tight, tabular, heavy. */
  numerals: {
    fontSize: 34,
    lineHeight: 38,
    letterSpacing: -1.2,
    fontVariant: ['tabular-nums'] as ('tabular-nums')[],
  },
  /** Small stencil-style label above a number. */
  stencil: {
    fontSize: 10.5,
    letterSpacing: 1.4,
    textTransform: 'uppercase' as const,
  },
} as const;
