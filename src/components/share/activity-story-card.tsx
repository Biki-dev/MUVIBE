/**
 * src/components/share/activity-story-card.tsx
 * ─────────────────────────────────────────────────────────────────
 * Instagram Story–format card (9:16).
 * Captured by react-native-view-shot and shared to Instagram.
 *
 * Design language: dark forest + lime — clean, airy, editorial.
 * ─────────────────────────────────────────────────────────────────
 */
import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { ActivityRecord, ActivityType } from '@/types/activity';
import { formatDuration } from '@/services/activity-stats';

// ── Dimensions ────────────────────────────────────────────────────
export const STORY_WIDTH  = 360;
export const STORY_HEIGHT = 640;

// ── Brand colours ─────────────────────────────────────────────────
const C = {
  bg:       '#0C1E16',  // deep dark canvas
  surface:  '#13281C',  // card surface
  line:     '#1E3828',  // subtle dividers
  lime:     '#C5F36B',  // primary accent
  limeD:    '#9AC53D',  // darker lime for contrast
  white:    '#FFFFFF',
  whiteM:   'rgba(255,255,255,0.65)', // muted white
  whiteS:   'rgba(255,255,255,0.12)', // subtle white
  whiteXS:  'rgba(255,255,255,0.06)',
  limeTint: 'rgba(197,243,107,0.10)',
  limeBorder:'rgba(197,243,107,0.22)',
};

// ── Activity icon meta ────────────────────────────────────────────
interface IconMeta {
  name: string;
  lib: 'ion' | 'mci';
  label: string;
  stat: string; // primary stat label for hero
}

const ACTIVITY_META: Record<ActivityType, IconMeta> = {
  walking:   { name: 'walk',                 lib: 'mci', label: 'Walking',     stat: 'Steps' },
  running:   { name: 'run-fast',             lib: 'mci', label: 'Running',     stat: 'Distance' },
  cycling:   { name: 'bicycle',              lib: 'mci', label: 'Cycling',     stat: 'Distance' },
  jump_rope: { name: 'jump-rope',            lib: 'mci', label: 'Jump Rope',   stat: 'Jumps' },
  gym:       { name: 'barbell-outline',      lib: 'ion', label: 'Gym Workout', stat: 'Duration' },
  yoga:      { name: 'body-outline',         lib: 'ion', label: 'Yoga',        stat: 'Duration' },
  swimming:  { name: 'water-outline',        lib: 'ion', label: 'Swimming',    stat: 'Duration' },
  hiking:    { name: 'trail-sign-outline',   lib: 'ion', label: 'Hiking',      stat: 'Distance' },
  other:     { name: 'flash-outline',        lib: 'ion', label: 'Activity',    stat: 'Duration' },
};

function ActivityIcon({ type, size }: { type: ActivityType; size: number }) {
  const meta = ACTIVITY_META[type] ?? ACTIVITY_META.other;
  if (meta.lib === 'mci') {
    return <MaterialCommunityIcons name={meta.name as any} size={size} color={C.lime} />;
  }
  return <Ionicons name={meta.name as any} size={size} color={C.lime} />;
}

// ── Date formatting ───────────────────────────────────────────────
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
  });
}

// ── Stat rows builder ─────────────────────────────────────────────
interface Stat { label: string; value: string; unit: string }

function buildStats(a: ActivityRecord): Stat[] {
  const rows: Stat[] = [];

  // Duration — always first
  rows.push({ label: 'Duration', value: formatDuration(a.durationSeconds), unit: '' });

  if (a.distanceKm != null && a.distanceKm > 0)
    rows.push({ label: 'Distance', value: a.distanceKm.toFixed(2), unit: 'km' });

  if (a.averagePace && a.distanceKm && a.distanceKm > 0)
    rows.push({ label: 'Avg Pace', value: a.averagePace, unit: '/km' });

  if (a.steps != null && a.steps > 0)
    rows.push({ label: 'Steps', value: a.steps.toLocaleString(), unit: '' });
  else if (a.jumpCount != null && a.jumpCount > 0)
    rows.push({ label: 'Jumps', value: a.jumpCount.toLocaleString(), unit: '' });

  // Calories — fill up to 4
  if (rows.length < 4)
    rows.push({ label: 'Calories', value: a.calories.toLocaleString(), unit: 'kcal' });

  return rows.slice(0, 4);
}

