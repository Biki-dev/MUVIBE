import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Palette, Radius, Spacing, Typography, FontFamily } from '@/constants/theme';
import { AppIcon } from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { ActivityType, ActivityRecord } from '@/types/activity';
import {
  createSession,
  getElapsedSeconds,
  getElapsedString,
  formatDuration,
  estimateCalories,
  stepsToDistance,
  calculatePace,
  calculateSpeed,
  TrackingSession,
  TrackingStatus,
} from '@/services/tracking-engine';
import { saveActivity } from '@/services/activity-storage';
import { SensorTracker, SensorSnapshot, describeSensors } from '@/services/sensors';
import { RouteMap } from '@/components/activity/route-map';
import { useAuth } from '@/context/auth-context';
import { InstaShareModal } from '@/components/share/insta-share-modal';

const EMPTY_SNAPSHOT: SensorSnapshot = {
  steps: 0,
  distanceKm: 0,
  speedKmh: 0,
  route: [],
  position: null,
  pedometer: 'idle',
  gps: 'idle',
};

interface ActivityMeta {
  label: string;
  primaryMetric: 'steps' | 'distance' | 'jumps' | 'duration';
  trackingModeLabel: string;
  iconName: string;
  iconType: 'ion' | 'mci';
  showSteps: boolean;
  showDistance: boolean;
  showJumps: boolean;
  showPace: boolean;
  showSpeed: boolean;
  sensorNote: string;
}

const ACTIVITY_METAS: Record<string, ActivityMeta> = {
  walking: {
    label: 'Walking',
    primaryMetric: 'steps',
    trackingModeLabel: 'Steps & GPS',
    iconName: 'walk',
    iconType: 'mci',
    showSteps: true,
    showDistance: true,
    showJumps: false,
    showPace: true,
    showSpeed: false,
    sensorNote: 'Pedometer sensor estimation active (~0.75m stride)',
  },
  running: {
    label: 'Running',
    primaryMetric: 'distance',
    trackingModeLabel: 'GPS & Steps',
    iconName: 'run',
    iconType: 'mci',
    showSteps: true,
    showDistance: true,
    showJumps: false,
    showPace: true,
    showSpeed: false,
    sensorNote: 'Pace & distance estimation active (~0.95m stride)',
  },
  cycling: {
    label: 'Cycling',
    primaryMetric: 'distance',
    trackingModeLabel: 'GPS Route',
    iconName: 'bicycle-outline',
    iconType: 'ion',
    showSteps: false,
    showDistance: true,
    showJumps: false,
    showPace: false,
    showSpeed: true,
    sensorNote: 'Speed & distance tracking active (~18.5 km/h avg)',
  },
  jump_rope: {
    label: 'Jump Rope',
    primaryMetric: 'jumps',
    trackingModeLabel: 'Jump Timer',
    iconName: 'timer-outline',
    iconType: 'ion',
    showSteps: false,
    showDistance: false,
    showJumps: true,
    showPace: false,
    showSpeed: false,
    sensorNote: 'Motion cadence detection active (~110 jumps/min)',
  },
  gym: {
    label: 'Workout / Gym',
    primaryMetric: 'duration',
    trackingModeLabel: 'Strength Session Timer',
    iconName: 'barbell-outline',
    iconType: 'ion',
    showSteps: false,
    showDistance: false,
    showJumps: false,
    showPace: false,
    showSpeed: false,
    sensorNote: 'Duration timer active • Manual notes enabled',
  },
  yoga: {
    label: 'Yoga',
    primaryMetric: 'duration',
    trackingModeLabel: 'Mindful Flow Timer',
    iconName: 'body-outline',
    iconType: 'ion',
    showSteps: false,
    showDistance: false,
    showJumps: false,
    showPace: false,
    showSpeed: false,
    sensorNote: 'Duration timer active • Zen mode',
  },
  swimming: {
    label: 'Swimming',
    primaryMetric: 'duration',
    trackingModeLabel: 'Pool / Lap Timer',
    iconName: 'water-outline',
    iconType: 'ion',
    showSteps: false,
    showDistance: true,
    showJumps: false,
    showPace: false,
    showSpeed: false,
    sensorNote: 'Safe poolside duration timer • Enter distance at completion',
  },
  hiking: {
    label: 'Hiking',
    primaryMetric: 'distance',
    trackingModeLabel: 'GPS Trail',
    iconName: 'trail-sign-outline',
    iconType: 'ion',
    showSteps: true,
    showDistance: true,
    showJumps: false,
    showPace: true,
    showSpeed: false,
    sensorNote: 'Trail distance & step counter active',
  },
  other: {
    label: 'Activity',
    primaryMetric: 'duration',
    trackingModeLabel: 'General Activity Timer',
    iconName: 'shapes-outline',
    iconType: 'ion',
    showSteps: false,
    showDistance: false,
    showJumps: false,
    showPace: false,
    showSpeed: false,
    sensorNote: 'General activity duration timer',
  },
};

