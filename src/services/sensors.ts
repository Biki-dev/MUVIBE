/**
 * src/services/sensors.ts
 * ─────────────────────────────────────────────────────────────────
 * Real sensor input for activity tracking.
 *
 *   steps     → expo-sensors Pedometer, or the Accelerometer as a
 *               fallback when the pedometer cannot be used.
 *   distance  → expo-location GPS, summed with the haversine formula.
 *
 * Nothing in here invents numbers. A count from the accelerometer is
 * reported as "estimated" and never dressed up as a hardware pedometer
 * reading, because peak detection on motion is approximate.
 * ─────────────────────────────────────────────────────────────────
 */
import { Platform } from 'react-native';
import { Pedometer, Accelerometer } from 'expo-sensors';
import * as Location from 'expo-location';
import Constants, { ExecutionEnvironment } from 'expo-constants';

export type SensorState =
  | 'idle'
  | 'active'
  /** Counting from accelerometer peaks rather than the step sensor. */
  | 'estimated'
  | 'unavailable'
  | 'denied'
  /** Android + Expo Go: the host app lacks ACTIVITY_RECOGNITION. */
  | 'needs-dev-build';

/**
 * Expo Go ships a fixed Android manifest that does not declare
 * ACTIVITY_RECOGNITION, so the pedometer can never be granted there no
 * matter what the app asks for. Worth detecting explicitly, because the
 * symptom is otherwise just "steps stay at zero".
 */
const IS_EXPO_GO =
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

export interface GeoPoint {
  latitude: number;
  longitude: number;
  timestamp: number;
}

export interface SensorSnapshot {
  steps: number;
  distanceKm: number;
  /** Instantaneous speed from the GPS chip, km/h. 0 when standing still. */
  speedKmh: number;
  /** Every accepted GPS fix this session, oldest first. Drawn on the map. */
  route: GeoPoint[];
  /** Latest fix, accepted or not, so the map can centre before moving. */
  position: GeoPoint | null;
  pedometer: SensorState;
  gps: SensorState;
}

export interface SensorOptions {
  useSteps: boolean;
  useGps: boolean;
  onUpdate: (snapshot: SensorSnapshot) => void;
}

/* ── accelerometer step detection tuning ───────────────────────── */

/** EMA weight for the new sample. Lower is smoother but laggier. */
const SMOOTHING = 0.3;
/** Rising past this (in g, where rest is ~1.0) arms a step. */
const STEP_HIGH = 1.12;
/** Must fall back below this before another step can be counted. */
const STEP_LOW = 1.04;
/** 250ms caps the rate at 4 steps a second, faster than anyone walks. */
const MIN_STEP_GAP_MS = 250;

const EARTH_RADIUS_KM = 6371;
// GPS jitter while standing still is usually under this. Ignore it.
const MIN_MOVE_KM = 0.004;
// Readings with worse horizontal accuracy than this are too noisy to sum.
const MAX_ACCURACY_M = 35;

function haversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(a));
}

export class SensorTracker {
  private snapshot: SensorSnapshot = {
    steps: 0,
    distanceKm: 0,
    speedKmh: 0,
    route: [],
    position: null,
    pedometer: 'idle',
    gps: 'idle',
  };

  private pedometerSub: { remove: () => void } | null = null;
  private locationSub: Location.LocationSubscription | null = null;
  private lastFix: { lat: number; lon: number } | null = null;
  private running = false;

  // Accelerometer fallback state.
  private motionSub: { remove: () => void } | null = null;
  /** Low-passed acceleration magnitude. Seeded at rest, which is ~1 g. */
  private smoothed = 1;
  private aboveThreshold = false;
  private lastStepAt = 0;

  constructor(private readonly options: SensorOptions) {}

  getSnapshot(): SensorSnapshot {
    return { ...this.snapshot, route: [...this.snapshot.route] };
  }

  private emit() {
    this.options.onUpdate(this.getSnapshot());
  }

  /** Starts whichever sensors the activity asked for. Safe to call once. */
  async start(): Promise<void> {
    if (this.running) return;
    this.running = true;

    await Promise.all([
      this.options.useSteps ? this.startPedometer() : Promise.resolve(),
      this.options.useGps ? this.startGps() : Promise.resolve(),
    ]);
    this.emit();
  }

  /** Stops listening but keeps the totals, so resume continues from here. */
  pause(): void {
    this.running = false;
    this.pedometerSub?.remove();
    this.pedometerSub = null;
    this.motionSub?.remove();
    this.motionSub = null;
    // Reset the detector so resuming does not fire a step from a stale
    // half-finished peak, but keep the running total.
    this.smoothed = 1;
    this.aboveThreshold = false;
    this.locationSub?.remove();
    this.locationSub = null;
    this.lastFix = null;
  }

  async resume(): Promise<void> {
    await this.start();
  }

  stop(): SensorSnapshot {
    this.pause();
    return this.getSnapshot();
  }

  /* ── pedometer ───────────────────────────────────────────────── */

  private async startPedometer(): Promise<void> {
    if (Platform.OS === 'web') {
      this.snapshot.pedometer = 'unavailable';
      return;
    }

    if (Platform.OS === 'android' && IS_EXPO_GO) {
      // Asking would fail regardless: Expo Go's manifest has no
      // ACTIVITY_RECOGNITION entry, so the grant can never happen.
      // The accelerometer needs no permission, so count from that.
      this.snapshot.pedometer = 'needs-dev-build';
      this.startMotionSteps();
      return;
    }

    try {
      const available = await Pedometer.isAvailableAsync();
      if (!available) {
        this.snapshot.pedometer = 'unavailable';
        this.startMotionSteps();
        return;
      }

      const { status } = await Pedometer.requestPermissionsAsync();
      if (status !== 'granted') {
        this.snapshot.pedometer = 'denied';
        this.startMotionSteps();
        return;
      }

      // watchStepCount reports steps since the subscription began, so
      // carry forward whatever was counted before a pause.
      const base = this.snapshot.steps;
      this.pedometerSub = Pedometer.watchStepCount((result) => {
        this.snapshot.steps = base + result.steps;
        this.emit();
      });
      this.snapshot.pedometer = 'active';
    } catch (error) {
      console.warn('[sensors] pedometer failed:', error);
      this.snapshot.pedometer = 'unavailable';
      this.startMotionSteps();
    }
  }

