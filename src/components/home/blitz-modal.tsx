/**
 * src/components/home/blitz-modal.tsx
 * ─────────────────────────────────────────────────────────────────
 * Blitz Battle: a short head to head bout scored on movement the
 * phone can actually measure.
 *
 *   Sprint Blitz  60s, most metres from GPS
 *   Step Blitz    90s, most steps from the pedometer
 *
 * Your score comes from SensorTracker, the same sensor path the
 * normal activity screen uses, so nothing here is invented. The
 * opponent is paced locally against their rating and is labelled as
 * a paced rival in the UI rather than passed off as a live player.
 * ─────────────────────────────────────────────────────────────────
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Image,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontFamily, Palette, Radius, Spacing, Typography } from '@/constants/theme';
import { AppIcon } from '@/components/ui/icon';
import {
  BLITZ_MODES,
  BLITZ_MODE_BY_ID,
  CAMPUS_BRAWL_CHALLENGERS,
  NEARBY_CHALLENGERS,
  RIVAL_CHALLENGERS,
} from '@/constants/blitz-data';
import {
  BlitzMatchStatus,
  BlitzMode,
  BlitzModeSpec,
  BlitzQueueType,
  BlitzResult,
  Challenger,
} from '@/types/blitz';
import { RouteMap } from '@/components/activity/route-map';
import { useAuth } from '@/context/auth-context';
import { BlitzRating, EMPTY_RATING, getRating, recordBout } from '@/services/blitz-elo';
import {
  BlitzRoom,
  BlitzRoomState,
  createRoomCode,
  normaliseRoomCode,
} from '@/services/blitz-room';
import { GeoPoint, SensorSnapshot, SensorTracker, describeSensors } from '@/services/sensors';

interface BlitzModalProps {
  visible: boolean;
  initialQueue: BlitzQueueType;
  /** Opened straight from a bout tile: skip the queue step. */
  initialMode?: BlitzMode;
  onClose: () => void;
}

const QUEUE_LABEL: Record<BlitzQueueType, string> = {
  stranger: 'Campus Brawl',
  nearby: 'Nearby',
  custom: 'Private Room',
};

function poolFor(queue: BlitzQueueType): Challenger[] {
  if (queue === 'nearby') return NEARBY_CHALLENGERS;
  if (queue === 'custom') return CAMPUS_BRAWL_CHALLENGERS;
  return RIVAL_CHALLENGERS;
}