// ── Props ─────────────────────────────────────────────────────────
interface Props {
  activity:  ActivityRecord;
  username:  string;
  avatarUrl?: string;
}

// ── Component ─────────────────────────────────────────────────────
export function ActivityStoryCard({ activity, username, avatarUrl }: Props) {
  const meta  = ACTIVITY_META[activity.type] ?? ACTIVITY_META.other;
  const stats = buildStats(activity);
  const date  = fmtDate(activity.endedAt ?? activity.createdAt);

  // Split stats into 2×2
  const topStats = stats.slice(0, 2);
  const botStats = stats.slice(2, 4);

  return (
    <View style={s.card} collapsable={false}>

      {/* ── Noise/grain texture simulation via subtle overlay ── */}
      <View style={s.grainOverlay} />

      {/* ── Soft lime glow top-right ── */}
      <View style={s.glowTopRight} />

      {/* ── Top bar: date + username ── */}
      <View style={s.topBar}>
        <View style={s.datePill}>
          <Ionicons name="calendar-outline" size={10} color={C.lime} style={{ marginRight: 5 }} />
          <Text style={s.datePillText}>{date}</Text>
        </View>
        <View style={s.userChip}>
          <View style={s.chipAvatarFallback}>
            <Ionicons name="person" size={14} color={C.bg} />
          </View>
          <Text style={s.chipUsername} numberOfLines={1}>@{username}</Text>
        </View>
      </View>

      {/* ── Hero: icon + activity name ── */}
      <View style={s.hero}>
        <View style={s.iconRing}>
          <ActivityIcon type={activity.type} size={40} />
        </View>

        <Text style={s.completedTag}>COMPLETED</Text>
        <Text style={s.activityName}>{meta.label}</Text>

        {/* Thin lime rule */}
        <View style={s.limeRule} />
      </View>

      {/* ── Stats block ── */}
      <View style={s.statsBlock}>
        {/* Row 1 */}
        <View style={s.statsRow}>
          {topStats.map((st, i) => (
            <StatCell key={i} stat={st} accent={i === 0} />
          ))}
        </View>
        {/* Row 2 */}
        {botStats.length > 0 && (
          <View style={[s.statsRow, { marginTop: 10 }]}>
            {botStats.map((st, i) => (
              <StatCell key={i} stat={st} accent={false} />
            ))}
          </View>
        )}
      </View>

      {/* ── Divider ── */}
      <View style={s.divider} />

      {/* ── Footer: branding ── */}
      <View style={s.footer}>
        {/* Logo image with clean transparent background & increased size */}
        <Image
          source={require('../../../assets/images/android-icon-foreground.png')}
          style={s.logoImg}
          resizeMode="contain"
        />
        <View style={s.footerText}>
          <Text style={s.footerApp}>MUVIBE</Text>
          <Text style={s.footerSub}>Move. Connect. Thrive.</Text>
        </View>

        {/* "Move more" badge */}
        <View style={s.footerBadge}>
          <Text style={s.footerBadgeText}>Share yours</Text>
        </View>
      </View>

    </View>
  );
}

