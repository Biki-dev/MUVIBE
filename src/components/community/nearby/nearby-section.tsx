/**
 * Near Me
 * ─────────────────────────────────────────────────────────────────
 * Opt in to be visible, see who is around and what they are doing, and
 * send them a head-to-head challenge. Visibility is off by default and
 * switching it off deletes the presence row.
 * ─────────────────────────────────────────────────────────────────
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  Switch,
  Modal,
  ActivityIndicator,
  Platform,
} from 'react-native';
import * as Location from 'expo-location';
import { Palette, Radius, Spacing, Typography, FontFamily } from '@/constants/theme';
import { AppIcon } from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/auth-context';
import { CAMPUS_COORDS } from '@/constants/theme';
import {
  clearMyPresence,
  fetchMyPeerChallenges,
  fetchNearby,
  getMyPresence,
  respondPeerChallenge,
  sendPeerChallenge,
  setMyPresence,
  subscribeToNearby,
} from '@/services/nearby-service';
import { formatDistance, formatLastSeen } from '@/services/nearby-shared';
import {
  Coordinates,
  NearbyStudent,
  PeerChallenge,
  PeerChallengeMeasurement,
} from '@/types/nearby';

const RADIUS_OPTIONS = [1, 3, 5] as const;
const GOALS: Record<PeerChallengeMeasurement, number[]> = {
  steps: [10000, 25000, 50000],
  distance_km: [5, 10, 25],
};
const DURATIONS = [3, 7, 14] as const;

const ACTIVITY_LABEL: Record<string, string> = {
  walking: 'Walking',
  running: 'Running',
  cycling: 'Cycling',
  jump_rope: 'Jump rope',
  gym: 'Gym',
  yoga: 'Yoga',
  swimming: 'Swimming',
  hiking: 'Hiking',
  other: 'Active',
};

function doingLine(s: NearbyStudent): string {
  if (s.statusText) return s.statusText;
  if (!s.lastActivity) return 'No activity logged yet';
  const a = s.lastActivity;
  const parts = [ACTIVITY_LABEL[a.type] ?? 'Active'];
  if (a.distanceKm) parts.push(`${a.distanceKm.toFixed(1)} km`);
  else if (a.steps) parts.push(`${a.steps.toLocaleString()} steps`);
  else if (a.durationSeconds) parts.push(`${Math.round(a.durationSeconds / 60)} min`);
  parts.push(formatLastSeen(Math.round((Date.now() - new Date(a.endedAt).getTime()) / 60000)));
  return parts.join(' · ');
}

export function NearbySection() {
  const { user } = useAuth();

  const [visible, setVisible] = useState(false);
  const [coords, setCoords] = useState<Coordinates | null>(null);
  const [usingCampus, setUsingCampus] = useState(false);
  const [statusText, setStatusText] = useState('');
  const [radiusKm, setRadiusKm] = useState<number>(3);
  const [query, setQuery] = useState('');
  const [people, setPeople] = useState<NearbyStudent[]>([]);
  const [challenges, setChallenges] = useState<PeerChallenge[]>([]);
  const [loading, setLoading] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  // Challenge composer
  const [target, setTarget] = useState<NearbyStudent | null>(null);
  const [measurement, setMeasurement] = useState<PeerChallengeMeasurement>('steps');
  const [goal, setGoal] = useState<number>(GOALS.steps[0]);
  const [days, setDays] = useState<number>(7);
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    const presence = await getMyPresence();
    setVisible(presence.visible);
    setStatusText(presence.statusText ?? '');
    setCoords(presence.coords);

    const [list, mine] = await Promise.all([
      presence.visible && presence.coords ? fetchNearby(presence.coords, radiusKm) : Promise.resolve([]),
      fetchMyPeerChallenges(),
    ]);
    setPeople(list);
    setChallenges(mine);
  }, [radiusKm]);

  useEffect(() => {
    setLoading(true);
    load().finally(() => setLoading(false));
    return subscribeToNearby(() => {
      load();
    });
  }, [load]);

  /* ── visibility ───────────────────────────────────────────────── */

  const resolvePosition = async (): Promise<Coordinates> => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const pos = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        setUsingCampus(false);
        return { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
      }
    } catch {
      // fall through to campus
    }
    setUsingCampus(true);
    return { latitude: CAMPUS_COORDS.latitude, longitude: CAMPUS_COORDS.longitude };
  };

  const onToggle = async (next: boolean) => {
    setToggling(true);
    setNotice(null);
    try {
      if (next) {
        const pos = await resolvePosition();
        await setMyPresence(pos, statusText.trim() || null, null);
        setCoords(pos);
        setVisible(true);
        if (usingCampus) setNotice('Location unavailable, using the campus position.');
      } else {
        await clearMyPresence();
        setVisible(false);
        setPeople([]);
      }
    } finally {
      setToggling(false);
    }
  };

  const saveStatus = async () => {
    if (!visible || !coords) return;
    await setMyPresence(coords, statusText.trim() || null, null);
  };

  /* ── search ───────────────────────────────────────────────────── */

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return people;
    return people.filter((p) => {
      const hay = [
        p.name,
        p.username,
        p.department,
        p.statusText ?? '',
        p.lastActivity ? ACTIVITY_LABEL[p.lastActivity.type] ?? '' : '',
      ]
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    });
  }, [people, query]);

  /* ── challenge flow ───────────────────────────────────────────── */

  const openComposer = (s: NearbyStudent) => {
    setTarget(s);
    setMeasurement('steps');
    setGoal(GOALS.steps[0]);
    setDays(7);
  };

  const changeMeasurement = (m: PeerChallengeMeasurement) => {
    setMeasurement(m);
    setGoal(GOALS[m][0]);
  };

  const send = async () => {
    if (!target) return;
    setSending(true);
    const ok = await sendPeerChallenge({
      opponentId: target.id,
      measurement,
      goal,
      durationDays: days,
    });
    setSending(false);
    if (ok) {
      setTarget(null);
      await load();
    } else {
      setNotice('Could not send that challenge.');
    }
  };

  const respond = async (id: string, r: 'accepted' | 'declined' | 'cancelled') => {
    await respondPeerChallenge(id, r);
    await load();
  };

  const active = challenges.filter((c) => c.status === 'pending' || c.status === 'accepted');
  const finished = challenges.filter((c) => c.status === 'completed').slice(0, 3);

  /* ── render ───────────────────────────────────────────────────── */

  return (
    <View>
      {/* Visibility card */}
      <View style={styles.visCard}>
        <View style={styles.visRow}>
          <View style={styles.visIcon}>
            <AppIcon name="radio-outline" size={20} color={Palette.lime} />
          </View>
          <View style={styles.visText}>
            <Text style={styles.visTitle}>Show me to people nearby</Text>
            <Text style={styles.visSub}>
              {visible
                ? 'You are visible. Turn off any time; your location is removed.'
                : 'Off by default. Turn on to see who is around and let them see you.'}
            </Text>
          </View>
          {toggling ? (
            <ActivityIndicator color={Palette.lime} />
          ) : (
            <Switch
              value={visible}
              onValueChange={onToggle}
              trackColor={{ false: Palette.borderDark, true: Palette.lime }}
              thumbColor={Platform.OS === 'android' ? Palette.white : undefined}
            />
          )}
        </View>

        {visible && (
          <View style={styles.statusRow}>
            <TextInput
              value={statusText}
              onChangeText={setStatusText}
              onBlur={saveStatus}
              onSubmitEditing={saveStatus}
              placeholder="What are you up to? e.g. Evening run at the oval"
              placeholderTextColor="rgba(245, 247, 242, 0.45)"
              maxLength={60}
              style={styles.statusInput}
              returnKeyType="done"
            />
          </View>
        )}

        {notice && <Text style={styles.notice}>{notice}</Text>}
      </View>

      {/* Search and radius */}
      {visible && (
        <>
          <View style={styles.searchRow}>
            <AppIcon name="search-outline" size={18} color={Palette.muted} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search people, activity, department"
              placeholderTextColor={Palette.muted}
              style={styles.searchInput}
            />
            {query.length > 0 && (
              <Pressable onPress={() => setQuery('')} hitSlop={8}>
                <AppIcon name="close-circle" size={18} color={Palette.muted} />
              </Pressable>
            )}
          </View>

          <View style={styles.radiusRow}>
            <Text style={styles.radiusLabel}>Within</Text>
            {RADIUS_OPTIONS.map((r) => (
              <Pressable
                key={r}
                onPress={() => setRadiusKm(r)}
                style={[styles.radiusChip, radiusKm === r && styles.radiusChipActive]}>
                <Text style={[styles.radiusText, radiusKm === r && styles.radiusTextActive]}>
                  {r} km
                </Text>
              </Pressable>
            ))}
          </View>
        </>
      )}

      {/* People */}
      <Text style={styles.sectionTitle}>
        {visible ? `Nearby · ${filtered.length}` : 'Nearby'}
      </Text>

      {!visible ? (
        <View style={styles.empty}>
          <AppIcon name="eye-off-outline" size={26} color={Palette.muted} />
          <Text style={styles.emptyTitle}>Nobody can see you, and you cannot see them.</Text>
          <Text style={styles.emptyBody}>Turn on visibility above to find people around campus.</Text>
        </View>
      ) : loading ? (
        <ActivityIndicator color={Palette.forest} style={{ marginVertical: Spacing.space5 }} />
      ) : filtered.length === 0 ? (
        <View style={styles.empty}>
          <AppIcon name="walk" type="mci" size={26} color={Palette.muted} />
          <Text style={styles.emptyTitle}>No one within {radiusKm} km right now.</Text>
          <Text style={styles.emptyBody}>Widen the radius or check back after class.</Text>
        </View>
      ) : (
        filtered.map((p) => (
          <View key={p.id} style={styles.card}>
            <View style={[styles.avatar, { backgroundColor: p.avatarColor }]}>
              <AppIcon name={p.avatarIcon.name} type={p.avatarIcon.type} size={24} color={Palette.forest} />
            </View>
            <View style={styles.cardBody}>
              <View style={styles.nameRow}>
                <Text style={styles.name} numberOfLines={1}>
                  {p.name}
                </Text>
                {p.isDemo && (
                  <View style={styles.demoTag}>
                    <Text style={styles.demoTagText}>demo</Text>
                  </View>
                )}
                <View style={styles.distancePill}>
                  <AppIcon name="navigate" size={11} color={Palette.forest} />
                  <Text style={styles.distanceText}>{formatDistance(p.distanceKm)}</Text>
                </View>
              </View>
              <Text style={styles.meta} numberOfLines={1}>
                @{p.username} · {p.department}
              </Text>
              <Text style={styles.doing} numberOfLines={2}>
                {doingLine(p)}
              </Text>
              <View style={styles.cardActions}>
                <Text style={styles.seen}>Seen {formatLastSeen(p.lastSeenMinutes)}</Text>
                {p.openChallengeId ? (
                  <View style={styles.inChallenge}>
                    <AppIcon name="flash" size={12} color={Palette.forest} />
                    <Text style={styles.inChallengeText}>In a challenge</Text>
                  </View>
                ) : (
                  <Pressable onPress={() => openComposer(p)} style={styles.challengeBtn}>
                    <AppIcon name="trophy-outline" size={14} color={Palette.ink} />
                    <Text style={styles.challengeBtnText}>Challenge</Text>
                  </Pressable>
                )}
              </View>
            </View>
          </View>
        ))
      )}

      {/* Challenges with people */}
      {(active.length > 0 || finished.length > 0) && (
        <>
          <Text style={[styles.sectionTitle, { marginTop: Spacing.space5 }]}>Head to head</Text>
          {[...active, ...finished].map((c) => (
            <PeerChallengeCard key={c.id} c={c} onRespond={respond} />
          ))}
        </>
      )}

      {/* Composer */}
      <Modal visible={Boolean(target)} transparent animationType="fade" onRequestClose={() => setTarget(null)}>
        <Pressable style={styles.backdrop} onPress={() => setTarget(null)} />
        <View style={styles.sheet}>
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetTitle}>Challenge {target?.name.split(' ')[0]}</Text>
          <Text style={styles.sheetSub}>Who gets there first. Both of you log as usual.</Text>

          <Text style={styles.fieldLabel}>Measure</Text>
          <View style={styles.segment}>
            {(['steps', 'distance_km'] as PeerChallengeMeasurement[]).map((m) => (
              <Pressable
                key={m}
                onPress={() => changeMeasurement(m)}
                style={[styles.segmentBtn, measurement === m && styles.segmentBtnActive]}>
                <Text style={[styles.segmentText, measurement === m && styles.segmentTextActive]}>
                  {m === 'steps' ? 'Steps' : 'Distance'}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.fieldLabel}>Goal</Text>
          <View style={styles.chipRow}>
            {GOALS[measurement].map((g) => (
              <Pressable
                key={g}
                onPress={() => setGoal(g)}
                style={[styles.chip, goal === g && styles.chipActive]}>
                <Text style={[styles.chipText, goal === g && styles.chipTextActive]}>
                  {measurement === 'steps' ? g.toLocaleString() : `${g} km`}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.fieldLabel}>Duration</Text>
          <View style={styles.chipRow}>
            {DURATIONS.map((d) => (
              <Pressable
                key={d}
                onPress={() => setDays(d)}
                style={[styles.chip, days === d && styles.chipActive]}>
                <Text style={[styles.chipText, days === d && styles.chipTextActive]}>{d} days</Text>
              </Pressable>
            ))}
          </View>

          <Button
            label={sending ? 'Sending' : 'Send challenge'}
            variant="primary"
            size="md"
            onPress={send}
            loading={sending}
            icon={<AppIcon name="paper-plane-outline" size={18} color={Palette.ink} />}
            style={{ marginTop: Spacing.space4 }}
          />
        </View>
      </Modal>
    </View>
  );
}

/* ── peer challenge card ───────────────────────────────────────── */

function PeerChallengeCard({
  c,
  onRespond,
}: {
  c: PeerChallenge;
  onRespond: (id: string, r: 'accepted' | 'declined' | 'cancelled') => void;
}) {
  const pct = (v: number) => Math.min(100, Math.round((v / c.goal) * 100));
  const fmt = (v: number) =>
    c.measurement === 'steps' ? Math.round(v).toLocaleString() : `${v.toFixed(1)} km`;
  const leading = c.myProgress === c.opponentProgress ? null : c.myProgress > c.opponentProgress;

  return (
    <View style={styles.pcCard}>
      <View style={styles.pcHeader}>
        <View style={[styles.avatarSm, { backgroundColor: c.opponent.avatarColor }]}>
          <AppIcon
            name={c.opponent.avatarIcon.name}
            type={c.opponent.avatarIcon.type}
            size={18}
            color={Palette.forest}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.pcTitle} numberOfLines={1}>
            {c.isMine ? 'You' : c.opponent.name.split(' ')[0]} challenged{' '}
            {c.isMine ? c.opponent.name.split(' ')[0] : 'you'}
          </Text>
          <Text style={styles.pcMeta}>
            First to {c.goalFormatted} · {c.durationDays} days
            {c.status === 'accepted' && c.remainingDays > 0 ? ` · ${c.remainingDays}d left` : ''}
          </Text>
        </View>
        <View style={[styles.statusChip, styles[`status_${c.status}` as keyof typeof styles] as object]}>
          <Text style={styles.statusChipText}>
            {c.status === 'pending' ? (c.isMine ? 'Sent' : 'New') : c.status}
          </Text>
        </View>
      </View>

      {(c.status === 'accepted' || c.status === 'completed') && (
        <View style={styles.pcProgress}>
          <View style={styles.barRow}>
            <Text style={styles.barLabel}>You</Text>
            <View style={styles.barTrack}>
              <View style={[styles.barFill, { width: `${pct(c.myProgress)}%` }]} />
            </View>
            <Text style={styles.barValue}>{fmt(c.myProgress)}</Text>
          </View>
          <View style={styles.barRow}>
            <Text style={styles.barLabel} numberOfLines={1}>
              {c.opponent.name.split(' ')[0]}
            </Text>
            <View style={styles.barTrack}>
              <View style={[styles.barFill, styles.barFillOpp, { width: `${pct(c.opponentProgress)}%` }]} />
            </View>
            <Text style={styles.barValue}>{fmt(c.opponentProgress)}</Text>
          </View>
          {c.status === 'completed' && (
            <Text style={styles.result}>
              {leading === null ? 'Tied.' : leading ? 'You won.' : `${c.opponent.name.split(' ')[0]} won.`}
            </Text>
          )}
        </View>
      )}

      {c.status === 'pending' && (
        <View style={styles.pcActions}>
          {c.isMine ? (
            <Pressable onPress={() => onRespond(c.id, 'cancelled')} style={styles.ghostBtn}>
              <Text style={styles.ghostBtnText}>Cancel</Text>
            </Pressable>
          ) : (
            <>
              <Pressable onPress={() => onRespond(c.id, 'declined')} style={styles.ghostBtn}>
                <Text style={styles.ghostBtnText}>Decline</Text>
              </Pressable>
              <Pressable onPress={() => onRespond(c.id, 'accepted')} style={styles.acceptBtn}>
                <Text style={styles.acceptBtnText}>Accept</Text>
              </Pressable>
            </>
          )}
        </View>
      )}
    </View>
  );
}

/* ── styles ────────────────────────────────────────────────────── */

const styles = StyleSheet.create({
  visCard: {
    backgroundColor: Palette.forest,
    borderRadius: Radius.lg,
    padding: Spacing.space4,
    marginBottom: Spacing.space4,
  },
  visRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.space3 },
  visIcon: {
    width: 38,
    height: 38,
    borderRadius: Radius.sm,
    backgroundColor: Palette.borderDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  visText: { flex: 1 },
  visTitle: { ...Typography.cardHeading, color: Palette.white },
  visSub: { ...Typography.supporting, color: 'rgba(245, 247, 242, 0.7)', marginTop: 2 },
  statusRow: { marginTop: Spacing.space3 },
  statusInput: {
    fontFamily: FontFamily.regular,
    fontSize: 14,
    color: Palette.white,
    backgroundColor: Palette.borderDark,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.space3,
    paddingVertical: 10,
  },
  notice: { ...Typography.supporting, color: Palette.amber, marginTop: Spacing.space2 },

  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.space2,
    backgroundColor: Palette.white,
    borderWidth: 1,
    borderColor: Palette.border,
    borderRadius: Radius.btn,
    paddingHorizontal: Spacing.space3,
    paddingVertical: Platform.OS === 'web' ? 10 : 6,
    marginBottom: Spacing.space3,
  },
  searchInput: { flex: 1, fontFamily: FontFamily.regular, fontSize: 14.5, color: Palette.ink },
  radiusRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.space2, marginBottom: Spacing.space4 },
  radiusLabel: { ...Typography.supporting, color: Palette.muted, marginRight: 2 },
  radiusChip: {
    paddingHorizontal: Spacing.space3,
    paddingVertical: 6,
    borderRadius: Radius.full,
    backgroundColor: Palette.surfaceSubtle,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  radiusChipActive: { backgroundColor: Palette.forest, borderColor: Palette.forest },
  radiusText: { ...Typography.supporting, fontFamily: FontFamily.medium, color: Palette.ink },
  radiusTextActive: { color: Palette.lime },

  sectionTitle: { ...Typography.sectionHeading, color: Palette.ink, marginBottom: Spacing.space3 },
  empty: {
    alignItems: 'center',
    gap: 6,
    backgroundColor: Palette.white,
    borderWidth: 1,
    borderColor: Palette.border,
    borderRadius: Radius.card,
    padding: Spacing.space5,
  },
  emptyTitle: { ...Typography.bodyBold, color: Palette.ink, textAlign: 'center' },
  emptyBody: { ...Typography.supporting, color: Palette.muted, textAlign: 'center' },

  card: {
    flexDirection: 'row',
    gap: Spacing.space3,
    backgroundColor: Palette.white,
    borderWidth: 1,
    borderColor: Palette.border,
    borderRadius: Radius.card,
    padding: Spacing.space3,
    marginBottom: Spacing.space3,
  },
  avatar: { width: 46, height: 46, borderRadius: Radius.full, alignItems: 'center', justifyContent: 'center' },
  cardBody: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  name: { ...Typography.cardHeading, color: Palette.ink, flexShrink: 1 },
  demoTag: {
    backgroundColor: Palette.surfaceSubtle,
    borderRadius: Radius.full,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  demoTagText: { fontFamily: FontFamily.medium, fontSize: 10, color: Palette.muted, letterSpacing: 0.3 },
  distancePill: {
    marginLeft: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(197, 243, 107, 0.35)',
    borderRadius: Radius.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  distanceText: { fontFamily: FontFamily.medium, fontSize: 11.5, color: Palette.forest },
  meta: { ...Typography.supporting, color: Palette.muted, marginTop: 1 },
  doing: { ...Typography.body, color: Palette.ink, marginTop: 6 },
  cardActions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: Spacing.space2 },
  seen: { ...Typography.supporting, fontSize: 11.5, color: Palette.muted },
  challengeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Palette.lime,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.space3,
    paddingVertical: 7,
  },
  challengeBtnText: { fontFamily: FontFamily.medium, fontSize: 13, color: Palette.ink },
  inChallenge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  inChallengeText: { fontFamily: FontFamily.medium, fontSize: 12.5, color: Palette.forest },

  pcCard: {
    backgroundColor: Palette.white,
    borderWidth: 1,
    borderColor: Palette.border,
    borderRadius: Radius.card,
    padding: Spacing.space3,
    marginBottom: Spacing.space3,
  },
  pcHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.space2 },
  avatarSm: { width: 34, height: 34, borderRadius: Radius.full, alignItems: 'center', justifyContent: 'center' },
  pcTitle: { ...Typography.bodyBold, color: Palette.ink },
  pcMeta: { ...Typography.supporting, color: Palette.muted },
  statusChip: { borderRadius: Radius.full, paddingHorizontal: 9, paddingVertical: 4, backgroundColor: Palette.surfaceSubtle },
  statusChipText: { fontFamily: FontFamily.medium, fontSize: 11, color: Palette.ink, textTransform: 'capitalize' },
  status_pending: { backgroundColor: 'rgba(232, 163, 74, 0.2)' },
  status_accepted: { backgroundColor: 'rgba(197, 243, 107, 0.5)' },
  status_completed: { backgroundColor: 'rgba(82, 121, 246, 0.18)' },
  status_declined: { backgroundColor: 'rgba(229, 108, 103, 0.18)' },
  status_cancelled: { backgroundColor: Palette.surfaceSubtle },
  pcProgress: { marginTop: Spacing.space3, gap: 8 },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.space2 },
  barLabel: { ...Typography.supporting, color: Palette.muted, width: 56 },
  barTrack: { flex: 1, height: 8, borderRadius: Radius.full, backgroundColor: Palette.surfaceSubtle, overflow: 'hidden' },
  barFill: { height: '100%', backgroundColor: Palette.lime, borderRadius: Radius.full },
  barFillOpp: { backgroundColor: Palette.electricBlue },
  barValue: { fontFamily: FontFamily.medium, fontSize: 12, color: Palette.ink, minWidth: 58, textAlign: 'right' },
  result: { ...Typography.bodyBold, color: Palette.forest, marginTop: 2 },
  pcActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: Spacing.space2, marginTop: Spacing.space3 },
  ghostBtn: { paddingHorizontal: Spacing.space3, paddingVertical: 7, borderRadius: Radius.full, borderWidth: 1, borderColor: Palette.border },
  ghostBtnText: { fontFamily: FontFamily.medium, fontSize: 13, color: Palette.muted },
  acceptBtn: { paddingHorizontal: Spacing.space4, paddingVertical: 7, borderRadius: Radius.full, backgroundColor: Palette.lime },
  acceptBtnText: { fontFamily: FontFamily.medium, fontSize: 13, color: Palette.ink },

  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Palette.overlay,
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Palette.white,
    borderTopLeftRadius: Radius.lg,
    borderTopRightRadius: Radius.lg,
    padding: Spacing.space5,
    paddingBottom: Spacing.space6,
  },
  sheetHandle: { alignSelf: 'center', width: 40, height: 4, borderRadius: Radius.full, backgroundColor: Palette.border, marginBottom: Spacing.space3 },
  sheetTitle: { ...Typography.sectionHeading, color: Palette.ink },
  sheetSub: { ...Typography.supporting, color: Palette.muted, marginBottom: Spacing.space3 },
  fieldLabel: { ...Typography.supporting, fontFamily: FontFamily.medium, color: Palette.muted, marginTop: Spacing.space3, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5, fontSize: 11 },
  segment: { flexDirection: 'row', backgroundColor: Palette.surfaceSubtle, borderRadius: Radius.btn, padding: 3 },
  segmentBtn: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: Radius.sm },
  segmentBtnActive: { backgroundColor: Palette.white },
  segmentText: { fontFamily: FontFamily.medium, fontSize: 13, color: Palette.muted },
  segmentTextActive: { color: Palette.forest },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.space2 },
  chip: { paddingHorizontal: Spacing.space3, paddingVertical: 8, borderRadius: Radius.full, backgroundColor: Palette.surfaceSubtle, borderWidth: 1, borderColor: Palette.border },
  chipActive: { backgroundColor: Palette.forest, borderColor: Palette.forest },
  chipText: { fontFamily: FontFamily.medium, fontSize: 13, color: Palette.ink },
  chipTextActive: { color: Palette.lime },
});
