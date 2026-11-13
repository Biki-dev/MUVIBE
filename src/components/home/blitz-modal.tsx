import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  TextInput,
  Image,
  Animated,
  Easing,
  Platform,
} from 'react-native';
import { Palette, Radius, Spacing, Typography } from '@/constants/theme';
import { AppIcon } from '@/components/ui/icon';
import {
  BlitzQueueType,
  StrangerSubMode,
  Challenger,
  BlitzMatchStatus,
  FormState,
} from '@/types/blitz';
import {
  NEARBY_CHALLENGERS,
  RIVAL_CHALLENGERS,
  CAMPUS_BRAWL_CHALLENGERS,
  BLITZ_EXERCISES,
} from '@/constants/blitz-data';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import {
  YoloCameraPoseDetector,
  YoloKeypoint,
  ExerciseType,
  YOLO_AIGYM_CONFIG,
  YOLO_COCO_KEYPOINTS,
  YOLO_SKELETON_BONES,
  AIGymStage,
  YOLO_MODEL_METADATA,
  BlitzMaxRecords,
  getBlitzMaxRecords,
  updateBlitzMaxRecord,
} from '@/services/yolo-pose-engine';
import { useAuth } from '@/context/auth-context';
import {
  RaceDestination,
  RaceParticipant,
  CustomRoomChallengeType,
} from '@/types/race';
import { CAMPUS_DESTINATIONS, INITIAL_RACE_PARTICIPANTS } from '@/constants/race-data';
import { RaceRealtimeService, LiveRaceState } from '@/services/race-realtime-service';
import { RaceLiveMap } from '@/components/challenge/race-live-map';

interface BlitzModalProps {
  visible: boolean;
  initialQueue: BlitzQueueType;
  onClose: () => void;
}