// ── Stat Cell ─────────────────────────────────────────────────────
function StatCell({ stat, accent }: { stat: Stat; accent: boolean }) {
  return (
    <View style={[s.statCell, accent && s.statCellAccent]}>
      <Text style={[s.statValue, accent && s.statValueAccent]} numberOfLines={1}>
        {stat.value}
        {stat.unit ? <Text style={[s.statUnit, accent && s.statUnitAccent]}> {stat.unit}</Text> : null}
      </Text>
      <Text style={[s.statLabel, accent && s.statLabelAccent]}>{stat.label}</Text>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────
const s = StyleSheet.create({
  card: {
    width:  STORY_WIDTH,
    height: STORY_HEIGHT,
    backgroundColor: C.bg,
    borderRadius: 0, // no radius — full bleed when shared
    overflow: 'hidden',
    paddingHorizontal: 28,
    paddingTop: 44,
    paddingBottom: 32,
    justifyContent: 'space-between',
  },

  // ── Grain / glow decorations ──────────────────────────────────
  grainOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'transparent',
  },
  glowTopRight: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: C.limeTint,
    top: -60,
    right: -60,
  },

  // ── Top bar ───────────────────────────────────────────────────
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  datePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.limeTint,
    borderWidth: 1,
    borderColor: C.limeBorder,
    borderRadius: 100,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  datePillText: {
    color: C.lime,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.4,
  },
  userChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.whiteXS,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    borderRadius: 100,
    paddingRight: 12,
    paddingLeft: 4,
    paddingVertical: 4,
    gap: 7,
    maxWidth: 150,
  },
  chipAvatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1.5,
    borderColor: C.lime,
  },
  chipAvatarFallback: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: C.lime,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipAvatarInitial: {
    color: C.bg,
    fontSize: 11,
    fontWeight: '800',
  },
  chipUsername: {
    color: C.white,
    fontSize: 11.5,
    fontWeight: '600',
    letterSpacing: 0.1,
    flexShrink: 1,
  },

  // ── Hero ──────────────────────────────────────────────────────
  hero: {
    alignItems: 'flex-start',
    marginTop: 8,
  },
  iconRing: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: C.limeTint,
    borderWidth: 1.5,
    borderColor: C.limeBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  completedTag: {
    color: C.lime,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 3,
    marginBottom: 8,
  },
  activityName: {
    color: C.white,
    fontSize: 44,
    fontWeight: '900',
    letterSpacing: -1.5,
    lineHeight: 48,
    marginBottom: 18,
  },
  limeRule: {
    width: 32,
    height: 3,
    backgroundColor: C.lime,
    borderRadius: 2,
  },

  // ── Stats block ───────────────────────────────────────────────
  statsBlock: {
    marginTop: 8,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  statCell: {
    flex: 1,
    backgroundColor: C.whiteXS,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  statCellAccent: {
    backgroundColor: C.lime,
    borderColor: C.lime,
  },
  statValue: {
    color: C.white,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  statValueAccent: {
    color: C.bg,
  },
  statUnit: {
    color: C.whiteM,
    fontSize: 13,
    fontWeight: '400',
  },
  statUnitAccent: {
    color: 'rgba(12,30,22,0.6)',
  },
  statLabel: {
    color: C.whiteM,
    fontSize: 10.5,
    fontWeight: '500',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginTop: 4,
  },
  statLabelAccent: {
    color: 'rgba(12,30,22,0.65)',
  },

  // ── Divider ───────────────────────────────────────────────────
  divider: {
    height: 1,
    backgroundColor: C.line,
    marginVertical: 4,
  },

  // ── Footer ───────────────────────────────────────────────────
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoImg: {
    width: 48,
    height: 48,
  },
  footerText: {
    flex: 1,
  },
  footerApp: {
    color: C.white,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 2,
  },
  footerSub: {
    color: C.whiteM,
    fontSize: 10,
    fontWeight: '400',
    letterSpacing: 0.3,
    marginTop: 1,
  },
  footerBadge: {
    backgroundColor: C.limeTint,
    borderWidth: 1,
    borderColor: C.limeBorder,
    borderRadius: 100,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  footerBadgeText: {
    color: C.lime,
    fontSize: 10.5,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});
