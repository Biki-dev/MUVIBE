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

export const Typography = {
  pageTitle: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '700' as const,
    letterSpacing: -0.5,
  },
  sectionHeading: {
    fontSize: 19,
    lineHeight: 25,
    fontWeight: '600' as const,
    letterSpacing: -0.2,
  },
  cardHeading: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '600' as const,
  },
  body: {
    fontSize: 14.5,
    lineHeight: 21,
    fontWeight: '400' as const,
  },
  bodyBold: {
    fontSize: 14.5,
    lineHeight: 21,
    fontWeight: '600' as const,
  },
  supporting: {
    fontSize: 12.5,
    lineHeight: 18,
    fontWeight: '400' as const,
  },
  stats: {
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
    sans: 'Inter',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  android: {
    sans: 'sans-serif',
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
    sans: 'Inter, var(--font-display), system-ui, sans-serif',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 640;