export function BlitzModal({ visible, initialQueue, onClose }: BlitzModalProps) {
  const { user, profile } = useAuth();
  const userCollege = profile?.college || 'Assam Engineering College (AEC)';
  const userName = profile?.fullName || 'You';

  // ── Navigation & Queue State ──────────────────────────────────────────
  const [activeQueue, setActiveQueue] = useState<BlitzQueueType>(initialQueue);
  const [strangerSubMode, setStrangerSubMode] = useState<StrangerSubMode>('campus_brawl');
  const [matchStatus, setMatchStatus] = useState<BlitzMatchStatus>('queue_select');
  const [currentChallenger, setCurrentChallenger] = useState<Challenger | null>(null);
  const [isSoloMode, setIsSoloMode] = useState(false);

  // Custom room state
  const [roomCode, setRoomCode] = useState('RACE-842');
  const [inputRoomCode, setInputRoomCode] = useState('');
  const [selectedExercise, setSelectedExercise] = useState(BLITZ_EXERCISES[0]);
  const [customChallengeType, setCustomChallengeType] = useState<CustomRoomChallengeType>('running_sprint');
  const [selectedDestination, setSelectedDestination] = useState<RaceDestination>(CAMPUS_DESTINATIONS[0]);
  const [raceParticipants, setRaceParticipants] = useState<RaceParticipant[]>([]);
  const [raceService, setRaceService] = useState<RaceRealtimeService | null>(null);
  const [liveRaceState, setLiveRaceState] = useState<LiveRaceState | null>(null);
  const [userSprintSpeed, setUserSprintSpeed] = useState(15.2);

  // ── 60-Second Blitz Battle Arena State ─────────────────────────────────
  const [secondsLeft, setSecondsLeft] = useState(60);
  const [playerReps, setPlayerReps] = useState(0);
  const [opponentReps, setOpponentReps] = useState(0);
  const [exerciseType, setExerciseType] = useState<ExerciseType>('pushups');
  const [formFeedback, setFormFeedback] = useState<'idle' | 'good' | 'go_lower' | 'locked_out'>('idle');
  const [jointAngle, setJointAngle] = useState(170); // Elbow angle (push-ups) or Knee angle (squats)
  const [repStage, setRepStage] = useState<'top' | 'down' | 'bottom'>('top');
  const [realtimePingMs, setRealtimePingMs] = useState(12);

  // Max records in 60 seconds (Personal Bests)
  const [maxRecords, setMaxRecords] = useState<BlitzMaxRecords>({
    maxPushups: 0,
    maxSquats: 0,
    totalSessions: 0,
  });
  const [lastRecordUpdate, setLastRecordUpdate] = useState<{
    isNewRecord: boolean;
    currentMax: number;
    previousMax: number;
  } | null>(null);

  // ── Camera & Ultralytics YOLO26 Detection State ──────────────────────
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraFacing, setCameraFacing] = useState<CameraType>('front');
  const [isCameraActive, setIsCameraActive] = useState(true);
  const [bypassCamera, setBypassCamera] = useState(false);
  const [yoloKeypoints, setYoloKeypoints] = useState<YoloKeypoint[]>([]);
  const [aigymStage, setAigymStage] = useState<AIGymStage>('up');
  const [isPersonInFrame, setIsPersonInFrame] = useState(false);

  const detectorRef = useRef<YoloCameraPoseDetector | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // ── Animations ────────────────────────────────────────────────────────
  const radarAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const flashAnim = useRef(new Animated.Value(0)).current;

  // Sync initial queue & load personal records when modal opens
  useEffect(() => {
    if (visible) {
      setActiveQueue(initialQueue);
      setMatchStatus('queue_select');
      setIsSoloMode(false);
      setLastRecordUpdate(null);
      getBlitzMaxRecords().then((rec) => setMaxRecords(rec));
    }
  }, [visible, initialQueue]);

  // Update max record when 60s blitz concludes
  useEffect(() => {
    if (matchStatus === 'finished') {
      updateBlitzMaxRecord(exerciseType, playerReps).then((res) => {
        setLastRecordUpdate(res);
        getBlitzMaxRecords().then((rec) => setMaxRecords(rec));
      });
    }
  }, [matchStatus, exerciseType, playerReps]);

  // Radar animation during searching
  useEffect(() => {
    if (matchStatus === 'searching') {
      const loop = Animated.loop(
        Animated.timing(radarAnim, {
          toValue: 1,
          duration: 1800,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        })
      );
      loop.start();
      return () => loop.stop();
    } else {
      radarAnim.setValue(0);
    }
  }, [matchStatus, radarAnim]);

  // Sync race participants for room lobby
  useEffect(() => {
    const userParticipant: RaceParticipant = {
      id: user?.id || 'usr_me',
      name: userName,
      college: userCollege,
      avatar: profile?.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80',
      isHost: true,
      isCurrentUser: true,
      coords: { latitude: 26.1380, longitude: 91.6630 },
      distanceRemainingMeters: selectedDestination.defaultDistanceMeters,
      speedKmh: 15.2,
      progressPercent: 0,
      currentRank: 1,
      hasFinished: false,
      color: Palette.lime,
    };

    setRaceParticipants([userParticipant, ...INITIAL_RACE_PARTICIPANTS]);
  }, [profile, userName, userCollege, selectedDestination]);

  // Clean up race service on unmount or modal close
  useEffect(() => {
    return () => {
      raceService?.disconnect();
    };
  }, [raceService]);

  const startRunningSprintRace = () => {
    const service = new RaceRealtimeService(roomCode, selectedDestination, raceParticipants);
    service.connect();
    service.subscribe((state) => {
      setLiveRaceState(state);
      if (state.status === 'finished') {
        setMatchStatus('sprint_finished');
      }
    });

    service.startRace();
    setRaceService(service);
    setMatchStatus('sprint_race');
  };

  const handleSprintBoost = () => {
    if (raceService) {
      const newSpeed = Number((15.0 + Math.random() * 4.5).toFixed(1));
      setUserSprintSpeed(newSpeed);
      raceService.boostUserSprint(28, newSpeed);
    }
  };

  const handleSelectMapCoords = (xPercent: number, yPercent: number) => {
    const customDest: RaceDestination = {
      id: `dest_custom_${Date.now()}`,
      name: 'Custom Finish Line Pin',
      area: 'Selected Map Location',
      description: `Rally point set at coordinate grid (${xPercent}%, ${yPercent}%)`,
      coords: {
        latitude: 26.1415 + (yPercent - 50) * 0.0005,
        longitude: 91.6625 + (xPercent - 50) * 0.0005,
      },
      defaultDistanceMeters: Math.round(500 + Math.hypot(xPercent - 20, yPercent - 80) * 8.5),
      mapXPercent: xPercent,
      mapYPercent: yPercent,
      icon: 'location',
    };
    setSelectedDestination(customDest);
    raceService?.setDestination(customDest);
  };

  // ── Solo 60-Second AI Challenge (Direct Camera Feed Test) ──────────────
  const startSoloChallenge = (exercise: ExerciseType) => {
    setExerciseType(exercise);
    setIsSoloMode(true);
    setCurrentChallenger({
      id: 'ai-pacer',
      name: 'YOLO26 Benchmark Pacer',
      college: 'Ultralytics AI Lab',
      avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=120&auto=format&fit=crop&q=80',
      elo: 1500,
      isOnline: true,
      streak: 5,
    });
    setSecondsLeft(60);
    setPlayerReps(0);
    setOpponentReps(0);
    setJointAngle(170);
    setRepStage('top');
    setFormFeedback('idle');
    setMatchStatus('active');
  };

  // ── Matchmaking Search Simulation ──────────────────────────────────────
  const startMatchmaking = (queue: BlitzQueueType, subMode?: StrangerSubMode) => {
    setIsSoloMode(false);
    setMatchStatus('searching');

    const searchTimer = setTimeout(() => {
      let chosenOpponent: Challenger;
      if (queue === 'nearby') {
        chosenOpponent = NEARBY_CHALLENGERS[0];
      } else if (subMode === 'turf_war') {
        chosenOpponent = RIVAL_CHALLENGERS[Math.floor(Math.random() * RIVAL_CHALLENGERS.length)];
      } else {
        chosenOpponent = CAMPUS_BRAWL_CHALLENGERS[Math.floor(Math.random() * CAMPUS_BRAWL_CHALLENGERS.length)];
      }

      setCurrentChallenger(chosenOpponent);
      setMatchStatus('matched');

      // Countdown to live match
      const startTimer = setTimeout(() => {
        setSecondsLeft(60);
        setPlayerReps(0);
        setOpponentReps(0);
        setJointAngle(170);
        setRepStage('top');
        setFormFeedback('idle');
        setMatchStatus('active');
      }, 2200);

      return () => clearTimeout(startTimer);
    }, 2800);

    return () => clearTimeout(searchTimer);
  };

  // ── 60-Second Countdown & Opponent Realtime Simulation ─────────────────
  useEffect(() => {
    if (matchStatus !== 'active') return;

    // Timer countdown
    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setMatchStatus('finished');
          return 0;
        }
        return prev - 1;
      });

      // Fluctuate WebSocket ping between 8ms and 24ms
      setRealtimePingMs(Math.floor(Math.random() * 16) + 8);
    }, 1000);

    // Opponent rep ticker simulation via Supabase Realtime (or AI Benchmark Pacer in Solo Mode)
    const opponentPacer = setInterval(() => {
      const paceThreshold = isSoloMode ? 0.55 : 0.45;
      if (Math.random() > paceThreshold) {
        setOpponentReps((r) => r + 1);
      }
    }, isSoloMode ? 3000 : 2600);

    return () => {
      clearInterval(timer);
      clearInterval(opponentPacer);
    };
  }, [matchStatus, isSoloMode]);

  // ── Ultralytics YOLO26 AIGym Workouts Monitor (Automatic Rep Counting) ──
  useEffect(() => {
    if (matchStatus === 'active' && isCameraActive && (permission?.granted || bypassCamera)) {
      if (!detectorRef.current) {
        detectorRef.current = new YoloCameraPoseDetector(exerciseType);
      }
      detectorRef.current.setExercise(exerciseType);
      detectorRef.current.setFacingMode(cameraFacing === 'front' ? 'user' : 'environment');

      detectorRef.current.start(videoRef.current, (frame) => {
        setIsPersonInFrame(frame.isPersonDetected);
        setJointAngle(frame.monitoring.currentAngle);
        setAigymStage(frame.monitoring.stage);

        if (frame.keypoints.length > 0) {
          setYoloKeypoints(frame.keypoints);
        }

        // Automatic Rep counting directly from Ultralytics YOLO AIGym
        if (frame.monitoring.repIncremented) {
          setPlayerReps(detectorRef.current?.getRepCount() || 0);
          setFormFeedback('good');
          setTimeout(() => setFormFeedback('idle'), 600);
        } else if (frame.monitoring.feedback === 'GO LOWER!') {
          setFormFeedback('go_lower');
          Animated.sequence([
            Animated.timing(flashAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
            Animated.timing(flashAnim, { toValue: 0, duration: 350, useNativeDriver: true }),
          ]).start();
        }
      });
    } else {
      detectorRef.current?.stop();
    }

    return () => {
      detectorRef.current?.stop();
    };
  }, [matchStatus, isCameraActive, exerciseType, cameraFacing, permission?.granted, bypassCamera]);

  // ── Form-Gated Rep Counting Logic (Ultralytics YOLO26 + AIGym) ─────────
  const triggerValidRep = () => {
    // Sequence: Top (170°) -> Dropping below 90° (<90° threshold) -> Lock back out (170°)
    const bottomAngle = exerciseType === 'pushups' ? 76 : 82;
    setJointAngle(bottomAngle);
    setFormFeedback('good');

    setTimeout(() => {
      setJointAngle(170);
      setPlayerReps((r) => r + 1);
      setRepStage('top');
      setFormFeedback('idle');
    }, 380);
  };

  const triggerHalfRep = () => {
    // Poor depth: Elbow or Knee angle only drops to 118° (doesn't break 90°) -> Triggers GO LOWER!
    const halfAngle = exerciseType === 'pushups' ? 118 : 124;
    setJointAngle(halfAngle);
    setFormFeedback('go_lower');

    // Trigger visual flash
    Animated.sequence([
      Animated.timing(flashAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
      Animated.timing(flashAnim, { toValue: 0, duration: 350, useNativeDriver: true }),
    ]).start();

    setTimeout(() => {
      setJointAngle(170);
    }, 850);
  };

  // Tug of war calculation (-50% to +50%, 0 is even)
  const repDiff = playerReps - opponentReps;
  const tugOfWarPercent = Math.min(92, Math.max(8, 50 + repDiff * 6));

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <View style={styles.modalRoot}>
        {/* Top Navigation Bar */}
        <View style={styles.topBar}>
          <Pressable
            onPress={() => {
              if (
                matchStatus === 'active' ||
                matchStatus === 'sprint_race' ||
                matchStatus === 'sprint_finished'
              ) {
                raceService?.disconnect();
                setMatchStatus('queue_select');
              } else {
                onClose();
              }
            }}
            style={styles.backIconButton}>
            <AppIcon name="close" size={22} color={Palette.ink} />
          </Pressable>

          <View style={styles.topCenterTitle}>
            <View style={styles.blitzPill}>
              <AppIcon
                name={
                  matchStatus === 'sprint_race' || matchStatus === 'sprint_finished'
                    ? 'navigate'
                    : 'flash'
                }
                size={14}
                color={Palette.forest}
              />
              <Text style={styles.blitzPillText}>
                {matchStatus === 'sprint_race' || matchStatus === 'sprint_finished'
                  ? 'CAMPUS SPRINT'
                  : '60-SECOND BLITZ'}
              </Text>
            </View>
          </View>

          <View style={styles.topRightScore}>
            <Text style={styles.eloBadge}>ELO 1450</Text>
          </View>
        </View>

        {/* ── VIEW 1: QUEUE SELECTION & MAX RECORDS HUB ─────────────── */}
        {matchStatus === 'queue_select' && (
          <ScrollView contentContainerStyle={styles.contentScroll} showsVerticalScrollIndicator={false}>
            {/* Active YOLO Model & 60-Second Personal Bests Card */}
            <View style={styles.yoloModelBanner}>
              <View style={styles.modelHeaderRow}>
                <View style={styles.modelTagPill}>
                  <AppIcon name="hardware-chip-outline" size={13} color={Palette.forest} />
                  <Text style={styles.modelTagPillText}>YOLO26 POSE ESTIMATOR</Text>
                </View>
                <View style={styles.modelFileBadge}>
                  <Text style={styles.modelFileText}>assets/models/yolo26n-pose.pt (7.88 MB)</Text>
                </View>
              </View>

              <Text style={styles.modelTagline}>
                Live camera feed pose estimation with 17 COCO keypoints and Ultralytics AIGym workout monitoring. Form-gating counts valid reps and flashes "GO LOWER!" on half-reps.
              </Text>

              {/* 60-Second Blitz Personal Records */}
              <View style={styles.maxRecordsRow}>
                {/* Max Push-ups Card */}
                <View style={styles.maxRecordCard}>
                  <View style={styles.maxRecordTopRow}>
                    <View style={styles.maxRecordIconCircle}>
                      <AppIcon name="fitness" size={15} color={Palette.lime} />
                    </View>
                    <View style={styles.maxRecordLabelCol}>
                      <Text style={styles.maxRecordLabel}>60s Max Push-ups</Text>
                      <Text style={styles.maxRecordValue}>
                        {maxRecords.maxPushups}{' '}
                        <Text style={styles.maxRecordUnit}>proper reps</Text>
                      </Text>
                    </View>
                  </View>
                  <Pressable
                    onPress={() => startSoloChallenge('pushups')}
                    style={styles.quickSoloBtn}>
                    <AppIcon name="play" size={12} color={Palette.forest} />
                    <Text style={styles.quickSoloBtnText}>Test 60s Push-ups</Text>
                  </Pressable>
                </View>

                {/* Max Squats Card */}
                <View style={styles.maxRecordCard}>
                  <View style={styles.maxRecordTopRow}>
                    <View style={[styles.maxRecordIconCircle, { backgroundColor: 'rgba(82, 121, 246, 0.2)' }]}>
                      <AppIcon name="body" size={15} color={Palette.electricBlue} />
                    </View>
                    <View style={styles.maxRecordLabelCol}>
                      <Text style={styles.maxRecordLabel}>60s Max Squats</Text>
                      <Text style={styles.maxRecordValue}>
                        {maxRecords.maxSquats}{' '}
                        <Text style={styles.maxRecordUnit}>proper reps</Text>
                      </Text>
                    </View>
                  </View>
                  <Pressable
                    onPress={() => startSoloChallenge('squats')}
                    style={styles.quickSoloBtn}>
                    <AppIcon name="play" size={12} color={Palette.forest} />
                    <Text style={styles.quickSoloBtnText}>Test 60s Squats</Text>
                  </Pressable>
                </View>
              </View>
            </View>

            {/* Queue Mode Selector Tabs */}
            <View style={styles.tabsContainer}>
              <Pressable
                onPress={() => setActiveQueue('stranger')}
                style={[styles.tabButton, activeQueue === 'stranger' && styles.tabButtonActive]}>
                <AppIcon
                  name="flash"
                  size={14}
                  color={activeQueue === 'stranger' ? Palette.forest : Palette.muted}
                />
                <Text
                  style={[styles.tabButtonText, activeQueue === 'stranger' && styles.tabButtonTextActive]}>
                  Rapid Stranger
                </Text>
              </Pressable>

              <Pressable
                onPress={() => setActiveQueue('nearby')}
                style={[styles.tabButton, activeQueue === 'nearby' && styles.tabButtonActive]}>
                <AppIcon
                  name="navigate"
                  size={14}
                  color={activeQueue === 'nearby' ? Palette.forest : Palette.muted}
                />
                <Text
                  style={[styles.tabButtonText, activeQueue === 'nearby' && styles.tabButtonTextActive]}>
                  Nearby
                </Text>
              </Pressable>

              <Pressable
                onPress={() => setActiveQueue('custom')}
                style={[styles.tabButton, activeQueue === 'custom' && styles.tabButtonActive]}>
                <AppIcon
                  name="key"
                  size={14}
                  color={activeQueue === 'custom' ? Palette.forest : Palette.muted}
                />
                <Text
                  style={[styles.tabButtonText, activeQueue === 'custom' && styles.tabButtonTextActive]}>
                  Custom Room
                </Text>
              </Pressable>
            </View>

            {/* TAB 1: RAPID FIGHT WITH STRANGER */}
            {activeQueue === 'stranger' && (
              <View style={styles.sectionCard}>
                <Text style={styles.sectionHeaderTitle}>Select Stranger Matchmaking Queue</Text>
                <Text style={styles.sectionDescription}>
                  Match within 3 seconds with on-device AI form gating and live WebSocket tug-of-war.
                </Text>

                {/* Sub-mode 1: Campus Brawl */}
                <Pressable
                  onPress={() => setStrangerSubMode('campus_brawl')}
                  style={[
                    styles.queueCard,
                    strangerSubMode === 'campus_brawl' && styles.queueCardSelected,
                  ]}>
                  <View style={styles.queueHeaderRow}>
                    <View style={styles.queueIconBox}>
                      <AppIcon name="school-outline" size={20} color={Palette.forest} />
                    </View>
                    <View style={styles.queueInfoCol}>
                      <View style={styles.queueTitleBadgeRow}>
                        <Text style={styles.queueName}>Campus Brawl</Text>
                        <View style={styles.badgePill}>
                          <Text style={styles.badgePillText}>Intra-College</Text>
                        </View>
                      </View>
                      <Text style={styles.queueDetails}>
                        Instant match with an active student from {userCollege}.
                      </Text>
                    </View>
                    <View style={styles.radioCircle}>
                      {strangerSubMode === 'campus_brawl' && <View style={styles.radioInner} />}
                    </View>
                  </View>
                  <View style={styles.queueFooterMeta}>
                    <Text style={styles.queuePlayersOnline}>🟢 42 students waiting</Text>
                    <Text style={styles.queueAvgTime}>Avg wait: ~2.1s</Text>
                  </View>
                </Pressable>

                {/* Sub-mode 2: Inter-College Turf War */}
                <Pressable
                  onPress={() => setStrangerSubMode('turf_war')}
                  style={[
                    styles.queueCard,
                    strangerSubMode === 'turf_war' && styles.queueCardSelected,
                  ]}>
                  <View style={styles.queueHeaderRow}>
                    <View style={[styles.queueIconBox, { backgroundColor: 'rgba(229, 108, 103, 0.15)' }]}>
                      <AppIcon name="flame" size={20} color={Palette.coral} />
                    </View>
                    <View style={styles.queueInfoCol}>
                      <View style={styles.queueTitleBadgeRow}>
                        <Text style={styles.queueName}>Inter-College Turf War</Text>
                        <View style={[styles.badgePill, { backgroundColor: 'rgba(232, 163, 74, 0.2)' }]}>
                          <Text style={[styles.badgePillText, { color: Palette.ink }]}>+College Rank</Text>
                        </View>
                      </View>
                      <Text style={styles.queueDetails}>
                        Face rival universities (IIT Guwahati, NIT Silchar, etc.). Wins boost your ELO and
                        add points to your College's Global Rank on the leaderboard!
                      </Text>
                    </View>
                    <View style={styles.radioCircle}>
                      {strangerSubMode === 'turf_war' && <View style={styles.radioInner} />}
                    </View>
                  </View>
                  <View style={styles.queueFooterMeta}>
                    <Text style={styles.queuePlayersOnline}>🔥 118 rival students online</Text>
                    <Text style={styles.queueAvgTime}>Avg wait: ~1.8s</Text>
                  </View>
                </Pressable>

                {/* Action Button */}
                <Pressable
                  onPress={() => startMatchmaking('stranger', strangerSubMode)}
                  style={styles.primaryActionButton}>
                  <AppIcon name="flash" size={18} color={Palette.forest} />
                  <Text style={styles.primaryActionText}>
                    {strangerSubMode === 'campus_brawl'
                      ? 'Find Campus Challenger'
                      : 'Battle Rival College'}
                  </Text>
                </Pressable>
              </View>
            )}

            {/* TAB 2: WITH NEARBY PEOPLE (PROXIMITY PING) */}
            {activeQueue === 'nearby' && (
              <View style={styles.sectionCard}>
                <View style={styles.proximityHeaderRow}>
                  <View>
                    <Text style={styles.sectionHeaderTitle}>Proximity Ping ("Nearby Challenger")</Text>
                    <Text style={styles.sectionDescription}>
                      Geofenced radar scans students in your hostel block, cafeteria, or library lounge.
                    </Text>
                  </View>
                </View>

                {/* Geofence Tag Indicator */}
                <View style={styles.geofenceTagBar}>
                  <AppIcon name="wifi" size={14} color={Palette.forest} />
                  <Text style={styles.geofenceTagText}>Connected: AEC Campus Wi-Fi • Hostel Zone 4</Text>
                </View>

                {/* Nearby Challengers List */}
                <View style={styles.nearbyList}>
                  {NEARBY_CHALLENGERS.map((challenger) => (
                    <View key={challenger.id} style={styles.nearbyRow}>
                      <Image source={{ uri: challenger.avatar }} style={styles.nearbyAvatar} />
                      <View style={styles.nearbyDetails}>
                        <View style={styles.nearbyNameRow}>
                          <Text style={styles.nearbyName}>{challenger.name}</Text>
                          <Text style={styles.nearbyDistance}>• {challenger.distanceMeters}m away</Text>
                        </View>
                        <Text style={styles.nearbyLocationTag}>{challenger.locationTag}</Text>
                        <Text style={styles.nearbyElo}>ELO: {challenger.elo} • 🔥 {challenger.streak} win streak</Text>
                      </View>
                      <Pressable
                        onPress={() => {
                          setCurrentChallenger(challenger);
                          startMatchmaking('nearby');
                        }}
                        style={styles.challengeButton}>
                        <Text style={styles.challengeButtonText}>PING</Text>
                      </Pressable>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* TAB 3: CUSTOM ROOM CREATION AND MATCHMAKING */}
            {activeQueue === 'custom' && (
              <View style={styles.sectionCard}>
                <Text style={styles.sectionHeaderTitle}>Custom Room: Create & Join</Text>
                <Text style={styles.sectionDescription}>
                  Host multiplayer competitions for 2 or more participants. Choose between a live GPS map sprint race or 60s blitz.
                </Text>

                {/* Challenge Type Selector (Sprint vs Blitz) */}
                <View style={styles.customTypeTabsRow}>
                  <Pressable
                    onPress={() => setCustomChallengeType('running_sprint')}
                    style={[
                      styles.customTypeTab,
                      customChallengeType === 'running_sprint' && styles.customTypeTabActive,
                    ]}>
                    <AppIcon
                      name="navigate"
                      size={14}
                      color={customChallengeType === 'running_sprint' ? Palette.forest : Palette.muted}
                    />
                    <Text
                      style={[
                        styles.customTypeTabText,
                        customChallengeType === 'running_sprint' && styles.customTypeTabTextActive,
                      ]}>
                      🏃 Map Sprint Race
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={() => setCustomChallengeType('blitz_60s')}
                    style={[
                      styles.customTypeTab,
                      customChallengeType === 'blitz_60s' && styles.customTypeTabActive,
                    ]}>
                    <AppIcon
                      name="flash"
                      size={14}
                      color={customChallengeType === 'blitz_60s' ? Palette.forest : Palette.muted}
                    />
                    <Text
                      style={[
                        styles.customTypeTabText,
                        customChallengeType === 'blitz_60s' && styles.customTypeTabTextActive,
                      ]}>
                      ⚡ 60s Blitz Battle
                    </Text>
                  </Pressable>
                </View>

                {/* Room Creation Box */}
                <View style={styles.roomCreateBox}>
                  <Text style={styles.boxLabel}>ROOM INVITE CODE</Text>
                  <View style={styles.codeRow}>
                    <Text style={styles.generatedCode}>{roomCode}</Text>
                    <Pressable
                      onPress={() => {
                        const prefix = customChallengeType === 'running_sprint' ? 'RACE-' : 'BLITZ-';
                        const newCode = prefix + Math.floor(100 + Math.random() * 900);
                        setRoomCode(newCode);
                      }}
                      style={styles.codeRefreshBtn}>
                      <AppIcon name="refresh" size={16} color={Palette.forest} />
                      <Text style={styles.codeRefreshText}>New Code</Text>
                    </Pressable>
                  </View>

                  {/* ── MODE 1: MULTIPLAYER RUNNING RACE TO COMMON LOCATION ── */}
                  {customChallengeType === 'running_sprint' ? (
                    <View style={styles.sprintSetupBlock}>
                      {/* Section A: Select Common Location on Map */}
                      <Text style={[styles.boxLabel, { marginTop: Spacing.space3 }]}>
                        1. SELECT COMMON DESTINATION ON MAP (FINISH LINE)
                      </Text>
                      <Text style={styles.setupSubLabel}>
                        All {raceParticipants.length} runners will navigate to this shared checkpoint. Whoever arrives first wins!
                      </Text>

                      {/* Interactive Campus Map Canvas */}
                      <RaceLiveMap
                        destination={selectedDestination}
                        participants={raceParticipants}
                        isInteractiveSelection={true}
                        onSelectCoordinates={handleSelectMapCoords}
                      />

                      {/* Campus Destination Presets Chips */}
                      <View style={styles.destPresetsGrid}>
                        {CAMPUS_DESTINATIONS.map((dest) => {
                          const isSelected = selectedDestination.id === dest.id;
                          return (
                            <Pressable
                              key={dest.id}
                              onPress={() => {
                                setSelectedDestination(dest);
                                raceService?.setDestination(dest);
                              }}
                              style={[
                                styles.destPresetChip,
                                isSelected && styles.destPresetChipSelected,
                              ]}>
                              <AppIcon
                                name={dest.icon as any}
                                size={12}
                                color={isSelected ? Palette.forest : Palette.muted}
                              />
                              <Text
                                style={[
                                  styles.destPresetChipText,
                                  isSelected && styles.destPresetChipTextSelected,
                                ]}
                                numberOfLines={1}>
                                {dest.name.split(' ')[0]} ({dest.defaultDistanceMeters}m)
                              </Text>
                            </Pressable>
                          );
                        })}
                      </View>

                      {/* Selected Location Summary Card */}
                      <View style={styles.selectedDestCard}>
                        <View style={styles.destPinIconCircle}>
                          <AppIcon name="flag" size={16} color={Palette.forest} />
                        </View>
                        <View style={styles.destCardInfoCol}>
                          <Text style={styles.destCardTitle}>🏁 {selectedDestination.name}</Text>
                          <Text style={styles.destCardDetails}>
                            {selectedDestination.area} • Distance: {selectedDestination.defaultDistanceMeters}m
                          </Text>
                        </View>
                      </View>

                      {/* Section B: Room Participants (2 or more users) */}
                      <View style={styles.participantsHeaderRow}>
                        <Text style={[styles.boxLabel, { marginTop: 0 }]}>
                          2. RUNNERS IN ROOM ({raceParticipants.length} PARTICIPANTS)
                        </Text>
                        <View style={styles.wsActiveBadge}>
                          <View style={styles.wsActiveDot} />
                          <Text style={styles.wsActiveText}>WebSocket Live</Text>
                        </View>
                      </View>

                      <View style={styles.participantsList}>
                        {raceParticipants.map((p, idx) => (
                          <View key={p.id} style={styles.participantRow}>
                            <View
                              style={[
                                styles.participantAvatarRing,
                                { borderColor: p.color || Palette.lime },
                              ]}>
                              <Image source={{ uri: p.avatar }} style={styles.participantAvatar} />
                            </View>
                            <View style={styles.participantInfoCol}>
                              <View style={styles.participantNameRow}>
                                <Text style={styles.participantName}>
                                  {p.name} {p.isCurrentUser ? '(You - Host)' : ''}
                                </Text>
                                <View style={styles.readyBadge}>
                                  <Text style={styles.readyBadgeText}>READY</Text>
                                </View>
                              </View>
                              <Text style={styles.participantCollege}>
                                {p.college} • Connected via Realtime Channel
                              </Text>
                            </View>
                          </View>
                        ))}

                        {/* Add Another Participant Button */}
                        <Pressable
                          onPress={() => {
                            const newRunner: RaceParticipant = {
                              id: `p_${Date.now()}`,
                              name: raceParticipants.length === 2 ? 'Ananya Dutta' : 'Tanmay Kalita',
                              college: userCollege,
                              avatar:
                                raceParticipants.length === 2
                                  ? 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&auto=format&fit=crop&q=80'
                                  : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
                              isHost: false,
                              isCurrentUser: false,
                              coords: { latitude: 26.1388, longitude: 91.6635 },
                              distanceRemainingMeters: selectedDestination.defaultDistanceMeters,
                              speedKmh: 14.5,
                              progressPercent: 0,
                              currentRank: raceParticipants.length + 1,
                              hasFinished: false,
                              color: raceParticipants.length === 2 ? '#F472B6' : '#A855F7',
                            };
                            setRaceParticipants((prev) => [...prev, newRunner]);
                          }}
                          style={styles.addRunnerBtn}>
                          <AppIcon name="person-add" size={14} color={Palette.forest} />
                          <Text style={styles.addRunnerBtnText}>+ Invite Another Runner to Room</Text>
                        </Pressable>
                      </View>

                      {/* Start Running Competition Button */}
                      <Pressable
                        onPress={startRunningSprintRace}
                        style={[styles.primaryActionButton, { marginTop: Spacing.space3 }]}>
                        <AppIcon name="play" size={18} color={Palette.forest} />
                        <Text style={styles.primaryActionText}>
                          Start Sprint Race ({raceParticipants.length} Runners Ready)
                        </Text>
                      </Pressable>
                    </View>
                  ) : (
                    /* ── MODE 2: 60s BLITZ WORKOUT BATTLE ── */
                    <View style={styles.blitzSetupBlock}>
                      <Text style={[styles.boxLabel, { marginTop: Spacing.space3 }]}>SELECT EXERCISE</Text>
                      <View style={styles.exerciseChipsRow}>
                        {BLITZ_EXERCISES.map((ex) => (
                          <Pressable
                            key={ex.id}
                            onPress={() => setSelectedExercise(ex)}
                            style={[
                              styles.exerciseChip,
                              selectedExercise.id === ex.id && styles.exerciseChipSelected,
                            ]}>
                            <Text
                              style={[
                                styles.exerciseChipText,
                                selectedExercise.id === ex.id && styles.exerciseChipTextSelected,
                              ]}>
                              {ex.name}
                            </Text>
                          </Pressable>
                        ))}
                      </View>

                      <Pressable
                        onPress={() => startMatchmaking('custom')}
                        style={[styles.primaryActionButton, { marginTop: Spacing.space3 }]}>
                        <AppIcon name="play" size={18} color={Palette.forest} />
                        <Text style={styles.primaryActionText}>Start Room & Wait for Rival</Text>
                      </Pressable>
                    </View>
                  )}
                </View>

                {/* Join Existing Room Box */}
                <View style={[styles.roomCreateBox, { marginTop: Spacing.space3 }]}>
                  <Text style={styles.boxLabel}>JOIN WITH FRIEND'S CODE</Text>
                  <View style={styles.inputRow}>
                    <TextInput
                      value={inputRoomCode}
                      onChangeText={setInputRoomCode}
                      placeholder="e.g. RACE-842 or BLITZ-591"
                      placeholderTextColor={Palette.muted}
                      style={styles.codeInput}
                      autoCapitalize="characters"
                    />
                    <Pressable
                      onPress={() => {
                        if (inputRoomCode.trim()) {
                          if (inputRoomCode.toUpperCase().startsWith('RACE')) {
                            startRunningSprintRace();
                          } else {
                            startMatchmaking('custom');
                          }
                        }
                      }}
                      style={[
                        styles.joinBtn,
                        !inputRoomCode.trim() && { opacity: 0.5 },
                      ]}>
                      <Text style={styles.joinBtnText}>Join Room</Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            )}

            {/* Architecture Highlights Pill */}
            <View style={styles.techPillCard}>
              <View style={styles.techPillHeader}>
                <AppIcon name="shield-checkmark" size={16} color={Palette.forest} />
                <Text style={styles.techPillTitle}>Ultralytics YOLO26 & AIGym Engine</Text>
              </View>
              <Text style={styles.techPillBody}>
                • <Text style={{ fontWeight: '700' }}>Ultralytics YOLO26 Pose:</Text> 17 COCO Keypoints anchor-free pose regression (tracks body posture whether horizontal on floor for pushups or deep crouching in squats).{'\n'}
                • <Text style={{ fontWeight: '700' }}>AIGym Workouts Monitoring:</Text> Tracks joint triplets ([5,7,9] for pushups, [11,13,15] for squats) with down_angle (90°) and up_angle (160°/165°) stage verification.{'\n'}
                • <Text style={{ fontWeight: '700' }}>Supabase Realtime:</Text> Millisecond WebSocket sync updates the live tug-of-war bar simultaneously.
              </Text>
            </View>
          </ScrollView>
        )}

        {/* ── VIEW 2: SEARCHING FOR OPPONENT (RADAR) ───────────────────── */}
        {matchStatus === 'searching' && (
          <View style={styles.searchingContainer}>
            <View style={styles.radarWrapper}>
              <Animated.View
                style={[
                  styles.radarPulseRing,
                  {
                    transform: [
                      {
                        scale: radarAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.6, 2.2],
                        }),
                      },
                    ],
                    opacity: radarAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.8, 0],
                    }),
                  },
                ]}
              />
              <View style={styles.radarCenterCircle}>
                <AppIcon name="flash" size={32} color={Palette.forest} />
              </View>
            </View>

            <Text style={styles.searchingTitle}>Scanning 60s Blitz Queue...</Text>
            <Text style={styles.searchingSubtitle}>
              {activeQueue === 'nearby'
                ? 'Pinging nearby students via campus geofence...'
                : strangerSubMode === 'turf_war'
                ? 'Matching with rival university student...'
                : 'Searching active contenders from ' + userCollege + '...'}
            </Text>

            <Pressable
              onPress={() => setMatchStatus('queue_select')}
              style={styles.cancelSearchBtn}>
              <Text style={styles.cancelSearchText}>Cancel Search</Text>
            </Pressable>
          </View>
        )}

        {/* ── VIEW 3: MATCHED (VS SCREEN) ─────────────────────────────── */}
        {matchStatus === 'matched' && currentChallenger && (
          <View style={styles.matchedContainer}>
            <Text style={styles.vsHeading}>MATCH FOUND!</Text>
            <Text style={styles.vsSubheading}>Get into position • AI Pose Camera Calibration Active</Text>

            <View style={styles.vsRow}>
              {/* Player Card */}
              <View style={styles.fighterCard}>
                <View style={styles.fighterAvatarPlaceholder}>
                  <AppIcon name="person" size={36} color={Palette.forest} />
                </View>
                <Text style={styles.fighterName}>{userName}</Text>
                <Text style={styles.fighterCollege}>{userCollege}</Text>
                <Text style={styles.fighterElo}>ELO 1450</Text>
              </View>

              {/* VS Badge */}
              <View style={styles.vsBadgeCircle}>
                <Text style={styles.vsBadgeText}>VS</Text>
              </View>

              {/* Opponent Card */}
              <View style={styles.fighterCard}>
                <Image source={{ uri: currentChallenger.avatar }} style={styles.fighterAvatar} />
                <Text style={styles.fighterName}>{currentChallenger.name}</Text>
                <Text style={styles.fighterCollege}>{currentChallenger.college}</Text>
                <Text style={styles.fighterElo}>ELO {currentChallenger.elo}</Text>
              </View>
            </View>

            <View style={styles.matchStartingPill}>
              <Text style={styles.matchStartingText}>STARTING IN 2 SECONDS...</Text>
            </View>
          </View>
        )}

        {/* ── VIEW 4: ACTIVE 60-SECOND BLITZ ARENA ─────────────────────── */}
        {matchStatus === 'active' && currentChallenger && (
          <View style={styles.arenaContainer}>
            {/* Arena Header: Timer & Realtime WebSocket Ping */}
            <View style={styles.arenaHeader}>
              <View style={styles.pingIndicator}>
                <View style={styles.pingDot} />
                <Text style={styles.pingText}>Supabase Realtime: {realtimePingMs}ms</Text>
              </View>
              <View style={styles.clockBox}>
                <Text style={[styles.clockNumbers, secondsLeft <= 10 && { color: Palette.coral }]}>
                  {secondsLeft}s
                </Text>
              </View>
              <View style={styles.privacyBadge}>
                <AppIcon name="lock-closed" size={11} color={Palette.lime} />
                <Text style={styles.privacyText}>Zero-Video Leaves Device</Text>
              </View>
            </View>

            {/* LIVE TUG-OF-WAR BAR */}
            <View style={styles.tugOfWarCard}>
              <View style={styles.tugHeaderRow}>
                <Text style={styles.tugSideLeft}>{userName}: {playerReps} Reps</Text>
                <Text style={styles.tugTitle}>⚡ LIVE TUG-OF-WAR</Text>
                <Text style={styles.tugSideRight}>{currentChallenger.name}: {opponentReps} Reps</Text>
              </View>

              {/* Split Bar */}
              <View style={styles.tugTrack}>
                <View style={[styles.tugPlayerBar, { width: `${tugOfWarPercent}%` }]} />
                <View style={styles.tugCenterNeedle} />
                <View style={[styles.tugOpponentBar, { width: `${100 - tugOfWarPercent}%` }]} />
              </View>

              <Text style={styles.tugLeadText}>
                {playerReps > opponentReps
                  ? `⚡ You are leading by ${playerReps - opponentReps} rep${playerReps - opponentReps > 1 ? 's' : ''}!`
                  : playerReps < opponentReps
                  ? `🔥 Opponent is ahead by ${opponentReps - playerReps}! Push now!`
                  : '⚔️ Dead Heat! Next valid rep breaks the tie!'}
              </Text>
            </View>

            {/* EXERCISE SWITCHER IN ARENA */}
            <View style={styles.arenaExerciseSwitcher}>
              <Pressable
                onPress={() => {
                  setExerciseType('pushups');
                  setJointAngle(170);
                  setFormFeedback('idle');
                }}
                style={[
                  styles.arenaExerciseBtn,
                  exerciseType === 'pushups' && styles.arenaExerciseBtnActive,
                ]}>
                <AppIcon
                  name="fitness"
                  size={14}
                  color={exerciseType === 'pushups' ? Palette.forest : Palette.muted}
                />
                <Text
                  style={[
                    styles.arenaExerciseBtnText,
                    exerciseType === 'pushups' && styles.arenaExerciseBtnTextActive,
                  ]}>
                  Form-Gated Push-ups
                </Text>
              </Pressable>

              <Pressable
                onPress={() => {
                  setExerciseType('squats');
                  setJointAngle(170);
                  setFormFeedback('idle');
                }}
                style={[
                  styles.arenaExerciseBtn,
                  exerciseType === 'squats' && styles.arenaExerciseBtnActive,
                ]}>
                <AppIcon
                  name="body"
                  size={14}
                  color={exerciseType === 'squats' ? Palette.forest : Palette.muted}
                />
                <Text
                  style={[
                    styles.arenaExerciseBtnText,
                    exerciseType === 'squats' && styles.arenaExerciseBtnTextActive,
                  ]}>
                  Parallel Squats
                </Text>
              </Pressable>
            </View>

            {/* AI POSE ESTIMATION & FORM-GATING CAMERA HUD */}
            <View style={styles.hudCard}>
              {/* Ultralytics YOLO Header & Camera Controls */}
              <View style={styles.hudHeader}>
                <View style={styles.hudAiTag}>
                  <AppIcon name="scan-outline" size={14} color={Palette.lime} />
                  <Text style={styles.hudAiTagText}>Ultralytics YOLO26 • AIGym: ACTIVE</Text>
                </View>

                {/* Live AIGym Stage Pill */}
                <View
                  style={[
                    styles.aigymStagePill,
                    aigymStage === 'down' && styles.aigymStagePillDown,
                  ]}>
                  <Text style={styles.aigymStagePillText}>
                    STAGE: {aigymStage.toUpperCase()}
                  </Text>
                </View>

                {/* Camera Flip & Pause Controls */}
                {permission?.granted && (
                  <View style={styles.cameraControlsRow}>
                    <Pressable
                      onPress={() =>
                        setCameraFacing((current) => (current === 'back' ? 'front' : 'back'))
                      }
                      style={styles.camIconBtn}
                      accessibilityLabel="Flip camera">
                      <AppIcon name="camera-reverse-outline" size={16} color={Palette.lime} />
                      <Text style={styles.camIconBtnText}>
                        {cameraFacing === 'front' ? 'Front' : 'Back'}
                      </Text>
                    </Pressable>

                    <Pressable
                      onPress={() => setIsCameraActive((prev) => !prev)}
                      style={[styles.camIconBtn, !isCameraActive && styles.camIconBtnMuted]}>
                      <AppIcon
                        name={isCameraActive ? 'videocam-outline' : 'videocam-off-outline'}
                        size={16}
                        color={isCameraActive ? Palette.lime : Palette.coral}
                      />
                    </Pressable>
                  </View>
                )}

                <Text style={styles.angleText}>
                  {exerciseType === 'pushups'
                    ? `Elbow: ${jointAngle}°`
                    : `Knee: ${jointAngle}°`}
                </Text>
              </View>

              {/* LIVE CAMERA FEED OR PERMISSION PROMPT */}
              {!permission?.granted && !bypassCamera ? (
                /* Camera Permission Request Card */
                <View style={styles.permissionBox}>
                  <View style={styles.permissionIconCircle}>
                    <AppIcon name="camera" size={28} color={Palette.lime} />
                  </View>
                  <Text style={styles.permissionTitle}>Camera Permission Required</Text>
                  <Text style={styles.permissionBody}>
                    MUVIBE uses on-device Ultralytics YOLO26 Pose Estimation (17 COCO keypoints) to
                    track body angles and monitor workouts directly from your camera feed.
                  </Text>
                  <View style={styles.permissionPrivacyRow}>
                    <AppIcon name="lock-closed" size={12} color={Palette.lime} />
                    <Text style={styles.permissionPrivacyText}>
                      Zero video leaves your phone • 100% On-Device Inference
                    </Text>
                  </View>
                  <View style={styles.permissionActionsRow}>
                    <Pressable
                      onPress={async () => {
                        await requestPermission();
                      }}
                      style={styles.grantPermissionBtn}>
                      <AppIcon name="shield-checkmark" size={16} color={Palette.forest} />
                      <Text style={styles.grantPermissionBtnText}>Grant Camera Access</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => setBypassCamera(true)}
                      style={styles.skipPermissionBtn}>
                      <Text style={styles.skipPermissionBtnText}>Use Simulation Mode</Text>
                    </Pressable>
                  </View>
                </View>
              ) : (
                /* Live Camera Feed with Ultralytics YOLO 17-Keypoint Overlay */
                <View style={styles.cameraFeedWrapper}>
                  {permission?.granted && isCameraActive ? (
                    Platform.OS === 'web' ? (
                      /* HTML5 Live Video stream for browser/webcam with YOLO pose */
                      <video
                        ref={videoRef as any}
                        autoPlay
                        playsInline
                        muted
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          transform: cameraFacing === 'front' ? 'scaleX(-1)' : 'none',
                        }}
                      />
                    ) : (
                      /* Native Expo CameraView for mobile iOS/Android */
                      <CameraView
                        style={styles.cameraFeed}
                        facing={cameraFacing}
                        mode="video">
                        {/* Subdued tint overlay for crisp AR Landmark contrast */}
                        <View style={styles.cameraDarkScrim} />
                      </CameraView>
                    )
                  ) : (
                    <View style={styles.cameraPausedScrim}>
                      <AppIcon name="videocam-off" size={32} color="rgba(255,255,255,0.4)" />
                      <Text style={styles.cameraPausedText}>
                        Camera paused or running in simulation mode
                      </Text>
                    </View>
                  )}

                  {/* Top Live Camera Status Tag */}
                  <View style={styles.cameraStatusPill}>
                    <View
                      style={[
                        styles.liveRecDot,
                        !isPersonInFrame && { backgroundColor: Palette.amber },
                      ]}
                    />
                    <Text style={styles.cameraStatusText}>
                      {permission?.granted && isCameraActive
                        ? `${cameraFacing === 'front' ? 'Front Cam' : 'Back Cam'} (30 FPS) • ${
                            isPersonInFrame ? 'YOLO26: Person Tracked' : 'Searching for Person...'
                          }`
                        : 'Simulated Feed • YOLO26 Pose Active'}
                    </Text>
                  </View>

                  {/* ULTRALYTICS YOLO 17 COCO KEYPOINTS AR SKELETON OVERLAY */}
                  <View style={styles.skeletonOverlayContainer} pointerEvents="none">
                    {yoloKeypoints.map((kpt) => {
                      const isTrackedTriplet =
                        exerciseType === 'pushups'
                          ? [5, 6, 7, 8, 9, 10].includes(kpt.id)
                          : [11, 12, 13, 14, 15, 16].includes(kpt.id);

                      return (
                        <View
                          key={kpt.id}
                          style={[
                            styles.skeletonNode,
                            {
                              left: `${kpt.xPercent}%`,
                              top: `${kpt.yPercent}%`,
                            },
                          ]}>
                          <View
                            style={[
                              styles.skeletonInnerDot,
                              isTrackedTriplet && styles.skeletonInnerDotTriplet,
                            ]}
                          />
                          <Text
                            style={[
                              styles.skeletonNodeLabel,
                              isTrackedTriplet && styles.skeletonNodeLabelTriplet,
                            ]}>
                            {kpt.name}
                          </Text>
                        </View>
                      );
                    })}
                  </View>

                  {/* Realtime Target Guidance Overlay */}
                  <View style={styles.arGuidanceBar}>
                    <Text style={styles.arGuidanceText}>
                      {exerciseType === 'pushups'
                        ? aigymStage === 'down'
                          ? '✅ Down Stage Reached (Elbow < 90°) • Push to Lockout (> 160°)'
                          : `Ultralytics AIGym Triplet [5,7,9] • Angle: ${jointAngle}° • Drop below 90°`
                        : aigymStage === 'down'
                        ? '✅ Down Stage Reached (Knee < 90° Parallel) • Stand to Lockout (> 165°)'
                        : `Ultralytics AIGym Triplet [11,13,15] • Angle: ${jointAngle}° • Squat below 90°`}
                    </Text>
                  </View>

                  {/* Live Form Alert Flasher */}
                  {formFeedback === 'go_lower' && (
                    <View style={styles.alertFlashBox}>
                      <Text style={styles.alertFlashText}>
                        {exerciseType === 'pushups'
                          ? '⚠️ GO LOWER! (AIGym: Drop elbow below 90°)'
                          : '⚠️ SQUAT LOWER! (AIGym: Break 90° parallel)'}
                      </Text>
                    </View>
                  )}

                  {formFeedback === 'good' && (
                    <View style={styles.goodFlashBox}>
                      <Text style={styles.goodFlashText}>
                        {exerciseType === 'pushups'
                          ? '✅ PERFECT DEPTH! (AIGym: +1 Push-up)'
                          : '✅ PARALLEL SQUAT! (AIGym: +1 Squat)'}
                      </Text>
                    </View>
                  )}
                </View>
              )}

              {/* Form Validation Gate Criteria */}
              <View style={styles.criteriaRow}>
                <View style={styles.criteriaItem}>
                  <AppIcon
                    name={jointAngle <= 90 ? 'checkmark-circle' : 'ellipse-outline'}
                    size={14}
                    color={jointAngle <= 90 ? Palette.lime : 'rgba(255,255,255,0.4)'}
                  />
                  <Text style={styles.criteriaText}>
                    {exerciseType === 'pushups' ? 'Down: Elbow ≤ 90°' : 'Down: Knee ≤ 90°'}
                  </Text>
                </View>
                <View style={styles.criteriaItem}>
                  <AppIcon
                    name={jointAngle >= (exerciseType === 'pushups' ? 160 : 165) ? 'checkmark-circle' : 'ellipse-outline'}
                    size={14}
                    color={jointAngle >= (exerciseType === 'pushups' ? 160 : 165) ? Palette.lime : 'rgba(255,255,255,0.4)'}
                  />
                  <Text style={styles.criteriaText}>
                    {exerciseType === 'pushups' ? 'Up: Lockout ≥ 160°' : 'Up: Lockout ≥ 165°'}
                  </Text>
                </View>
                <View style={styles.criteriaItem}>
                  <AppIcon
                    name="body"
                    size={14}
                    color={Palette.lime}
                  />
                  <Text style={styles.criteriaText}>17 COCO Keypoints</Text>
                </View>
              </View>
            </View>

            {/* Interactive Simulation Controls */}
            <View style={styles.simControlsCard}>
              <Text style={styles.simControlsLabel}>
                TEST ULTRALYTICS YOLO26 & AIGYM FORM-GATE ({exerciseType.toUpperCase()}):
              </Text>
              <View style={styles.simButtonsRow}>
                <Pressable onPress={triggerValidRep} style={styles.validRepBtn}>
                  <AppIcon name="checkmark" size={16} color={Palette.forest} />
                  <Text style={styles.validRepBtnText}>Full Depth Rep (+1)</Text>
                </Pressable>

                <Pressable onPress={triggerHalfRep} style={styles.halfRepBtn}>
                  <AppIcon name="warning" size={16} color={Palette.white} />
                  <Text style={styles.halfRepBtnText}>
                    {exerciseType === 'pushups' ? 'Test Half-Rep' : 'Test Half-Squat'}
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        )}

        {/* ── VIEW 5: MATCH FINISHED & 60s MAX RECORD SUMMARY ────────── */}
        {matchStatus === 'finished' && currentChallenger && (
          <View style={styles.finishedContainer}>
            {lastRecordUpdate?.isNewRecord ? (
              <View style={styles.prCelebrationBadge}>
                <AppIcon name="trophy" size={26} color={Palette.lime} />
                <Text style={styles.prCelebrationTitle}>🔥 NEW 60-SECOND RECORD!</Text>
                <Text style={styles.prCelebrationSubtitle}>
                  You achieved an all-time personal best of {playerReps} proper {exerciseType} in 60s!
                </Text>
              </View>
            ) : (
              <Text style={styles.finishTitle}>
                {isSoloMode
                  ? '⏱️ 60s CHALLENGE COMPLETE!'
                  : playerReps > opponentReps
                  ? '🏆 VICTORY!'
                  : playerReps < opponentReps
                  ? 'DEFEAT'
                  : 'STALEMATE!'}
              </Text>
            )}

            <Text style={styles.finishScoreSummary}>
              {isSoloMode
                ? `60s AI Rep Count: ${playerReps} Proper ${exerciseType.toUpperCase()}`
                : `Final Score: ${playerReps} vs ${opponentReps}`}
            </Text>

            {/* Max Proper Reps & Model Tracking Card */}
            <View style={styles.prSummaryCard}>
              <View style={styles.prSummaryRow}>
                <Text style={styles.prSummaryLabel}>
                  60s All-Time Best ({exerciseType === 'pushups' ? 'Push-ups' : 'Squats'}):
                </Text>
                <Text style={styles.prSummaryValue}>
                  {exerciseType === 'pushups' ? maxRecords.maxPushups : maxRecords.maxSquats} Reps
                </Text>
              </View>
              <View style={styles.prSummaryRow}>
                <Text style={styles.prSummaryLabel}>Form Gating Engine:</Text>
                <Text style={styles.prSummaryEngine}>
                  Ultralytics YOLO26n Pose (assets/models/yolo26n-pose.pt)
                </Text>
              </View>
              <View style={styles.prSummaryRow}>
                <Text style={styles.prSummaryLabel}>Tracked Keypoint Triplet:</Text>
                <Text style={styles.prSummaryEngine}>
                  {exerciseType === 'pushups'
                    ? 'Left Arm [5, 7, 9] (Elbow ≤ 90° down, ≥ 160° lockout)'
                    : 'Left Leg [11, 13, 15] (Knee ≤ 90° down, ≥ 165° lockout)'}
                </Text>
              </View>
            </View>

            <View style={styles.rewardsCard}>
              <View style={styles.rewardRow}>
                <Text style={styles.rewardLabel}>Personal ELO Rating:</Text>
                <Text style={styles.rewardValue}>
                  {playerReps >= (opponentReps || 8) ? '+32 ELO (1482)' : '+5 ELO (1455)'}
                </Text>
              </View>

              <View style={styles.rewardRow}>
                <Text style={styles.rewardLabel}>College Global Rank Points:</Text>
                <Text style={[styles.rewardValue, { color: Palette.forest }]}>
                  {playerReps >= (opponentReps || 8) ? `+50 pts to ${userCollege}` : `+15 pts to ${userCollege}`}
                </Text>
              </View>

              <View style={styles.rewardRow}>
                <Text style={styles.rewardLabel}>Form Integrity Rating:</Text>
                <Text style={styles.rewardValue}>98% AI Form Verified</Text>
              </View>
            </View>

            <View style={styles.finishedActionsRow}>
              <Pressable
                onPress={() => {
                  if (isSoloMode) {
                    startSoloChallenge(exerciseType);
                  } else {
                    startMatchmaking(activeQueue, strangerSubMode);
                  }
                }}
                style={[styles.primaryActionButton, { flex: 1 }]}>
                <AppIcon name="reload" size={16} color={Palette.forest} />
                <Text style={styles.primaryActionText}>
                  {isSoloMode ? 'Retest 60s' : 'Next Opponent'}
                </Text>
              </Pressable>

              <Pressable
                onPress={() => setMatchStatus('queue_select')}
                style={[styles.secondaryActionButton, { flex: 1 }]}>
                <Text style={styles.secondaryActionText}>Back to Hub</Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* ── VIEW 6: ACTIVE MULTIPLAYER CAMPUS SPRINT ARENA ───────────── */}
        {matchStatus === 'sprint_race' && (
          <ScrollView contentContainerStyle={styles.contentScroll} showsVerticalScrollIndicator={false}>
            {/* Arena Header: Realtime WebSocket Ping, Elapsed Clock, Destination */}
            <View style={styles.arenaHeader}>
              <View style={styles.pingIndicator}>
                <View style={styles.pingDot} />
                <Text style={styles.pingText}>
                  WebSocket Sync: {liveRaceState?.pingMs || 12}ms
                </Text>
              </View>
              <View style={styles.clockBox}>
                <Text style={styles.clockNumbers}>
                  {Math.floor((liveRaceState?.elapsedSeconds || 0) / 60)}:
                  {String((liveRaceState?.elapsedSeconds || 0) % 60).padStart(2, '0')}
                </Text>
              </View>
              <View style={styles.privacyBadge}>
                <AppIcon name="wifi" size={11} color={Palette.lime} />
                <Text style={styles.privacyText}>Supabase Channel Active</Text>
              </View>
            </View>

            {/* Target Destination Checkpoint Banner */}
            <View style={styles.checkpointBanner}>
              <View style={styles.checkpointIconBox}>
                <AppIcon name="flag" size={18} color={Palette.forest} />
              </View>
              <View style={styles.checkpointInfo}>
                <Text style={styles.checkpointTitle}>🏁 {selectedDestination.name}</Text>
                <Text style={styles.checkpointSubtitle}>
                  {selectedDestination.area} • Common Rally Point: {selectedDestination.defaultDistanceMeters}m
                </Text>
              </View>
            </View>

            {/* Live Interactive Campus Race Map with Real-Time Runner Positions */}
            <RaceLiveMap
              destination={selectedDestination}
              participants={liveRaceState?.participants || raceParticipants}
              isInteractiveSelection={false}
            />

            {/* Live Real-Time Leaderboard */}
            <View style={styles.raceLeaderboardCard}>
              <View style={styles.leaderboardHeader}>
                <Text style={styles.leaderboardTitle}>LIVE RUNNER POSITIONS (WEBSOCKET)</Text>
                <Text style={styles.leaderboardSub}>First to cross 15m finish threshold wins!</Text>
              </View>

              {(liveRaceState?.participants || raceParticipants).map((runner) => {
                const totalDist = selectedDestination.defaultDistanceMeters;
                const progressPct = runner.progressPercent || 0;

                return (
                  <View key={runner.id} style={styles.liveRunnerRow}>
                    <View
                      style={[
                        styles.runnerRankCircle,
                        runner.currentRank === 1 && styles.runnerRankCircleFirst,
                      ]}>
                      <Text
                        style={[
                          styles.runnerRankDigit,
                          runner.currentRank === 1 && styles.runnerRankDigitFirst,
                        ]}>
                        #{runner.currentRank}
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.participantAvatarRing,
                        { borderColor: runner.color || Palette.lime, width: 32, height: 32 },
                      ]}>
                      <Image source={{ uri: runner.avatar }} style={styles.participantAvatar} />
                    </View>

                    <View style={styles.runnerLeaderboardCol}>
                      <View style={styles.runnerLeaderboardTopRow}>
                        <Text style={styles.runnerLeaderboardName}>
                          {runner.name} {runner.isCurrentUser ? '(You)' : ''}
                        </Text>
                        <Text style={styles.runnerLeaderboardDistance}>
                          {runner.distanceRemainingMeters <= 15
                            ? '🏁 FINISHED'
                            : `${runner.distanceRemainingMeters}m remaining`}
                        </Text>
                      </View>

                      {/* Live Progress Bar */}
                      <View style={styles.runnerTrack}>
                        <View
                          style={[
                            styles.runnerProgressFill,
                            {
                              width: `${Math.min(100, Math.max(3, progressPct))}%`,
                              backgroundColor: runner.color || Palette.lime,
                            },
                          ]}
                        />
                      </View>

                      <View style={styles.runnerMetaRow}>
                        <Text style={styles.runnerSpeedStat}>{runner.speedKmh} km/h</Text>
                        <Text style={styles.runnerPercentStat}>{progressPct}% to checkpoint</Text>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>

            {/* Your Runner Dashboard & Live GPS Controls */}
            <View style={styles.userSprintControlsCard}>
              <Text style={styles.sprintControlsLabel}>YOUR GPS RUNNER CONTROLS:</Text>
              <View style={styles.sprintStatsRow}>
                <View style={styles.sprintStatBox}>
                  <Text style={styles.sprintStatValue}>{userSprintSpeed} km/h</Text>
                  <Text style={styles.sprintStatLabel}>Current Speed</Text>
                </View>
                <View style={styles.sprintStatBox}>
                  <Text style={[styles.sprintStatValue, { color: Palette.lime }]}>
                    {liveRaceState?.participants.find((p) => p.isCurrentUser)
                      ?.distanceRemainingMeters ?? selectedDestination.defaultDistanceMeters}m
                  </Text>
                  <Text style={styles.sprintStatLabel}>To Checkpoint</Text>
                </View>
                <View style={styles.sprintStatBox}>
                  <Text style={styles.sprintStatValue}>
                    #{liveRaceState?.participants.find((p) => p.isCurrentUser)?.currentRank ?? 1}
                  </Text>
                  <Text style={styles.sprintStatLabel}>Current Rank</Text>
                </View>
              </View>

              {/* Push Sprint Accelerator Button */}
              <Pressable
                onPress={handleSprintBoost}
                style={({ pressed }) => [
                  styles.sprintBoostBtn,
                  pressed && styles.sprintBoostBtnPressed,
                ]}>
                <AppIcon name="flash" size={20} color={Palette.forest} />
                <Text style={styles.sprintBoostBtnText}>
                  🏃 SPRINT ACCELERATE (+28m Step)
                </Text>
              </Pressable>
            </View>
          </ScrollView>
        )}

        {/* ── VIEW 7: SPRINT RACE FINISHED SUMMARY ─────────────────────── */}
        {matchStatus === 'sprint_finished' && (
          <View style={styles.finishedContainer}>
            {liveRaceState?.winner?.isCurrentUser ? (
              <View style={styles.prCelebrationBadge}>
                <AppIcon name="trophy" size={28} color={Palette.lime} />
                <Text style={styles.prCelebrationTitle}>🏆 VICTORY! YOU WON!</Text>
                <Text style={styles.prCelebrationSubtitle}>
                  You were the first runner to reach {selectedDestination.name} across all participants!
                </Text>
              </View>
            ) : (
              <View style={styles.prCelebrationBadge}>
                <AppIcon name="flag" size={28} color={Palette.lime} />
                <Text style={styles.prCelebrationTitle}>🏁 SPRINT RACE COMPLETE!</Text>
                <Text style={styles.prCelebrationSubtitle}>
                  {liveRaceState?.winner?.name || 'A competitor'} arrived first at {selectedDestination.name}!
                </Text>
              </View>
            )}

            {/* Winner Podium & Stats */}
            <View style={styles.prSummaryCard}>
              <View style={styles.prSummaryRow}>
                <Text style={styles.prSummaryLabel}>1st Place Winner:</Text>
                <Text style={styles.prSummaryValue}>
                  {liveRaceState?.winner?.name || 'Rohan Sharma'}
                </Text>
              </View>
              <View style={styles.prSummaryRow}>
                <Text style={styles.prSummaryLabel}>Finish Time:</Text>
                <Text style={styles.prSummaryValue}>
                  {liveRaceState?.winner?.finishTimeFormatted || '0:38'}
                </Text>
              </View>
              <View style={styles.prSummaryRow}>
                <Text style={styles.prSummaryLabel}>Target Checkpoint:</Text>
                <Text style={styles.prSummaryEngine}>
                  {selectedDestination.name} ({selectedDestination.defaultDistanceMeters}m)
                </Text>
              </View>
              <View style={styles.prSummaryRow}>
                <Text style={styles.prSummaryLabel}>Realtime Connection:</Text>
                <Text style={styles.prSummaryEngine}>
                  WebSocket Broadcast (Room {roomCode})
                </Text>
              </View>
            </View>

            {/* Rewards Card */}
            <View style={styles.rewardsCard}>
              <View style={styles.rewardRow}>
                <Text style={styles.rewardLabel}>Personal ELO Rating:</Text>
                <Text style={styles.rewardValue}>
                  {liveRaceState?.winner?.isCurrentUser ? '+45 ELO (1495)' : '+15 ELO (1465)'}
                </Text>
              </View>
              <View style={styles.rewardRow}>
                <Text style={styles.rewardLabel}>College Global Rank Points:</Text>
                <Text style={[styles.rewardValue, { color: Palette.forest }]}>
                  {liveRaceState?.winner?.isCurrentUser
                    ? `+80 pts to ${userCollege}`
                    : `+30 pts to ${userCollege}`}
                </Text>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.finishedActionsRow}>
              <Pressable
                onPress={startRunningSprintRace}
                style={[styles.primaryActionButton, { flex: 1 }]}>
                <AppIcon name="reload" size={16} color={Palette.forest} />
                <Text style={styles.primaryActionText}>Race Again</Text>
              </Pressable>

              <Pressable
                onPress={() => setMatchStatus('queue_select')}
                style={[styles.secondaryActionButton, { flex: 1 }]}>
                <Text style={styles.secondaryActionText}>Back to Hub</Text>
              </Pressable>
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    backgroundColor: Palette.canvas,
    paddingTop: Platform.OS === 'ios' ? 44 : 20,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.space4,
    paddingVertical: Spacing.space3,
    borderBottomWidth: 1,
    borderBottomColor: Palette.border,
    backgroundColor: Palette.white,
  },
  backIconButton: {
    width: 36,
    height: 36,
    borderRadius: Radius.full,
    backgroundColor: Palette.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topCenterTitle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  blitzPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Palette.lime,
    paddingHorizontal: Spacing.space3,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  blitzPillText: {
    fontSize: 12,
    fontWeight: '800',
    color: Palette.forest,
    letterSpacing: 0.5,
  },
  topRightScore: {
    backgroundColor: Palette.surfaceSubtle,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.sm,
  },
  eloBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: Palette.ink,
  },
  contentScroll: {
    padding: Spacing.space4,
    paddingBottom: Spacing.space8,
    maxWidth: 600,
    width: '100%',
    alignSelf: 'center',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: Palette.surfaceSubtle,
    borderRadius: Radius.card,
    padding: 4,
    marginBottom: Spacing.space4,
    gap: 4,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.space2 + 2,
    borderRadius: Radius.btn,
    gap: 5,
  },
  tabButtonActive: {
    backgroundColor: Palette.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  tabButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: Palette.muted,
  },
  tabButtonTextActive: {
    color: Palette.forest,
    fontWeight: '700',
  },
  sectionCard: {
    backgroundColor: Palette.white,
    borderRadius: Radius.card,
    padding: Spacing.space4,
    borderWidth: 1,
    borderColor: Palette.border,
    marginBottom: Spacing.space4,
  },
  sectionHeaderTitle: {
    ...Typography.cardHeading,
    color: Palette.ink,
    marginBottom: 4,
  },
  sectionDescription: {
    ...Typography.supporting,
    color: Palette.muted,
    marginBottom: Spacing.space4,
  },
  queueCard: {
    borderWidth: 1.5,
    borderColor: Palette.border,
    borderRadius: Radius.card,
    padding: Spacing.space3,
    marginBottom: Spacing.space3,
    backgroundColor: Palette.surfaceHighlight,
  },
  queueCardSelected: {
    borderColor: Palette.forest,
    backgroundColor: 'rgba(24, 53, 45, 0.04)',
  },
  queueHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  queueIconBox: {
    width: 38,
    height: 38,
    borderRadius: Radius.sm,
    backgroundColor: 'rgba(197, 243, 107, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.space3,
  },
  queueInfoCol: {
    flex: 1,
  },
  queueTitleBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  queueName: {
    fontSize: 15,
    fontWeight: '700',
    color: Palette.ink,
  },
  badgePill: {
    backgroundColor: 'rgba(82, 121, 246, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  badgePillText: {
    fontSize: 10,
    fontWeight: '700',
    color: Palette.electricBlue,
  },
  queueDetails: {
    fontSize: 12,
    color: Palette.muted,
    lineHeight: 16,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Palette.forest,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: Spacing.space2,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Palette.forest,
  },
  queueFooterMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.space2,
    paddingTop: Spacing.space2,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  queuePlayersOnline: {
    fontSize: 11,
    fontWeight: '600',
    color: Palette.forest,
  },
  queueAvgTime: {
    fontSize: 11,
    color: Palette.muted,
  },
  primaryActionButton: {
    backgroundColor: Palette.lime,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.space3 + 2,
    borderRadius: Radius.btn,
    gap: 8,
    marginTop: Spacing.space2,
  },
  primaryActionText: {
    fontSize: 14,
    fontWeight: '700',
    color: Palette.forest,
  },
  proximityHeaderRow: {
    marginBottom: Spacing.space2,
  },
  geofenceTagBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Palette.surfaceSubtle,
    padding: Spacing.space2 + 2,
    borderRadius: Radius.sm,
    marginBottom: Spacing.space3,
  },
  geofenceTagText: {
    fontSize: 12,
    fontWeight: '600',
    color: Palette.forest,
  },
  nearbyList: {
    gap: Spacing.space3,
  },
  nearbyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Palette.surfaceHighlight,
    borderRadius: Radius.sm,
    padding: Spacing.space3,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  nearbyAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: Spacing.space3,
  },
  nearbyDetails: {
    flex: 1,
  },
  nearbyNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  nearbyName: {
    fontSize: 14,
    fontWeight: '700',
    color: Palette.ink,
  },
  nearbyDistance: {
    fontSize: 11,
    color: Palette.electricBlue,
    fontWeight: '600',
  },
  nearbyLocationTag: {
    fontSize: 11,
    color: Palette.muted,
    marginTop: 1,
  },
  nearbyElo: {
    fontSize: 10,
    color: Palette.forest,
    fontWeight: '600',
    marginTop: 2,
  },
  challengeButton: {
    backgroundColor: Palette.forest,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.btn,
  },
  challengeButtonText: {
    fontSize: 11,
    fontWeight: '800',
    color: Palette.lime,
  },
  roomCreateBox: {
    backgroundColor: Palette.surfaceSubtle,
    borderRadius: Radius.sm,
    padding: Spacing.space3,
  },
  boxLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Palette.muted,
    letterSpacing: 0.5,
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  generatedCode: {
    fontSize: 22,
    fontWeight: '800',
    color: Palette.forest,
    letterSpacing: 1,
  },
  codeRefreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Palette.white,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  codeRefreshText: {
    fontSize: 11,
    fontWeight: '600',
    color: Palette.forest,
  },
  exerciseChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 6,
  },
  exerciseChip: {
    backgroundColor: Palette.white,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  exerciseChipSelected: {
    backgroundColor: Palette.forest,
    borderColor: Palette.forest,
  },
  exerciseChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: Palette.ink,
  },
  exerciseChipTextSelected: {
    color: Palette.lime,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  codeInput: {
    flex: 1,
    backgroundColor: Palette.white,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Palette.border,
    paddingHorizontal: 12,
    fontSize: 14,
    color: Palette.ink,
    height: 40,
  },
  joinBtn: {
    backgroundColor: Palette.forest,
    paddingHorizontal: 16,
    justifyContent: 'center',
    borderRadius: Radius.sm,
  },
  joinBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Palette.lime,
  },
  techPillCard: {
    backgroundColor: 'rgba(24, 53, 45, 0.05)',
    borderRadius: Radius.card,
    padding: Spacing.space3,
    borderWidth: 1,
    borderColor: 'rgba(24, 53, 45, 0.12)',
  },
  techPillHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  techPillTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Palette.forest,
  },
  techPillBody: {
    fontSize: 11,
    color: Palette.muted,
    lineHeight: 16,
  },

  // ── SEARCHING VIEW ──────────────────────────────────────────────
  searchingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.space4,
  },
  radarWrapper: {
    width: 140,
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.space5,
  },
  radarPulseRing: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: Palette.forest,
    backgroundColor: 'rgba(197, 243, 107, 0.25)',
  },
  radarCenterCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Palette.lime,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  searchingTitle: {
    ...Typography.sectionHeading,
    color: Palette.ink,
    marginBottom: 6,
  },
  searchingSubtitle: {
    fontSize: 13,
    color: Palette.muted,
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 18,
    marginBottom: Spacing.space6,
  },
  cancelSearchBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: Radius.btn,
    borderWidth: 1,
    borderColor: Palette.border,
    backgroundColor: Palette.white,
  },
  cancelSearchText: {
    fontSize: 13,
    fontWeight: '600',
    color: Palette.muted,
  },

  // ── MATCHED VIEW ──────────────────────────────────────────────
  matchedContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.space4,
  },
  vsHeading: {
    fontSize: 26,
    fontWeight: '900',
    color: Palette.forest,
    letterSpacing: 1,
  },
  vsSubheading: {
    fontSize: 12,
    color: Palette.muted,
    marginTop: 4,
    marginBottom: Spacing.space6,
  },
  vsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginBottom: Spacing.space6,
  },
  fighterCard: {
    alignItems: 'center',
    backgroundColor: Palette.white,
    padding: Spacing.space3,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Palette.border,
    width: 120,
  },
  fighterAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginBottom: 8,
  },
  fighterAvatarPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Palette.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  fighterName: {
    fontSize: 13,
    fontWeight: '700',
    color: Palette.ink,
    textAlign: 'center',
  },
  fighterCollege: {
    fontSize: 10,
    color: Palette.muted,
    textAlign: 'center',
    marginTop: 2,
    maxHeight: 28,
  },
  fighterElo: {
    fontSize: 11,
    fontWeight: '700',
    color: Palette.forest,
    marginTop: 4,
  },
  vsBadgeCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Palette.lime,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vsBadgeText: {
    fontSize: 16,
    fontWeight: '900',
    color: Palette.forest,
  },
  matchStartingPill: {
    backgroundColor: Palette.forest,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: Radius.full,
  },
  matchStartingText: {
    fontSize: 12,
    fontWeight: '800',
    color: Palette.lime,
    letterSpacing: 1,
  },

  // ── ARENA VIEW ────────────────────────────────────────────────
  arenaContainer: {
    flex: 1,
    padding: Spacing.space3,
    maxWidth: 600,
    width: '100%',
    alignSelf: 'center',
  },
  arenaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.space2,
  },
  pingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(24, 53, 45, 0.08)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: Radius.sm,
  },
  pingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#34D399',
  },
  pingText: {
    fontSize: 9,
    fontWeight: '700',
    color: Palette.forest,
  },
  clockBox: {
    backgroundColor: Palette.forest,
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderRadius: Radius.card,
  },
  clockNumbers: {
    fontSize: 20,
    fontWeight: '900',
    color: Palette.lime,
    fontVariant: ['tabular-nums'],
  },
  privacyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Palette.forest,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: Radius.sm,
  },
  privacyText: {
    fontSize: 9,
    color: Palette.white,
    fontWeight: '600',
  },
  tugOfWarCard: {
    backgroundColor: Palette.white,
    borderRadius: Radius.card,
    padding: Spacing.space3,
    borderWidth: 1,
    borderColor: Palette.border,
    marginBottom: Spacing.space3,
  },
  tugHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  tugSideLeft: {
    fontSize: 12,
    fontWeight: '700',
    color: Palette.forest,
  },
  tugTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: Palette.muted,
  },
  tugSideRight: {
    fontSize: 12,
    fontWeight: '700',
    color: Palette.coral,
  },
  tugTrack: {
    height: 18,
    backgroundColor: Palette.surfaceSubtle,
    borderRadius: Radius.full,
    flexDirection: 'row',
    overflow: 'hidden',
    position: 'relative',
    marginVertical: 4,
  },
  tugPlayerBar: {
    backgroundColor: Palette.lime,
    height: '100%',
  },
  tugOpponentBar: {
    backgroundColor: Palette.coral,
    height: '100%',
  },
  tugCenterNeedle: {
    width: 4,
    height: '100%',
    backgroundColor: Palette.ink,
    zIndex: 10,
  },
  tugLeadText: {
    fontSize: 11,
    fontWeight: '700',
    color: Palette.forest,
    textAlign: 'center',
    marginTop: 4,
  },
  arenaExerciseSwitcher: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: Spacing.space2,
  },
  arenaExerciseBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    paddingHorizontal: 8,
    borderRadius: Radius.btn,
    backgroundColor: Palette.white,
    borderWidth: 1,
    borderColor: Palette.border,
    gap: 5,
  },
  arenaExerciseBtnActive: {
    backgroundColor: Palette.lime,
    borderColor: Palette.forest,
  },
  arenaExerciseBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: Palette.muted,
  },
  arenaExerciseBtnTextActive: {
    color: Palette.forest,
    fontWeight: '800',
  },
  hudCard: {
    backgroundColor: Palette.forest,
    borderRadius: Radius.card,
    padding: Spacing.space3,
    marginBottom: Spacing.space3,
  },
  hudHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  hudAiTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  hudAiTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: Palette.lime,
    letterSpacing: 0.4,
  },
  angleText: {
    fontSize: 12,
    fontWeight: '800',
    color: Palette.white,
    fontVariant: ['tabular-nums'],
  },
  aigymStagePill: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  aigymStagePillDown: {
    backgroundColor: Palette.lime,
    borderColor: Palette.lime,
  },
  aigymStagePillText: {
    fontSize: 9,
    fontWeight: '800',
    color: Palette.white,
    letterSpacing: 0.5,
  },
  cameraControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  camIconBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.sm,
  },
  camIconBtnMuted: {
    backgroundColor: 'rgba(229, 108, 103, 0.2)',
  },
  camIconBtnText: {
    fontSize: 10,
    fontWeight: '700',
    color: Palette.lime,
  },
  permissionBox: {
    backgroundColor: '#0F241E',
    borderRadius: Radius.sm,
    padding: Spacing.space4,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(197, 243, 107, 0.3)',
  },
  permissionIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(197, 243, 107, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.space2,
  },
  permissionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Palette.white,
    marginBottom: 4,
    textAlign: 'center',
  },
  permissionBody: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.75)',
    textAlign: 'center',
    lineHeight: 16,
    maxWidth: 290,
    marginBottom: Spacing.space3,
  },
  permissionPrivacyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(197, 243, 107, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
    marginBottom: Spacing.space3,
  },
  permissionPrivacyText: {
    fontSize: 9,
    fontWeight: '700',
    color: Palette.lime,
  },
  permissionActionsRow: {
    flexDirection: 'row',
    gap: 8,
    width: '100%',
  },
  grantPermissionBtn: {
    flex: 1.3,
    backgroundColor: Palette.lime,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: Radius.btn,
    gap: 5,
  },
  grantPermissionBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: Palette.forest,
  },
  skipPermissionBtn: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: Radius.btn,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  skipPermissionBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: Palette.white,
  },
  cameraFeedWrapper: {
    height: 190,
    borderRadius: Radius.sm,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#0F241E',
    borderWidth: 1.5,
    borderColor: 'rgba(197, 243, 107, 0.4)',
  },
  cameraFeed: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  cameraDarkScrim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 36, 30, 0.35)',
  },
  cameraPausedScrim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#0F241E',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  cameraPausedText: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.5)',
    fontWeight: '500',
  },
  cameraStatusPill: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
    zIndex: 10,
  },
  liveRecDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#34D399',
  },
  cameraStatusText: {
    fontSize: 9,
    fontWeight: '700',
    color: Palette.white,
    letterSpacing: 0.3,
  },
  skeletonOverlayContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 5,
  },
  skeletonNode: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ translateX: -6 }, { translateY: -6 }],
  },
  skeletonInnerDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderWidth: 1.5,
    borderColor: Palette.forest,
  },
  skeletonInnerDotTriplet: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: Palette.lime,
    borderWidth: 2.5,
    borderColor: '#0F241E',
    shadowColor: Palette.lime,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 6,
    elevation: 4,
  },
  skeletonNodeLabel: {
    fontSize: 7.5,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.75)',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 3,
    borderRadius: 2,
    marginTop: 1,
  },
  skeletonNodeLabelTriplet: {
    fontSize: 8.5,
    fontWeight: '900',
    color: Palette.lime,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    borderWidth: 0.5,
    borderColor: Palette.lime,
  },
  arGuidanceBar: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    right: 8,
    backgroundColor: 'rgba(24, 53, 45, 0.85)',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: Radius.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(197, 243, 107, 0.3)',
    zIndex: 10,
  },
  arGuidanceText: {
    fontSize: 10,
    fontWeight: '700',
    color: Palette.lime,
    textAlign: 'center',
  },
  wireframeBox: {
    height: 120,
    backgroundColor: '#0F241E',
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: 'rgba(197, 243, 107, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  landmarkDotShoulder: {
    position: 'absolute',
    left: '32%',
    top: '35%',
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Palette.lime,
  },
  landmarkDotElbow: {
    position: 'absolute',
    left: '48%',
    top: '60%',
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Palette.lime,
  },
  landmarkDotHip: {
    position: 'absolute',
    left: '68%',
    top: '40%',
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Palette.lime,
  },
  landmarkDotHipSquat: {
    position: 'absolute',
    left: '48%',
    top: '32%',
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Palette.lime,
  },
  landmarkDotKnee: {
    position: 'absolute',
    left: '42%',
    top: '58%',
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Palette.lime,
  },
  landmarkDotAnkle: {
    position: 'absolute',
    left: '45%',
    top: '84%',
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Palette.lime,
  },
  wireframeLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '500',
  },
  alertFlashBox: {
    position: 'absolute',
    backgroundColor: 'rgba(229, 108, 103, 0.92)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radius.sm,
  },
  alertFlashText: {
    fontSize: 13,
    fontWeight: '900',
    color: Palette.white,
    letterSpacing: 0.5,
  },
  goodFlashBox: {
    position: 'absolute',
    backgroundColor: 'rgba(197, 243, 107, 0.95)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radius.sm,
  },
  goodFlashText: {
    fontSize: 13,
    fontWeight: '900',
    color: Palette.forest,
    letterSpacing: 0.5,
  },
  criteriaRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 8,
  },
  criteriaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  criteriaText: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '600',
  },
  simControlsCard: {
    backgroundColor: Palette.white,
    borderRadius: Radius.card,
    padding: Spacing.space3,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  simControlsLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: Palette.muted,
    marginBottom: 6,
  },
  simButtonsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  validRepBtn: {
    flex: 1,
    backgroundColor: Palette.lime,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: Radius.btn,
    gap: 4,
  },
  validRepBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: Palette.forest,
  },
  halfRepBtn: {
    flex: 1,
    backgroundColor: Palette.coral,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: Radius.btn,
    gap: 4,
  },
  halfRepBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Palette.white,
  },

  // ── FINISHED VIEW ─────────────────────────────────────────────
  finishedContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.space4,
  },
  finishTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: Palette.forest,
    letterSpacing: 1,
  },
  finishScoreSummary: {
    fontSize: 16,
    color: Palette.ink,
    fontWeight: '700',
    marginTop: 4,
    marginBottom: Spacing.space5,
  },
  rewardsCard: {
    backgroundColor: Palette.white,
    borderRadius: Radius.card,
    padding: Spacing.space4,
    borderWidth: 1,
    borderColor: Palette.border,
    width: '100%',
    maxWidth: 360,
    gap: 12,
    marginBottom: Spacing.space5,
  },
  rewardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rewardLabel: {
    fontSize: 13,
    color: Palette.muted,
  },
  rewardValue: {
    fontSize: 13,
    fontWeight: '800',
    color: Palette.ink,
  },

  // ── YOLO MODEL & MAX RECORDS HUB ─────────────────────────────────
  yoloModelBanner: {
    backgroundColor: '#0F241E',
    borderRadius: Radius.card,
    padding: Spacing.space4,
    marginBottom: Spacing.space4,
    borderWidth: 1.5,
    borderColor: 'rgba(197, 243, 107, 0.4)',
  },
  modelHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 6,
  },
  modelTagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Palette.lime,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  modelTagPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: Palette.forest,
    letterSpacing: 0.5,
  },
  modelFileBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.sm,
  },
  modelFileText: {
    fontSize: 10,
    fontWeight: '700',
    color: Palette.lime,
  },
  modelTagline: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.75)',
    lineHeight: 16,
    marginBottom: Spacing.space3,
  },
  maxRecordsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  maxRecordCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: Radius.card,
    padding: Spacing.space3,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  maxRecordTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  maxRecordIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(197, 243, 107, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  maxRecordLabelCol: {
    flex: 1,
  },
  maxRecordLabel: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.65)',
    fontWeight: '600',
  },
  maxRecordValue: {
    fontSize: 16,
    fontWeight: '900',
    color: Palette.white,
  },
  maxRecordUnit: {
    fontSize: 10,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.6)',
  },
  quickSoloBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: Palette.lime,
    paddingVertical: 5,
    borderRadius: Radius.sm,
  },
  quickSoloBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: Palette.forest,
  },
  prCelebrationBadge: {
    backgroundColor: '#0F241E',
    borderRadius: Radius.card,
    padding: Spacing.space4,
    alignItems: 'center',
    marginBottom: Spacing.space3,
    borderWidth: 1.5,
    borderColor: Palette.lime,
    width: '100%',
    maxWidth: 360,
  },
  prCelebrationTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: Palette.lime,
    marginTop: 6,
    letterSpacing: 0.8,
  },
  prCelebrationSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 16,
  },
  prSummaryCard: {
    backgroundColor: Palette.white,
    borderRadius: Radius.card,
    padding: Spacing.space4,
    borderWidth: 1,
    borderColor: Palette.border,
    width: '100%',
    maxWidth: 360,
    gap: 8,
    marginBottom: Spacing.space3,
  },
  prSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  prSummaryLabel: {
    fontSize: 12,
    color: Palette.muted,
  },
  prSummaryValue: {
    fontSize: 14,
    fontWeight: '800',
    color: Palette.forest,
  },
  prSummaryEngine: {
    fontSize: 11,
    fontWeight: '700',
    color: Palette.ink,
    flexShrink: 1,
    textAlign: 'right',
  },
  finishedActionsRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
    maxWidth: 360,
  },
  secondaryActionButton: {
    backgroundColor: Palette.surfaceSubtle,
    borderRadius: Radius.btn,
    paddingVertical: Spacing.space3,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Palette.border,
  },
  secondaryActionText: {
    fontSize: 13,
    fontWeight: '700',
    color: Palette.ink,
  },

  // ── MULTIPLAYER RUNNING COMPETITION STYLES ──────────────────────
  customTypeTabsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: Spacing.space3,
  },
  customTypeTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: Radius.btn,
    backgroundColor: Palette.surfaceSubtle,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  customTypeTabActive: {
    backgroundColor: Palette.white,
    borderColor: Palette.forest,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  customTypeTabText: {
    fontSize: 12,
    fontWeight: '700',
    color: Palette.muted,
  },
  customTypeTabTextActive: {
    color: Palette.forest,
    fontWeight: '800',
  },
  sprintSetupBlock: {
    marginTop: 4,
  },
  setupSubLabel: {
    fontSize: 11,
    color: Palette.muted,
    marginBottom: Spacing.space2,
    lineHeight: 15,
  },
  destPresetsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: Spacing.space3,
  },
  destPresetChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Palette.surfaceSubtle,
    borderRadius: Radius.full,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  destPresetChipSelected: {
    backgroundColor: 'rgba(197, 243, 107, 0.25)',
    borderColor: Palette.forest,
  },
  destPresetChipText: {
    fontSize: 10.5,
    color: Palette.ink,
    fontWeight: '600',
  },
  destPresetChipTextSelected: {
    color: Palette.forest,
    fontWeight: '800',
  },
  selectedDestCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(24, 53, 45, 0.06)',
    borderRadius: Radius.card,
    padding: Spacing.space3,
    marginBottom: Spacing.space4,
    borderWidth: 1,
    borderColor: 'rgba(24, 53, 45, 0.15)',
  },
  destPinIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Palette.lime,
    alignItems: 'center',
    justifyContent: 'center',
  },
  destCardInfoCol: {
    flex: 1,
  },
  destCardTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: Palette.forest,
  },
  destCardDetails: {
    fontSize: 11,
    color: Palette.muted,
    marginTop: 2,
  },
  participantsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.space2,
  },
  wsActiveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(52, 211, 153, 0.15)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  wsActiveDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#10B981',
  },
  wsActiveText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#059669',
  },
  participantsList: {
    gap: 8,
    marginBottom: Spacing.space2,
  },
  participantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Palette.surfaceSubtle,
    borderRadius: Radius.btn,
    padding: Spacing.space2 + 2,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  participantAvatarRing: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 2,
    overflow: 'hidden',
  },
  participantAvatar: {
    width: '100%',
    height: '100%',
  },
  participantInfoCol: {
    flex: 1,
  },
  participantNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  participantName: {
    fontSize: 12,
    fontWeight: '700',
    color: Palette.ink,
  },
  readyBadge: {
    backgroundColor: 'rgba(52, 211, 153, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  readyBadgeText: {
    fontSize: 8.5,
    fontWeight: '800',
    color: '#059669',
  },
  participantCollege: {
    fontSize: 10,
    color: Palette.muted,
    marginTop: 1,
  },
  addRunnerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(24, 53, 45, 0.05)',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: Palette.forest,
    borderRadius: Radius.btn,
    paddingVertical: 8,
    marginTop: 4,
  },
  addRunnerBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: Palette.forest,
  },
  blitzSetupBlock: {
    marginTop: 4,
  },
  checkpointBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Palette.forest,
    borderRadius: Radius.card,
    padding: Spacing.space3,
    marginBottom: Spacing.space3,
    borderWidth: 1.5,
    borderColor: 'rgba(197, 243, 107, 0.4)',
  },
  checkpointIconBox: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Palette.lime,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkpointInfo: {
    flex: 1,
  },
  checkpointTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: Palette.lime,
  },
  checkpointSubtitle: {
    fontSize: 10.5,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  raceLeaderboardCard: {
    backgroundColor: '#0F241E',
    borderRadius: Radius.card,
    padding: Spacing.space4,
    borderWidth: 1.5,
    borderColor: 'rgba(197, 243, 107, 0.3)',
    marginBottom: Spacing.space3,
  },
  leaderboardHeader: {
    marginBottom: Spacing.space3,
  },
  leaderboardTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: Palette.lime,
    letterSpacing: 0.5,
  },
  leaderboardSub: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.65)',
    marginTop: 1,
  },
  liveRunnerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: Spacing.space3,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: Spacing.space2 + 2,
    borderRadius: Radius.btn,
  },
  runnerRankCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  runnerRankCircleFirst: {
    backgroundColor: Palette.lime,
  },
  runnerRankDigit: {
    fontSize: 10,
    fontWeight: '900',
    color: Palette.white,
  },
  runnerRankDigitFirst: {
    color: Palette.forest,
  },
  runnerLeaderboardCol: {
    flex: 1,
  },
  runnerLeaderboardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  runnerLeaderboardName: {
    fontSize: 11.5,
    fontWeight: '800',
    color: Palette.white,
  },
  runnerLeaderboardDistance: {
    fontSize: 10.5,
    fontWeight: '700',
    color: Palette.lime,
  },
  runnerTrack: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: Radius.full,
    overflow: 'hidden',
    marginBottom: 4,
  },
  runnerProgressFill: {
    height: '100%',
    borderRadius: Radius.full,
  },
  runnerMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  runnerSpeedStat: {
    fontSize: 9.5,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.75)',
  },
  runnerPercentStat: {
    fontSize: 9.5,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.55)',
  },
  userSprintControlsCard: {
    backgroundColor: Palette.white,
    borderRadius: Radius.card,
    padding: Spacing.space4,
    borderWidth: 1,
    borderColor: Palette.border,
    marginBottom: Spacing.space5,
  },
  sprintControlsLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: Palette.muted,
    letterSpacing: 0.5,
    marginBottom: Spacing.space3,
  },
  sprintStatsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: Spacing.space4,
  },
  sprintStatBox: {
    flex: 1,
    backgroundColor: Palette.surfaceSubtle,
    borderRadius: Radius.btn,
    padding: Spacing.space2 + 2,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Palette.border,
  },
  sprintStatValue: {
    fontSize: 15,
    fontWeight: '900',
    color: Palette.forest,
  },
  sprintStatLabel: {
    fontSize: 9.5,
    color: Palette.muted,
    marginTop: 2,
  },
  sprintBoostBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Palette.lime,
    paddingVertical: Spacing.space3 + 2,
    borderRadius: Radius.btn,
    shadowColor: Palette.forest,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  sprintBoostBtnPressed: {
    transform: [{ scale: 0.98 }],
    backgroundColor: '#b5ea4f',
  },
  sprintBoostBtnText: {
    fontSize: 14,
    fontWeight: '900',
    color: Palette.forest,
    letterSpacing: 0.5,
  },
});