function formatClock(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function BlitzModal({ visible, initialQueue, initialMode, onClose }: BlitzModalProps) {
  const [status, setStatus] = useState<BlitzMatchStatus>('queue_select');
  const [queue, setQueue] = useState<BlitzQueueType>(initialQueue);
  const [mode, setMode] = useState<BlitzModeSpec>(BLITZ_MODES[0]);
  const [opponent, setOpponent] = useState<Challenger | null>(null);
  const [countdown, setCountdown] = useState(3);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [playerScore, setPlayerScore] = useState(0);
  const [opponentScore, setOpponentScore] = useState(0);
  const [sensorNote, setSensorNote] = useState('Waiting for sensors');
  const [result, setResult] = useState<BlitzResult | null>(null);
  // GPS trail for the OpenStreetMap panel in a Sprint bout.
  const [route, setRoute] = useState<GeoPoint[]>([]);
  const [position, setPosition] = useState<GeoPoint | null>(null);
  const [rating, setRating] = useState<BlitzRating>(EMPTY_RATING);

  // Private room state. `roomRef` holds the live channel; `roomState`
  // is the snapshot the UI renders.
  const roomRef = useRef<BlitzRoom | null>(null);
  const [roomState, setRoomState] = useState<BlitzRoomState | null>(null);
  const [codeInput, setCodeInput] = useState('');
  const [joining, setJoining] = useState(false);
  /** Live opponent score, kept in a ref so the bout tick can read it. */
  const liveOpponentRef = useRef(0);

  const trackerRef = useRef<SensorTracker | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  /** Score at the moment the bout started, so only this bout counts. */
  const baselineRef = useRef(0);

  const { user, profile } = useAuth();
  const myElo = rating.elo;

  const stopEverything = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    trackerRef.current?.stop();
    trackerRef.current = null;
  }, []);

  const leaveRoom = useCallback(() => {
    roomRef.current?.leave();
    roomRef.current = null;
    setRoomState(null);
    setCodeInput('');
    setJoining(false);
    liveOpponentRef.current = 0;
  }, []);

  const reset = useCallback(() => {
    stopEverything();
    leaveRoom();
    setStatus('queue_select');
    setOpponent(null);
    setPlayerScore(0);
    setOpponentScore(0);
    setSecondsLeft(0);
    setCountdown(3);
    setResult(null);
    setSensorNote('Waiting for sensors');
    setRoute([]);
    setPosition(null);
  }, [stopEverything, leaveRoom]);

  /**
   * Arms the sheet for whichever tile opened it. Driven by the Modal's
   * own onShow rather than an effect on `visible`, so opening does not
   * cost an extra render pass.
   */
  const arm = useCallback(() => {
    getRating(user?.id).then(setRating);
    setQueue(initialQueue);
    if (initialMode) {
      setMode(BLITZ_MODE_BY_ID[initialMode]);
      setStatus('mode_select');
    } else {
      setStatus('queue_select');
    }
  }, [initialQueue, initialMode, user?.id]);

  const handleClose = useCallback(() => {
    reset();
    onClose();
  }, [reset, onClose]);

  useEffect(() => stopEverything, [stopEverything]);

  /** Reads the right number out of a sensor snapshot for this mode. */
  const scoreFromSnapshot = useCallback(
    (snap: SensorSnapshot, spec: BlitzModeSpec) =>
      spec.measurement === 'steps' ? snap.steps : Math.round(snap.distanceKm * 1000),
    []
  );

  const finish = useCallback(
    (finalPlayer: number, finalOpponent: number, spec: BlitzModeSpec, rival: Challenger | null) => {
      stopEverything();
      const won = finalPlayer > finalOpponent;
      const drawn = finalPlayer === finalOpponent;

      // Persist the bout, then show whatever the store actually applied.
      recordBout(user?.id, rival?.elo ?? myElo, won, drawn).then(({ rating: next, delta }) => {
        setRating(next);
        setResult((r) => (r ? { ...r, eloChange: delta } : r));
      });

      setResult({
        mode: spec,
        opponent: rival,
        playerScore: finalPlayer,
        opponentScore: finalOpponent,
        won,
        drawn,
        // Replaced by the stored swing as soon as the write lands.
        eloChange: 0,
        // A bout is short, so the reward is small on purpose.
        pointsEarned: won ? 25 : drawn ? 12 : 5,
      });
      setStatus('finished');
    },
    [stopEverything, myElo, user?.id]
  );

  /** Starts sensors and the bout clock. */
  const beginBout = useCallback(
    async (spec: BlitzModeSpec, rival: Challenger | null, live = false) => {
      setPlayerScore(0);
      setOpponentScore(0);
      liveOpponentRef.current = 0;
      setSecondsLeft(spec.durationSeconds);
      setStatus('active');

      const tracker = new SensorTracker({
        useSteps: spec.measurement === 'steps',
        useGps: spec.measurement === 'distance_km',
        onUpdate: (snap) => {
          setSensorNote(
            describeSensors(snap, spec.measurement === 'steps', spec.measurement === 'distance_km')
          );
          const mine = Math.max(0, scoreFromSnapshot(snap, spec) - baselineRef.current);
          setPlayerScore(mine);
          setRoute(snap.route);
          setPosition(snap.position);
          // In a room the other phone scores you off this number.
          if (live) roomRef.current?.publishScore(mine, false);
        },
      });
      trackerRef.current = tracker;
      await tracker.start();
      // Whatever the sensors had already accumulated is the zero point.
      baselineRef.current = scoreFromSnapshot(tracker.getSnapshot(), spec);

      // Rival pace: their par rate scaled by rating, with a little
      // per-tick wobble so the bar does not crawl in a straight line.
      const ratingFactor = (rival?.elo ?? 1500) / 1500;
      const perSecond = (spec.parScore / spec.durationSeconds) * ratingFactor;
      let elapsed = 0;
      let rivalScore = 0;

      timerRef.current = setInterval(() => {
        elapsed += 1;

        let rounded: number;
        if (live) {
          // Real opponent: whatever their phone last published.
          rounded = liveOpponentRef.current;
        } else {
          rivalScore += perSecond * (0.75 + Math.random() * 0.5);
          rounded = Math.round(rivalScore);
        }
        setOpponentScore(rounded);

        const remaining = spec.durationSeconds - elapsed;
        setSecondsLeft(remaining);

        if (remaining <= 0) {
          const snap = trackerRef.current?.getSnapshot();
          const mine = snap
            ? Math.max(0, scoreFromSnapshot(snap, spec) - baselineRef.current)
            : 0;
          if (live) roomRef.current?.publishScore(mine, true);
          finish(mine, rounded, spec, rival);
        }
      }, 1000);
    },
    [finish, scoreFromSnapshot]
  );

  /** Pick an opponent, show them, then count in. */
  const startSearch = useCallback(
    (spec: BlitzModeSpec) => {
      setMode(spec);
      // A private room is a real second player, so it skips matchmaking.
      if (queue === 'custom') {
        setStatus('room');
        return;
      }
      setStatus('searching');
      const pool = poolFor(queue);
      const pick = pool[Math.floor(Math.random() * pool.length)] ?? null;

      setTimeout(() => {
        setOpponent(pick);
        setStatus('matched');
      }, 1400);
    },
    [queue]
  );

  /* ── private room ────────────────────────────────────────────── */

  const openRoom = useCallback(
    async (code: string) => {
      leaveRoom();
      setJoining(true);
      const room = new BlitzRoom(code, {
        id: user?.id ?? `guest-${Math.random().toString(36).slice(2, 8)}`,
        name: profile.fullName?.trim() || user?.name?.trim() || 'Athlete',
        elo: rating.elo,
      });
      roomRef.current = room;
      room.subscribe(setRoomState);
      setStatus('room');
      await room.join();
      setJoining(false);
    },
    [leaveRoom, user?.id, user?.name, profile.fullName, rating.elo]
  );

  const hostRoom = useCallback(() => openRoom(createRoomCode()), [openRoom]);

  const handleStartRoomBout = useCallback(() => {
    roomRef.current?.startBout(mode.id);
  }, [mode.id]);

  const joinRoom = useCallback(() => {
    const code = normaliseRoomCode(codeInput);
    if (code) openRoom(code);
  }, [codeInput, openRoom]);

  /** The other person in the room, if anyone has joined yet. */
  const roomPeer = useMemo(() => {
    if (!roomState) return null;
    const meId = user?.id;
    return roomState.members.find((m) => m.id !== meId) ?? null;
  }, [roomState, user?.id]);

  // Keep the live rival score where the bout tick can read it.
  useEffect(() => {
    if (roomPeer) liveOpponentRef.current = roomPeer.score;
  }, [roomPeer]);

  // Both phones leave the lobby together, on the host's start broadcast.
  useEffect(() => {
    if (status !== 'room' || !roomState?.mode || !roomState.startedAt) return;
    const spec = BLITZ_MODE_BY_ID[roomState.mode];
    // The host's broadcast is an external event, not render-derived
    // state, so adopting it here is exactly what an effect is for.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMode(spec);
    setOpponent(
      roomPeer
        ? {
            id: roomPeer.id,
            name: roomPeer.name,
            college: 'Private room',
            avatar: '',
            elo: roomPeer.elo,
            isOnline: true,
          }
        : null
    );
    // Wait out the host's lead-in so both clocks start together.
    const waitMs = Math.max(0, roomState.startedAt - Date.now());
    const id = setTimeout(() => beginBout(spec, null, true), waitMs);
    return () => clearTimeout(id);
    // `roomPeer` only renames the opponent; re-running would restart the bout.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, roomState?.mode, roomState?.startedAt, beginBout]);

  // Count in, then start the bout.
  useEffect(() => {
    if (status !== 'countdown') return;
    let n = countdown;
    const id = setInterval(() => {
      n -= 1;
      setCountdown(n);
      if (n <= 0) {
        clearInterval(id);
        beginBout(mode, opponent);
      }
    }, 900);
    return () => clearInterval(id);
    // `countdown` is the seed set alongside the status change; re-running
    // on every tick would restart the count.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, mode, opponent, beginBout]);

  const goToCountdown = useCallback(() => {
    setCountdown(3);
    setStatus('countdown');
  }, []);

  const leadRatio = useMemo(() => {
    const total = playerScore + opponentScore;
    if (total === 0) return 0;
    return (playerScore - opponentScore) / total;
  }, [playerScore, opponentScore]);

  /* ── screens ─────────────────────────────────────────────────── */

  function renderQueueSelect() {
    const queues: { id: BlitzQueueType; title: string; meta: string; icon: string }[] = [
      { id: 'stranger', title: 'Campus Brawl', meta: 'Random rival from another college', icon: 'flash' },
      { id: 'nearby', title: 'Nearby', meta: 'Someone within a few hundred metres', icon: 'navigate' },
      { id: 'custom', title: 'Private Room', meta: 'Battle a friend from your own campus', icon: 'key' },
    ];
    return (
      <View style={styles.page}>
        <Text style={styles.pageTitle}>Who are you up against?</Text>
        <Text style={styles.pageSub}>Pick a queue, then the kind of bout.</Text>

        <View style={styles.optionList}>
          {queues.map((q) => {
            const active = q.id === queue;
            return (
              <Pressable
                key={q.id}
                onPress={() => setQueue(q.id)}
                style={[styles.optionRow, active && styles.optionRowActive]}
                accessibilityRole="button"
                accessibilityLabel={q.title}>
                <View style={[styles.optionIcon, active && styles.optionIconActive]}>
                  <AppIcon name={q.icon} size={16} color={active ? Palette.forest : Palette.muted} />
                </View>
                <View style={styles.optionText}>
                  <Text style={styles.optionTitle}>{q.title}</Text>
                  <Text style={styles.optionMeta}>{q.meta}</Text>
                </View>
                <AppIcon
                  name={active ? 'radio-button-on' : 'radio-button-off'}
                  size={18}
                  color={active ? Palette.forest : Palette.border}
                />
              </Pressable>
            );
          })}
        </View>

        <Pressable style={styles.primaryBtn} onPress={() => setStatus('mode_select')}>
          <Text style={styles.primaryBtnText}>Choose bout</Text>
          <AppIcon name="arrow-forward" size={16} color={Palette.forest} />
        </Pressable>
      </View>
    );
  }

  function renderModeSelect() {
    return (
      <View style={styles.page}>
        <Text style={styles.pageTitle}>Running or walking?</Text>
        <Text style={styles.pageSub}>
          Both are scored from the phone sensors you already use, nothing else.
        </Text>

        <View style={styles.modeGrid}>
          {BLITZ_MODES.map((m) => {
            const active = m.id === mode.id;
            return (
              <Pressable
                key={m.id}
                onPress={() => setMode(m)}
                style={[styles.modeCard, active && styles.modeCardActive]}
                accessibilityRole="button"
                accessibilityLabel={m.name}>
                <View style={[styles.modeIcon, active && styles.modeIconActive]}>
                  <AppIcon name={m.icon} size={20} color={active ? Palette.forest : Palette.muted} />
                </View>
                <Text style={styles.modeName}>{m.name}</Text>
                <Text style={styles.modeTagline}>{m.tagline}</Text>
                <View style={styles.modeFootRow}>
                  <Text style={styles.modeFootText}>{m.durationSeconds}s</Text>
                  <View style={styles.modeFootDot} />
                  <Text style={styles.modeFootText}>
                    {m.measurement === 'steps' ? 'Pedometer' : 'GPS'}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.noteBox}>
          <AppIcon name="information-circle-outline" size={14} color={Palette.muted} />
          <Text style={styles.noteText}>
            Sprint Blitz needs location permission. Step Blitz falls back to motion sensing when
            the pedometer is not available.
          </Text>
        </View>

        <View style={styles.btnRow}>
          <Pressable style={styles.ghostBtn} onPress={() => setStatus('queue_select')}>
            <Text style={styles.ghostBtnText}>Back</Text>
          </Pressable>
          <Pressable style={[styles.primaryBtn, styles.primaryBtnFlex]} onPress={() => startSearch(mode)}>
            <Text style={styles.primaryBtnText}>
              {queue === 'custom' ? 'Open room' : 'Find opponent'}
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  function renderRoom() {
    // Before a code exists, offer to host one or type one in.
    if (!roomState) {
      return (
        <View style={styles.page}>
          <Text style={styles.pageTitle}>Private room</Text>
          <Text style={styles.pageSub}>
            Host a room and share the code, or type the code a friend gave you. Both phones run
            {' '}{mode.name} at the same time.
          </Text>

          <Pressable style={styles.primaryBtn} onPress={hostRoom} disabled={joining}>
            <AppIcon name="add-circle-outline" size={16} color={Palette.forest} />
            <Text style={styles.primaryBtnText}>Host a room</Text>
          </Pressable>

          <View style={styles.orRow}>
            <View style={styles.orLine} />
            <Text style={styles.orText}>or join one</Text>
            <View style={styles.orLine} />
          </View>

          <TextInput
            value={codeInput}
            onChangeText={(t) => setCodeInput(t.toUpperCase())}
            placeholder="ROOM CODE"
            placeholderTextColor={Palette.muted}
            autoCapitalize="characters"
            autoCorrect={false}
            maxLength={8}
            style={styles.codeInput}
            accessibilityLabel="Room code"
          />
          <Pressable
            style={[styles.ghostBtn, !normaliseRoomCode(codeInput) && styles.btnDisabled]}
            onPress={joinRoom}
            disabled={!normaliseRoomCode(codeInput) || joining}>
            <Text style={styles.ghostBtnText}>Join room</Text>
          </Pressable>

          <Pressable style={styles.ghostBtn} onPress={() => setStatus('mode_select')}>
            <Text style={styles.ghostBtnText}>Back</Text>
          </Pressable>
        </View>
      );
    }

    const ready = roomState.members.length >= 2;
    return (
      <View style={styles.page}>
        <Text style={styles.pageTitle}>Room {roomState.code}</Text>
        <Text style={styles.pageSub}>
          {mode.name} · {mode.durationSeconds} seconds. Share the code to let someone in.
        </Text>

        <View style={styles.codeBanner}>
          <Text style={styles.codeBannerText}>{roomState.code}</Text>
        </View>

        {roomState.error ? (
          <View style={styles.noteBox}>
            <AppIcon name="alert-circle-outline" size={14} color={Palette.coral} />
            <Text style={[styles.noteText, styles.noteTextError]}>{roomState.error}</Text>
          </View>
        ) : null}

        <View style={styles.memberList}>
          {roomState.members.map((m) => (
            <View key={m.id} style={styles.memberRow}>
              <View style={styles.memberDot} />
              <Text style={styles.memberName} numberOfLines={1}>
                {m.id === user?.id ? `${m.name} (you)` : m.name}
              </Text>
              <Text style={styles.memberElo}>{m.elo} Elo</Text>
            </View>
          ))}
          {!ready ? (
            <View style={styles.memberRow}>
              <ActivityIndicator size="small" color={Palette.muted} />
              <Text style={styles.memberWaiting}>Waiting for another player</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.noteBox}>
          <AppIcon name="information-circle-outline" size={14} color={Palette.muted} />
          <Text style={styles.noteText}>
            {roomState.isHost
              ? 'You are the host. Start when everyone is on the line.'
              : 'The host starts the bout. Both phones count down together.'}
          </Text>
        </View>

        <View style={styles.btnRow}>
          <Pressable
            style={styles.ghostBtn}
            onPress={() => {
              leaveRoom();
              setStatus('mode_select');
            }}>
            <Text style={styles.ghostBtnText}>Leave</Text>
          </Pressable>
          {roomState.isHost ? (
            <Pressable
              style={[styles.primaryBtn, styles.primaryBtnFlex, !ready && styles.btnDisabled]}
              onPress={handleStartRoomBout}
              disabled={!ready}>
              <Text style={styles.primaryBtnText}>Start bout</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    );
  }

  function renderSearching() {
    return (
      <View style={[styles.page, styles.pageCenter]}>
        <ActivityIndicator size="large" color={Palette.forest} />
        <Text style={styles.searchTitle}>Finding a rival</Text>
        <Text style={styles.pageSub}>{QUEUE_LABEL[queue]} queue · {mode.name}</Text>
        <Pressable style={styles.ghostBtn} onPress={() => setStatus('mode_select')}>
          <Text style={styles.ghostBtnText}>Cancel</Text>
        </Pressable>
      </View>
    );
  }

  function renderMatched() {
    if (!opponent) return null;
    return (
      <View style={styles.page}>
        <Text style={styles.pageTitle}>Matched</Text>
        <Text style={styles.pageSub}>{mode.name} · {mode.durationSeconds} seconds</Text>

        <View style={styles.versusCard}>
          <View style={styles.versusSide}>
            <View style={styles.versusAvatarFallback}>
              <AppIcon name="person" size={22} color={Palette.forest} />
            </View>
            <Text style={styles.versusName}>You</Text>
            <Text style={styles.versusElo}>{myElo} Elo</Text>
          </View>

          <View style={styles.versusMiddle}>
            <Text style={styles.versusVs}>VS</Text>
          </View>

          <View style={styles.versusSide}>
            <Image source={{ uri: opponent.avatar }} style={styles.versusAvatar} />
            <Text style={styles.versusName} numberOfLines={1}>
              {opponent.name.split(' ')[0]}
            </Text>
            <Text style={styles.versusElo}>{opponent.elo} Elo</Text>
          </View>
        </View>

        <View style={styles.oppMetaCard}>
          <Text style={styles.oppMetaLine} numberOfLines={1}>
            {opponent.college}
          </Text>
          {opponent.locationTag ? (
            <Text style={styles.oppMetaSub} numberOfLines={1}>
              {opponent.locationTag}
              {opponent.distanceMeters ? ` · ${opponent.distanceMeters}m away` : ''}
            </Text>
          ) : null}
          <Text style={styles.oppMetaSub}>Paced rival, not a live player</Text>
        </View>

        <View style={styles.btnRow}>
          <Pressable style={styles.ghostBtn} onPress={() => setStatus('mode_select')}>
            <Text style={styles.ghostBtnText}>Re-roll</Text>
          </Pressable>
          <Pressable
            style={[styles.primaryBtn, styles.primaryBtnFlex]}
            onPress={goToCountdown}>
            <Text style={styles.primaryBtnText}>Start bout</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  function renderCountdown() {
    return (
      <View style={[styles.page, styles.pageCenter]}>
        <Text style={styles.countdownNumber}>{countdown > 0 ? countdown : 'GO'}</Text>
        <Text style={styles.pageSub}>
          {mode.measurement === 'steps' ? 'Start walking when it hits GO' : 'Start running when it hits GO'}
        </Text>
      </View>
    );
  }

  function renderActive() {
    const barLeft = 50 + leadRatio * 50;
    return (
      <View style={styles.page}>
        <View style={styles.clockBlock}>
          <Text style={styles.clockValue}>{formatClock(Math.max(0, secondsLeft))}</Text>
          <Text style={styles.clockLabel}>{mode.name}</Text>
        </View>

        <View style={styles.scoreRow}>
          <View style={styles.scoreCell}>
            <Text style={styles.scoreValue}>{playerScore}</Text>
            <Text style={styles.scoreUnit}>{mode.unit}</Text>
            <Text style={styles.scoreWho}>You</Text>
          </View>
          <View style={styles.scoreDivider} />
          <View style={styles.scoreCell}>
            <Text style={[styles.scoreValue, styles.scoreValueRival]}>{opponentScore}</Text>
            <Text style={styles.scoreUnit}>{mode.unit}</Text>
            <Text style={styles.scoreWho} numberOfLines={1}>
              {opponent ? opponent.name.split(' ')[0] : 'Rival'}
            </Text>
          </View>
        </View>

        <View style={styles.tugTrack}>
          <View style={[styles.tugFill, { width: `${Math.max(2, Math.min(98, barLeft))}%` }]} />
          <View style={styles.tugCentre} />
        </View>
        <Text style={styles.tugLabel}>
          {leadRatio > 0.02 ? 'You are ahead' : leadRatio < -0.02 ? 'You are behind' : 'Level'}
        </Text>

        {/* Sprint bouts run on GPS, so show the real ground covered. */}
        {mode.measurement === 'distance_km' ? (
          <View style={styles.mapBlock}>
            <RouteMap route={route} position={position} follow />
            <Text style={styles.mapCaption}>
              Your live route on OpenStreetMap. The rival is paced, not plotted.
            </Text>
          </View>
        ) : null}

        <View style={styles.noteBox}>
          <AppIcon name="pulse-outline" size={14} color={Palette.muted} />
          <Text style={styles.noteText}>{sensorNote}</Text>
        </View>

        <Pressable
          style={styles.ghostBtn}
          onPress={() => finish(playerScore, opponentScore, mode, opponent)}>
          <Text style={styles.ghostBtnText}>End early</Text>
        </Pressable>
      </View>
    );
  }

  function renderFinished() {
    if (!result) return null;
    const verdict = result.drawn ? 'Draw' : result.won ? 'You win' : 'You lose';
    return (
      <View style={styles.page}>
        <View
          style={[
            styles.verdictBanner,
            result.won && styles.verdictBannerWin,
            result.drawn && styles.verdictBannerDraw,
          ]}>
          <Text style={styles.verdictText}>{verdict}</Text>
          <Text style={styles.verdictSub}>
            {result.playerScore} vs {result.opponentScore} {result.mode.unit}
          </Text>
        </View>

        <View style={styles.rewardGrid}>
          <View style={styles.rewardCard}>
            <Text style={styles.rewardValue}>
              {result.eloChange >= 0 ? '+' : ''}
              {result.eloChange}
            </Text>
            <Text style={styles.rewardLabel}>Elo · now {rating.elo}</Text>
          </View>
          <View style={styles.rewardCard}>
            <Text style={styles.rewardValue}>+{result.pointsEarned}</Text>
            <Text style={styles.rewardLabel}>Points</Text>
          </View>
        </View>

        <View style={styles.noteBox}>
          <AppIcon name="information-circle-outline" size={14} color={Palette.muted} />
          <Text style={styles.noteText}>
            Blitz results are not saved as an activity. Log a full walk or run from the Activity tab
            for that.
          </Text>
        </View>

        <View style={styles.btnRow}>
          <Pressable style={styles.ghostBtn} onPress={reset}>
            <Text style={styles.ghostBtnText}>Rematch</Text>
          </Pressable>
          <Pressable style={[styles.primaryBtn, styles.primaryBtnFlex]} onPress={handleClose}>
            <Text style={styles.primaryBtnText}>Done</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const body = (() => {
    switch (status) {
      case 'queue_select':
        return renderQueueSelect();
      case 'mode_select':
        return renderModeSelect();
      case 'room':
        return renderRoom();
      case 'searching':
        return renderSearching();
      case 'matched':
        return renderMatched();
      case 'countdown':
        return renderCountdown();
      case 'active':
        return renderActive();
      case 'finished':
        return renderFinished();
      default:
        return null;
    }
  })();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onShow={arm}
      onRequestClose={handleClose}
      transparent={false}>
      <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
        <View style={styles.topBar}>
          <View style={styles.topBarTitleWrap}>
            <Text style={styles.topBarTitle}>Blitz Battle</Text>
            <Text style={styles.topBarSub}>{QUEUE_LABEL[queue]}</Text>
          </View>
          <Pressable
            onPress={handleClose}
            hitSlop={10}
            style={styles.closeBtn}
            accessibilityRole="button"
            accessibilityLabel="Close blitz battle">
            <AppIcon name="close" size={18} color={Palette.ink} />
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollBody}
          showsVerticalScrollIndicator={false}>
          {body}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Palette.white,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.space4,
    paddingVertical: Spacing.space3,
    borderBottomWidth: 1,
    borderBottomColor: Palette.border,
  },
  topBarTitleWrap: {
    flex: 1,
  },
  topBarTitle: {
    ...Typography.sectionHeading,
    color: Palette.ink,
  },
  topBarSub: {
    ...Typography.supporting,
    color: Palette.muted,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: Radius.full,
    backgroundColor: Palette.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollBody: {
    padding: Spacing.space4,
    paddingBottom: Spacing.space8,
    maxWidth: 600,
    width: '100%',
    alignSelf: 'center',
  },
  page: {
    gap: Spacing.space3,
  },
  pageCenter: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.space8,
    gap: Spacing.space4,
  },
  pageTitle: {
    ...Typography.pageTitle,
    fontSize: 24,
    lineHeight: 30,
    color: Palette.ink,
  },
  pageSub: {
    ...Typography.supporting,
    color: Palette.muted,
  },

  /* queue list */
  optionList: {
    gap: Spacing.space2,
    marginTop: Spacing.space2,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.space3,
    padding: Spacing.space3,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Palette.border,
    backgroundColor: Palette.white,
  },
  optionRowActive: {
    borderColor: Palette.forest,
    backgroundColor: Palette.surfaceHighlight,
  },
  optionIcon: {
    width: 36,
    height: 36,
    borderRadius: Radius.sm,
    backgroundColor: Palette.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionIconActive: {
    backgroundColor: Palette.lime,
  },
  optionText: {
    flex: 1,
  },
  optionTitle: {
    ...Typography.bodyBold,
    color: Palette.ink,
  },
  optionMeta: {
    ...Typography.supporting,
    color: Palette.muted,
  },

  /* mode cards */
  modeGrid: {
    flexDirection: 'row',
    gap: Spacing.space3,
    marginTop: Spacing.space2,
  },
  modeCard: {
    flex: 1,
    padding: Spacing.space3,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Palette.border,
    backgroundColor: Palette.white,
    gap: 6,
  },
  modeCardActive: {
    borderColor: Palette.forest,
    backgroundColor: Palette.surfaceHighlight,
  },
  modeIcon: {
    width: 40,
    height: 40,
    borderRadius: Radius.sm,
    backgroundColor: Palette.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeIconActive: {
    backgroundColor: Palette.lime,
  },
  modeName: {
    ...Typography.cardHeading,
    color: Palette.ink,
  },
  modeTagline: {
    ...Typography.supporting,
    color: Palette.muted,
  },
  modeFootRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  modeFootText: {
    fontSize: 11,
    fontFamily: FontFamily.medium,
    color: Palette.forest,
  },
  modeFootDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: Palette.border,
  },

  /* shared bits */
  noteBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.space2,
    padding: Spacing.space3,
    borderRadius: Radius.sm,
    backgroundColor: Palette.surfaceSubtle,
  },
  noteText: {
    ...Typography.supporting,
    color: Palette.muted,
    flex: 1,
  },
  btnRow: {
    flexDirection: 'row',
    gap: Spacing.space2,
    marginTop: Spacing.space2,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.space2,
    paddingVertical: 14,
    paddingHorizontal: Spacing.space5,
    borderRadius: Radius.btn,
    backgroundColor: Palette.lime,
  },
  primaryBtnFlex: {
    flex: 1,
  },
  primaryBtnText: {
    ...Typography.bodyBold,
    color: Palette.forest,
  },
  ghostBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: Spacing.space5,
    borderRadius: Radius.btn,
    borderWidth: 1,
    borderColor: Palette.border,
    backgroundColor: Palette.white,
  },
  ghostBtnText: {
    ...Typography.bodyBold,
    color: Palette.ink,
  },

  /* private room */
  orRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.space3,
  },
  orLine: {
    flex: 1,
    height: 1,
    backgroundColor: Palette.border,
  },
  orText: {
    ...Typography.supporting,
    color: Palette.muted,
  },
  codeInput: {
    borderWidth: 1,
    borderColor: Palette.border,
    borderRadius: Radius.btn,
    paddingVertical: 14,
    paddingHorizontal: Spacing.space4,
    fontFamily: FontFamily.bold,
    fontSize: 20,
    letterSpacing: 4,
    textAlign: 'center',
    color: Palette.ink,
    backgroundColor: Palette.white,
  },
  codeBanner: {
    alignItems: 'center',
    paddingVertical: Spacing.space4,
    borderRadius: Radius.card,
    backgroundColor: Palette.surfaceHighlight,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  codeBannerText: {
    fontFamily: FontFamily.bold,
    fontSize: 34,
    lineHeight: 40,
    letterSpacing: 8,
    color: Palette.forest,
  },
  memberList: {
    gap: Spacing.space2,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.space3,
    paddingVertical: Spacing.space3,
    paddingHorizontal: Spacing.space3,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Palette.border,
    backgroundColor: Palette.white,
  },
  memberDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#34D399',
  },
  memberName: {
    ...Typography.bodyBold,
    color: Palette.ink,
    flex: 1,
  },
  memberElo: {
    ...Typography.supporting,
    color: Palette.muted,
  },
  memberWaiting: {
    ...Typography.supporting,
    color: Palette.muted,
    flex: 1,
  },
  btnDisabled: {
    opacity: 0.45,
  },
  noteTextError: {
    color: Palette.coral,
  },

  /* searching */
  searchTitle: {
    ...Typography.sectionHeading,
    color: Palette.ink,
  },

  /* matched */
  versusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.space4,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Palette.border,
    backgroundColor: Palette.surfaceHighlight,
  },
  versusSide: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  versusMiddle: {
    paddingHorizontal: Spacing.space3,
  },
  versusVs: {
    ...Typography.bodyBold,
    color: Palette.muted,
    letterSpacing: 1,
  },
  versusAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Palette.surfaceSubtle,
  },
  versusAvatarFallback: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Palette.lime,
    alignItems: 'center',
    justifyContent: 'center',
  },
  versusName: {
    ...Typography.bodyBold,
    color: Palette.ink,
  },
  versusElo: {
    ...Typography.supporting,
    color: Palette.muted,
  },
  oppMetaCard: {
    padding: Spacing.space3,
    borderRadius: Radius.sm,
    backgroundColor: Palette.surfaceSubtle,
    gap: 2,
  },
  oppMetaLine: {
    ...Typography.bodyBold,
    color: Palette.ink,
  },
  oppMetaSub: {
    ...Typography.supporting,
    color: Palette.muted,
  },

  /* countdown */
  countdownNumber: {
    fontFamily: FontFamily.bold,
    fontSize: 88,
    lineHeight: 96,
    color: Palette.forest,
    letterSpacing: -2,
  },

  /* active */
  clockBlock: {
    alignItems: 'center',
    paddingVertical: Spacing.space3,
  },
  clockValue: {
    ...Typography.stats,
    fontSize: 46,
    lineHeight: 52,
    color: Palette.ink,
  },
  clockLabel: {
    ...Typography.supporting,
    color: Palette.muted,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Palette.border,
    backgroundColor: Palette.white,
    paddingVertical: Spacing.space4,
  },
  scoreCell: {
    flex: 1,
    alignItems: 'center',
    gap: 1,
  },
  scoreDivider: {
    width: 1,
    alignSelf: 'stretch',
    backgroundColor: Palette.border,
  },
  scoreValue: {
    ...Typography.stats,
    color: Palette.forest,
  },
  scoreValueRival: {
    color: Palette.electricBlue,
  },
  scoreUnit: {
    ...Typography.supporting,
    color: Palette.muted,
  },
  scoreWho: {
    ...Typography.bodyBold,
    color: Palette.ink,
    marginTop: 2,
  },
  tugTrack: {
    height: 10,
    borderRadius: Radius.full,
    backgroundColor: Palette.surfaceSubtle,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  tugFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: Palette.lime,
  },
  tugCentre: {
    position: 'absolute',
    left: '50%',
    width: 2,
    top: 0,
    bottom: 0,
    backgroundColor: Palette.border,
  },
  tugLabel: {
    ...Typography.supporting,
    color: Palette.muted,
    textAlign: 'center',
  },

  mapBlock: {
    gap: 6,
  },
  mapCaption: {
    ...Typography.supporting,
    color: Palette.muted,
    textAlign: 'center',
  },

  /* finished */
  verdictBanner: {
    padding: Spacing.space5,
    borderRadius: Radius.card,
    alignItems: 'center',
    gap: 4,
    backgroundColor: Palette.surfaceSubtle,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  verdictBannerWin: {
    backgroundColor: Palette.lime,
    borderColor: Palette.lime,
  },
  verdictBannerDraw: {
    backgroundColor: Palette.surfaceHighlight,
  },
  verdictText: {
    ...Typography.pageTitle,
    fontSize: 26,
    color: Palette.forest,
  },
  verdictSub: {
    ...Typography.supporting,
    color: Palette.forest,
  },
  rewardGrid: {
    flexDirection: 'row',
    gap: Spacing.space3,
  },
  rewardCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.space4,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Palette.border,
    backgroundColor: Palette.white,
    gap: 2,
  },
  rewardValue: {
    ...Typography.stats,
    fontSize: 26,
    lineHeight: 32,
    color: Palette.ink,
  },
  rewardLabel: {
    ...Typography.supporting,
    color: Palette.muted,
  },
});