  /* ── fallback step counting from the accelerometer ───────────── */

  /**
   * Counts steps by finding peaks in total acceleration.
   *
   * The accelerometer is in Expo Go and needs no Android permission, so
   * this is what makes step counting work at all without a development
   * build. It is an estimate: a phone jostling in a bag or a hand waved
   * about will add counts, and a very smooth gait can drop some.
   *
   * Method: low-pass the magnitude to kill sensor noise, then count a
   * step each time the smoothed signal rises past a high threshold
   * having previously fallen below a low one. The two thresholds give
   * hysteresis, so a signal hovering at the boundary cannot rattle out
   * dozens of false steps. A minimum gap caps the rate at a plausible
   * human cadence.
   */
  private startMotionSteps(): void {
    if (Platform.OS === 'web' || this.motionSub) return;

    try {
      // 20 Hz: about ten samples per step at a normal walking cadence,
      // enough to find the peak without draining the battery.
      Accelerometer.setUpdateInterval(50);

      this.motionSub = Accelerometer.addListener(({ x, y, z }) => {
        // Magnitude in g. At rest gravity alone gives roughly 1.0.
        const magnitude = Math.sqrt(x * x + y * y + z * z);

        // Exponential moving average, the low-pass filter.
        this.smoothed = this.smoothed * (1 - SMOOTHING) + magnitude * SMOOTHING;

        const now = Date.now();

        if (this.aboveThreshold) {
          if (this.smoothed < STEP_LOW) this.aboveThreshold = false;
          return;
        }

        if (this.smoothed > STEP_HIGH) {
          this.aboveThreshold = true;
          if (now - this.lastStepAt >= MIN_STEP_GAP_MS) {
            this.lastStepAt = now;
            this.snapshot.steps += 1;
            this.emit();
          }
        }
      });

      this.snapshot.pedometer = 'estimated';
    } catch (error) {
      console.warn('[sensors] accelerometer fallback failed:', error);
    }
  }

  /* ── gps ─────────────────────────────────────────────────────── */

  private async startGps(): Promise<void> {
    try {
      const enabled = await Location.hasServicesEnabledAsync();
      if (!enabled) {
        this.snapshot.gps = 'unavailable';
        return;
      }

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        this.snapshot.gps = 'denied';
        return;
      }

      this.locationSub = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          timeInterval: 2000,
          distanceInterval: 3,
        },
        (position) => {
          const { latitude, longitude, accuracy, speed } = position.coords;
          const point: GeoPoint = { latitude, longitude, timestamp: position.timestamp };

          // Always keep the latest position so the map can centre on the
          // user even before the first accepted movement.
          this.snapshot.position = point;

          // The chip reports m/s, or -1 / null when it cannot tell.
          this.snapshot.speedKmh =
            speed != null && speed >= 0 ? Number((speed * 3.6).toFixed(1)) : 0;

          if (accuracy != null && accuracy > MAX_ACCURACY_M) {
            this.emit();
            return;
          }

          if (this.lastFix) {
            const moved = haversineKm(
              this.lastFix.lat,
              this.lastFix.lon,
              latitude,
              longitude
            );
            if (moved >= MIN_MOVE_KM) {
              this.snapshot.distanceKm = Number(
                (this.snapshot.distanceKm + moved).toFixed(3)
              );
              this.snapshot.route.push(point);
              this.lastFix = { lat: latitude, lon: longitude };
            }
          } else {
            this.lastFix = { lat: latitude, lon: longitude };
            this.snapshot.route.push(point);
          }
          this.emit();
        }
      );
      this.snapshot.gps = 'active';
    } catch (error) {
      console.warn('[sensors] gps failed:', error);
      this.snapshot.gps = 'unavailable';
    }
  }
}

/** Human readable line for the tracking header. Never claims more than is true. */
export function describeSensors(
  snapshot: SensorSnapshot,
  useSteps: boolean,
  useGps: boolean
): string {
  const parts: string[] = [];

  if (useSteps) {
    if (snapshot.pedometer === 'active') parts.push('Pedometer on');
    else if (snapshot.pedometer === 'estimated') parts.push('Steps estimated from motion');
    else if (snapshot.pedometer === 'denied') parts.push('Step permission denied');
    else if (snapshot.pedometer === 'needs-dev-build') {
      parts.push('Step counting needs a development build, not Expo Go');
    } else if (snapshot.pedometer === 'unavailable') {
      parts.push('No pedometer on this device');
    }
  }

  if (useGps) {
    if (snapshot.gps === 'active') parts.push('GPS on');
    else if (snapshot.gps === 'denied') parts.push('Location permission denied');
    else if (snapshot.gps === 'unavailable') parts.push('GPS unavailable');
  }

  if (parts.length === 0) return 'Timer running';

  const anyActive =
    snapshot.pedometer === 'active' ||
    snapshot.pedometer === 'estimated' ||
    snapshot.gps === 'active';
  return anyActive ? parts.join(' · ') : `${parts.join(' · ')}. Enter totals at the end.`;
}