export default function TrackingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ type?: string }>();
  const activityType: ActivityType = (params.type as ActivityType) || 'walking';
  const meta: ActivityMeta = ACTIVITY_METAS[activityType] || ACTIVITY_METAS.other;
  const { profile } = useAuth();

  const [session, setSession] = useState<TrackingSession>(() =>
    createSession(activityType)
  );
  const [elapsedString, setElapsedString] = useState('00:00');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Completion modal state
  const [isCompletionModalOpen, setIsCompletionModalOpen] = useState(false);

  // Instagram share state
  const [savedActivity, setSavedActivity] = useState<ActivityRecord | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [finalDurationSec, setFinalDurationSec] = useState(0);
  const [finalDistanceInput, setFinalDistanceInput] = useState('');
  const [finalStepsInput, setFinalStepsInput] = useState('');
  const [finalJumpsInput, setFinalJumpsInput] = useState('');
  const [finalCaloriesInput, setFinalCaloriesInput] = useState('');
  const [sessionNotes, setSessionNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Confirmations are an in-app dialog rather than Alert.alert, which is a
  // no-op on React Native Web: on web the Finish button did nothing at all.
  const [confirm, setConfirm] = useState<'finish' | 'exit' | null>(null);

  const sessionRef = useRef<TrackingSession>(session);
  sessionRef.current = session;

  // Real sensors. Steps come from the pedometer, distance and speed from
  // GPS. When neither is available the numbers simply stay at zero and the
  // user enters totals at the end: nothing is invented.
  const usesSteps = meta.showSteps;
  const usesGps = meta.showDistance && activityType !== 'swimming';
  const trackerRef = useRef<SensorTracker | null>(null);
  const [sensors, setSensors] = useState<SensorSnapshot>(EMPTY_SNAPSHOT);

  const applySnapshot = (snap: SensorSnapshot) => {
    setSensors(snap);
    setSession((prev) => {
      // "estimated" is the accelerometer fallback, which counts just as
      // legitimately as the pedometer; it is simply less precise.
      const counting = snap.pedometer === 'active' || snap.pedometer === 'estimated';
      const steps = counting ? snap.steps : prev.steps;

      // GPS is the truth for distance when it is on. Otherwise, for step
      // activities, estimate from stride so the number still means something.
      let distanceKm = prev.distanceKm;
      if (snap.gps === 'active') {
        distanceKm = snap.distanceKm;
      } else if (
        counting &&
        (activityType === 'walking' || activityType === 'running' || activityType === 'hiking')
      ) {
        distanceKm = stepsToDistance(steps, activityType === 'running' ? 'running' : 'walking');
      }

      return { ...prev, steps, distanceKm };
    });
  };

  const ensureTracker = () => {
    if (!trackerRef.current) {
      trackerRef.current = new SensorTracker({
        useSteps: usesSteps,
        useGps: usesGps,
        onUpdate: applySnapshot,
      });
    }
    return trackerRef.current;
  };

  useEffect(() => {
    return () => {
      trackerRef.current?.stop();
    };
  }, []);

  // Clock tick: elapsed time and the calorie estimate that depends on it.
  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null;

    if (session.status === 'active') {
      timer = setInterval(() => {
        const cur = sessionRef.current;
        const totalSec = getElapsedSeconds(cur);
        setElapsedSeconds(totalSec);
        setElapsedString(getElapsedString(cur));

        setSession((prev) => ({
          ...prev,
          calories: estimateCalories(
            activityType,
            totalSec,
            prev.distanceKm,
            prev.steps,
            prev.jumpCount
          ),
        }));
      }, 1000);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [session.status, activityType]);

  const handleStart = () => {
    const now = Date.now();
    setSession((prev) => ({
      ...prev,
      status: 'active',
      startTime: now,
      pausedDuration: 0,
      pausedAt: null,
    }));
    ensureTracker().start();
  };

  const handlePause = () => {
    trackerRef.current?.pause();
    setSession((prev) => ({
      ...prev,
      status: 'paused',
      pausedAt: Date.now(),
    }));
  };

  const handleResume = () => {
    setSession((prev) => {
      const pausedDiff = prev.pausedAt ? Date.now() - prev.pausedAt : 0;
      return {
        ...prev,
        status: 'active',
        pausedDuration: prev.pausedDuration + pausedDiff,
        pausedAt: null,
      };
    });
    trackerRef.current?.resume();
  };

  /** Moves the session into the review sheet, prefilled from the sensors. */
  const openReview = () => {
    const finalSec = getElapsedSeconds(sessionRef.current);
    setFinalDurationSec(finalSec);
    setFinalDistanceInput(
      sessionRef.current.distanceKm > 0
        ? String(sessionRef.current.distanceKm.toFixed(2))
        : ''
    );
    setFinalStepsInput(sessionRef.current.steps > 0 ? String(sessionRef.current.steps) : '');
    setFinalJumpsInput(
      sessionRef.current.jumpCount > 0 ? String(sessionRef.current.jumpCount) : ''
    );
    setFinalCaloriesInput(String(sessionRef.current.calories));
    setSession((prev) => ({ ...prev, status: 'completed' }));
    setIsCompletionModalOpen(true);
  };

  const handleStopPrompt = () => {
    trackerRef.current?.pause();
    setConfirm('finish');
  };

  const handleBack = () => {
    if (session.status === 'active' || session.status === 'paused') {
      setConfirm('exit');
    } else {
      router.back();
    }
  };

  const handleSaveActivity = async () => {
    setIsSaving(true);
    const now = new Date();
    const startTimeDate = new Date(
      session.startTime > 0 ? session.startTime : now.getTime() - finalDurationSec * 1000
    );

    const parsedDistance = finalDistanceInput ? parseFloat(finalDistanceInput) : null;
    const parsedSteps = finalStepsInput ? parseInt(finalStepsInput, 10) : null;
    const parsedJumps = finalJumpsInput ? parseInt(finalJumpsInput, 10) : null;
    const parsedCalories = finalCaloriesInput ? parseInt(finalCaloriesInput, 10) : session.calories;

    const avgPace =
      parsedDistance && parsedDistance > 0
        ? calculatePace(finalDurationSec, parsedDistance)
        : null;
    const avgSpeed =
      parsedDistance && parsedDistance > 0
        ? calculateSpeed(finalDurationSec, parsedDistance)
        : null;

    let trackingMode: 'sensor' | 'gps' | 'timer' | 'manual' = 'timer';
    if (activityType === 'running' || activityType === 'cycling' || activityType === 'hiking') {
      trackingMode = 'gps';
    } else if (activityType === 'walking' || activityType === 'jump_rope') {
      trackingMode = 'sensor';
    }

    const record = await saveActivity({
      type: activityType,
      startedAt: startTimeDate.toISOString(),
      endedAt: now.toISOString(),
      durationSeconds: finalDurationSec,
      distanceKm: parsedDistance,
      steps: parsedSteps,
      jumpCount: parsedJumps,
      calories: parsedCalories,
      averageSpeed: avgSpeed,
      averagePace: avgPace,
      trackingMode,
      notes: sessionNotes.trim() || undefined,
    });

    setIsSaving(false);
    setIsCompletionModalOpen(false);

    // Show Instagram share prompt before navigating away
    setSavedActivity(record);
    setShowShareModal(true);
  };

  const handleDiscard = () => {
    setIsCompletionModalOpen(false);
    router.back();
  };

  // Pace / Speed computed values
  const currentPace = calculatePace(elapsedSeconds, session.distanceKm);
  // Live speed from the GPS chip while moving; session average otherwise.
  const currentSpeed =
    sensors.gps === 'active' && sensors.speedKmh > 0
      ? sensors.speedKmh
      : calculateSpeed(elapsedSeconds, session.distanceKm);
  const sensorStatus =
    session.status === 'idle'
      ? usesGps || usesSteps
        ? 'Sensors start with the session'
        : 'Duration timer'
      : describeSensors(sensors, usesSteps, usesGps);

  // Render primary metric
  const renderPrimaryMetric = () => {
    if (session.status === 'idle') {
      return (
        <View style={styles.primaryMetricContainer}>
          <Text style={styles.idleHintText}>Ready to Track</Text>
          <Text style={styles.primaryMetricValue}>00:00</Text>
          <Text style={styles.primaryMetricUnit}>Tap Start Below</Text>
        </View>
      );
    }

    if (meta.primaryMetric === 'steps') {
      return (
        <View style={styles.primaryMetricContainer}>
          <Text style={styles.primaryMetricValue}>{session.steps.toLocaleString()}</Text>
          <Text style={styles.primaryMetricUnit}>steps</Text>
        </View>
      );
    }

    if (meta.primaryMetric === 'distance') {
      return (
        <View style={styles.primaryMetricContainer}>
          <Text style={styles.primaryMetricValue}>
            {session.distanceKm.toFixed(2)}
          </Text>
          <Text style={styles.primaryMetricUnit}>kilometers</Text>
        </View>
      );
    }

    if (meta.primaryMetric === 'jumps') {
      return (
        <View style={styles.primaryMetricContainer}>
          <Text style={styles.primaryMetricValue}>{session.jumpCount.toLocaleString()}</Text>
          <Text style={styles.primaryMetricUnit}>jumps</Text>
        </View>
      );
    }

    // Default: duration
    return (
      <View style={styles.primaryMetricContainer}>
        <Text style={styles.primaryMetricValue}>{elapsedString}</Text>
        <Text style={styles.primaryMetricUnit}>active duration</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top Header */}
      <View style={styles.topHeader}>
        <Pressable onPress={handleBack} style={styles.backButton} hitSlop={10}>
          <AppIcon name="arrow-back" size={24} color={Palette.ink} />
        </Pressable>

        <View style={styles.headerTitleWrap}>
          <AppIcon
            name={meta.iconName}
            type={meta.iconType}
            size={18}
            color={Palette.forest}
          />
          <Text style={styles.headerTitle}>{meta.label}</Text>
        </View>

        <View style={styles.headerRightPlaceholder} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Sensor & Mode Status Pill */}
        <View style={styles.modeStatusCard}>
          <View
            style={[
              styles.statusDot,
              session.status === 'active' && styles.statusDotActive,
              session.status === 'paused' && styles.statusDotPaused,
            ]}
          />
          <View style={styles.modeTextWrap}>
            <Text style={styles.modeTitle}>{meta.trackingModeLabel}</Text>
            <Text style={styles.modeSub}>{sensorStatus}</Text>
          </View>
        </View>

        {/* Primary Display */}
        {renderPrimaryMetric()}

        {/* Route on OpenStreetMap, for GPS activities once tracking has begun */}
        {usesGps && session.status !== 'idle' && (
          <View style={styles.mapWrap}>
            <RouteMap
              route={sensors.route}
              position={sensors.position}
              follow={session.status === 'active'}
            />
          </View>
        )}

        {/* Secondary Stats Grid */}
        <View style={styles.secondaryGrid}>
          {/* Duration is always shown */}
          <View style={styles.secondaryCard}>
            <Text style={styles.secondaryLabel}>Duration</Text>
            <Text style={styles.secondaryValue}>{elapsedString}</Text>
          </View>

          {/* Calories always shown */}
          <View style={styles.secondaryCard}>
            <Text style={styles.secondaryLabel}>Calories</Text>
            <Text style={styles.secondaryValue}>{session.calories} kcal</Text>
          </View>

          {/* Distance */}
          {meta.showDistance && meta.primaryMetric !== 'distance' && (
            <View style={styles.secondaryCard}>
              <Text style={styles.secondaryLabel}>Distance</Text>
              <Text style={styles.secondaryValue}>{session.distanceKm.toFixed(2)} km</Text>
            </View>
          )}

          {/* Steps */}
          {meta.showSteps && meta.primaryMetric !== 'steps' && (
            <View style={styles.secondaryCard}>
              <Text style={styles.secondaryLabel}>Steps</Text>
              <Text style={styles.secondaryValue}>{session.steps.toLocaleString()}</Text>
            </View>
          )}

          {/* Pace */}
          {meta.showPace && (
            <View style={styles.secondaryCard}>
              <Text style={styles.secondaryLabel}>Pace</Text>
              <Text style={styles.secondaryValue}>
                {currentPace ? `${currentPace} /km` : '--:--'}
              </Text>
            </View>
          )}

          {/* Speed */}
          {meta.showSpeed && (
            <View style={styles.secondaryCard}>
              <Text style={styles.secondaryLabel}>Speed</Text>
              <Text style={styles.secondaryValue}>
                {currentSpeed ? `${currentSpeed} km/h` : '0.0 km/h'}
              </Text>
            </View>
          )}

          {/* Jump rate */}
          {meta.showJumps && (
            <View style={styles.secondaryCard}>
              <Text style={styles.secondaryLabel}>Cadence</Text>
              <Text style={styles.secondaryValue}>
                {elapsedSeconds > 10
                  ? `${Math.round((session.jumpCount / elapsedSeconds) * 60)} /min`
                  : '-- /min'}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Control Buttons Bottom Bar */}
      <View style={styles.bottomBar}>
        {session.status === 'idle' && (
          <Button
            label="Start Activity"
            variant="primary"
            size="lg"
            onPress={handleStart}
            icon={<AppIcon name="play" size={18} color={Palette.ink} />}
          />
        )}

        {session.status === 'active' && (
          <View style={styles.activeControlsRow}>
            <View style={styles.controlFlex}>
              <Button
                label="Pause"
                variant="outline"
                size="lg"
                onPress={handlePause}
                icon={<AppIcon name="pause" size={18} color={Palette.forest} />}
              />
            </View>
            <View style={styles.controlFlex}>
              <Button
                label="Stop"
                variant="coral"
                size="lg"
                onPress={handleStopPrompt}
                icon={<AppIcon name="stop" size={18} color={Palette.white} />}
              />
            </View>
          </View>
        )}

        {session.status === 'paused' && (
          <View style={styles.activeControlsRow}>
            <View style={styles.controlFlex}>
              <Button
                label="Resume"
                variant="primary"
                size="lg"
                onPress={handleResume}
                icon={<AppIcon name="play" size={18} color={Palette.ink} />}
              />
            </View>
            <View style={styles.controlFlex}>
              <Button
                label="Finish"
                variant="coral"
                size="lg"
                onPress={handleStopPrompt}
                icon={<AppIcon name="checkmark" size={18} color={Palette.white} />}
              />
            </View>
          </View>
        )}
      </View>

      {/* Confirmations. Works on every platform, unlike Alert.alert. */}
      <Modal
        visible={confirm !== null}
        animationType="fade"
        transparent
        onRequestClose={() => setConfirm(null)}>
        <Pressable style={styles.confirmBackdrop} onPress={() => setConfirm(null)} />
        <View style={styles.confirmWrap} pointerEvents="box-none">
          <View style={styles.confirmCard}>
            <Text style={styles.confirmTitle}>
              {confirm === 'exit' ? 'Discard this session?' : 'Finish activity?'}
            </Text>
            <Text style={styles.confirmBody}>
              {confirm === 'exit'
                ? 'Tracking is still running. Leaving now throws away everything recorded in this session.'
                : 'You can review and edit the numbers before saving.'}
            </Text>

            <View style={styles.confirmActions}>
              <Pressable
                style={styles.confirmGhost}
                onPress={() => {
                  setConfirm(null);
                  // Finishing paused the tracker; going back should resume it.
                  if (confirm === 'finish' && session.status === 'active') {
                    trackerRef.current?.resume();
                  }
                }}>
                <Text style={styles.confirmGhostText}>
                  {confirm === 'exit' ? 'Keep going' : 'Not yet'}
                </Text>
              </Pressable>

              <Pressable
                style={[
                  styles.confirmPrimary,
                  confirm === 'exit' && styles.confirmDestructive,
                ]}
                onPress={() => {
                  const which = confirm;
                  setConfirm(null);
                  if (which === 'exit') router.back();
                  else openReview();
                }}>
                <Text
                  style={[
                    styles.confirmPrimaryText,
                    confirm === 'exit' && styles.confirmDestructiveText,
                  ]}>
                  {confirm === 'exit' ? 'Discard' : 'Finish & review'}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Completion & Summary Modal */}
      <Modal
        visible={isCompletionModalOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setIsCompletionModalOpen(false)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderIconWrap}>
                <AppIcon name="trophy" size={20} color={Palette.forest} />
              </View>
              <View style={styles.modalHeaderTextWrap}>
                <Text style={styles.modalTitle}>Session Complete!</Text>
                <Text style={styles.modalSubtitle}>
                  Review and adjust your {meta.label} stats
                </Text>
              </View>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={styles.modalScroll}>
              {/* Duration Summary */}
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Total Duration</Text>
                <Text style={styles.summaryValueBig}>{formatDuration(finalDurationSec)}</Text>
              </View>

              {/* Editable Distance (if applicable) */}
              {(meta.showDistance || meta.primaryMetric === 'distance') && (
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Distance (km)</Text>
                  <TextInput
                    style={styles.inputField}
                    value={finalDistanceInput}
                    onChangeText={setFinalDistanceInput}
                    keyboardType="decimal-pad"
                    placeholder="e.g. 3.5"
                    placeholderTextColor={Palette.muted}
                  />
                </View>
              )}

              {/* Editable Steps (if applicable) */}
              {meta.showSteps && (
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Steps Count</Text>
                  <TextInput
                    style={styles.inputField}
                    value={finalStepsInput}
                    onChangeText={setFinalStepsInput}
                    keyboardType="number-pad"
                    placeholder="e.g. 4500"
                    placeholderTextColor={Palette.muted}
                  />
                </View>
              )}

              {/* Editable Jumps (if applicable) */}
              {meta.showJumps && (
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Jump Count</Text>
                  <TextInput
                    style={styles.inputField}
                    value={finalJumpsInput}
                    onChangeText={setFinalJumpsInput}
                    keyboardType="number-pad"
                    placeholder="e.g. 400"
                    placeholderTextColor={Palette.muted}
                  />
                </View>
              )}

              {/* Calories */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Estimated Calories (kcal)</Text>
                <TextInput
                  style={styles.inputField}
                  value={finalCaloriesInput}
                  onChangeText={setFinalCaloriesInput}
                  keyboardType="number-pad"
                  placeholder="e.g. 250"
                  placeholderTextColor={Palette.muted}
                />
              </View>

              {/* Notes */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Session Notes (Optional)</Text>
                <TextInput
                  style={[styles.inputField, styles.notesInput]}
                  value={sessionNotes}
                  onChangeText={setSessionNotes}
                  multiline
                  numberOfLines={2}
                  placeholder="How did this workout feel?"
                  placeholderTextColor={Palette.muted}
                />
              </View>
            </ScrollView>

            {/* Modal Actions */}
            <View style={styles.modalActions}>
              <Button
                label="Save Activity"
                variant="primary"
                size="lg"
                onPress={handleSaveActivity}
                loading={isSaving}
                icon={<AppIcon name="checkmark" size={18} color={Palette.ink} />}
              />
              <Button
                label="Discard Activity"
                variant="outline"
                size="md"
                onPress={handleDiscard}
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Instagram Share Modal ── */}
      {savedActivity && (
        <InstaShareModal
          visible={showShareModal}
          onClose={() => {
            setShowShareModal(false);
            router.replace('/(tabs)/activity' as any);
          }}
          activity={savedActivity}
          username={profile.username || 'muvibe_user'}
          avatarUrl={profile.avatarUrl}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  confirmBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Palette.overlay,
  },
  confirmWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.space5,
  },
  confirmCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: Palette.white,
    borderRadius: Radius.lg,
    padding: Spacing.space5,
  },
  confirmTitle: {
    ...Typography.sectionHeading,
    color: Palette.ink,
    marginBottom: 6,
  },
  confirmBody: {
    ...Typography.body,
    color: Palette.muted,
    marginBottom: Spacing.space5,
  },
  confirmActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing.space2,
  },
  confirmGhost: {
    paddingHorizontal: Spacing.space4,
    paddingVertical: 11,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  confirmGhostText: {
    ...Typography.bodyBold,
    color: Palette.muted,
  },
  confirmPrimary: {
    paddingHorizontal: Spacing.space5,
    paddingVertical: 11,
    borderRadius: Radius.full,
    backgroundColor: Palette.lime,
  },
  confirmPrimaryText: {
    ...Typography.bodyBold,
    color: Palette.ink,
  },
  confirmDestructive: {
    backgroundColor: Palette.coral,
  },
  confirmDestructiveText: {
    color: Palette.white,
  },
  safeArea: {
    flex: 1,
    backgroundColor: Palette.canvas,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.space4,
    paddingVertical: Spacing.space3,
    borderBottomWidth: 1,
    borderBottomColor: Palette.border,
    backgroundColor: Palette.white,
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    ...Typography.sectionHeading,
    color: Palette.ink,
    fontSize: 17,
  },
  headerRightPlaceholder: {
    width: 36,
  },
  scrollContent: {
    paddingHorizontal: Spacing.space4,
    paddingTop: Spacing.space4,
    paddingBottom: Spacing.space6,
    maxWidth: 600,
    width: '100%',
    alignSelf: 'center',
  },
  modeStatusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Palette.white,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Palette.border,
    padding: Spacing.space3,
    marginBottom: Spacing.space5,
    gap: 12,
  },
  mapWrap: {
    marginBottom: Spacing.space4,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: Radius.full,
    backgroundColor: Palette.muted,
  },
  statusDotActive: {
    backgroundColor: Palette.forest,
  },
  statusDotPaused: {
    backgroundColor: Palette.amber,
  },
  modeTextWrap: {
    flex: 1,
  },
  modeTitle: {
    ...Typography.cardHeading,
    fontSize: 13,
    color: Palette.ink,
    marginBottom: 2,
  },
  modeSub: {
    ...Typography.supporting,
    fontSize: 11.5,
    color: Palette.muted,
  },
  primaryMetricContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.space6,
    backgroundColor: Palette.white,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Palette.border,
    marginBottom: Spacing.space4,
  },
  idleHintText: {
    ...Typography.supporting,
    fontSize: 13,
    color: Palette.muted,
    marginBottom: 4,
  },
  primaryMetricValue: {
    ...Typography.stats,
    fontSize: 56,
    lineHeight: 64,
    color: Palette.ink,
    fontWeight: '800',
    fontFamily: FontFamily.bold,
    letterSpacing: -1,
  },
  primaryMetricUnit: {
    ...Typography.supporting,
    fontSize: 14,
    color: Palette.muted,
    fontWeight: '600',
    fontFamily: FontFamily.medium,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 4,
  },
  secondaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.space3,
  },
  secondaryCard: {
    width: '48%',
    flexGrow: 1,
    backgroundColor: Palette.white,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Palette.border,
    padding: Spacing.space3,
    minHeight: 74,
    justifyContent: 'space-between',
  },
  secondaryLabel: {
    ...Typography.supporting,
    fontSize: 12,
    color: Palette.muted,
    fontWeight: '500',
    fontFamily: FontFamily.medium,
  },
  secondaryValue: {
    ...Typography.cardHeading,
    fontSize: 18,
    color: Palette.ink,
    fontWeight: '700',
    fontFamily: FontFamily.bold,
  },
  bottomBar: {
    paddingHorizontal: Spacing.space4,
    paddingTop: Spacing.space3,
    paddingBottom: Spacing.space4,
    backgroundColor: Palette.canvas,
    borderTopWidth: 1,
    borderTopColor: Palette.border,
    maxWidth: 600,
    width: '100%',
    alignSelf: 'center',
  },
  activeControlsRow: {
    flexDirection: 'row',
    gap: Spacing.space3,
  },
  controlFlex: {
    flex: 1,
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
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingBottom: Spacing.space3,
    borderBottomWidth: 1,
    borderBottomColor: Palette.surfaceSubtle,
    marginBottom: Spacing.space3,
  },
  modalHeaderIconWrap: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    backgroundColor: Palette.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalHeaderTextWrap: {
    flex: 1,
  },
  modalTitle: {
    ...Typography.cardHeading,
    fontSize: 17,
    color: Palette.ink,
  },
  modalSubtitle: {
    ...Typography.supporting,
    fontSize: 12.5,
    color: Palette.muted,
  },
  modalScroll: {
    marginBottom: Spacing.space3,
  },
  summaryItem: {
    backgroundColor: Palette.surfaceHighlight,
    borderRadius: Radius.card,
    padding: Spacing.space3,
    alignItems: 'center',
    marginBottom: Spacing.space3,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  summaryLabel: {
    ...Typography.supporting,
    fontSize: 12,
    color: Palette.muted,
    marginBottom: 2,
  },
  summaryValueBig: {
    ...Typography.stats,
    fontSize: 28,
    color: Palette.forest,
  },
  inputGroup: {
    marginBottom: Spacing.space3,
  },
  inputLabel: {
    ...Typography.supporting,
    fontSize: 12,
    fontWeight: '600',
    fontFamily: FontFamily.medium,
    color: Palette.ink,
    marginBottom: 4,
  },
  inputField: {
    backgroundColor: Palette.surfaceHighlight,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Palette.border,
    paddingHorizontal: Spacing.space3,
    paddingVertical: 10,
    ...Typography.body,
    color: Palette.ink,
  },
  notesInput: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
  modalActions: {
    gap: Spacing.space2,
    paddingTop: Spacing.space2,
  },
});
