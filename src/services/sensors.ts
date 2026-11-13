/**
 * src/services/sensors.ts
 * ─────────────────────────────────────────────────────────────────
 * Real sensor input for activity tracking.
 *
 *   steps     → expo-sensors Pedometer (Android, iOS). Not on web.
 *   distance  → expo-location GPS, summed with the haversine formula.
 *
 * Nothing in here invents numbers. When a sensor is unavailable or the
 * permission is refused the tracker says so and the screen falls back
 * to the duration timer plus manual entry at the end of the session.
 * ─────────────────────────────────────────────────────────────────
 */
import { Platform } from 'react-native';
import { Pedometer } from 'expo-sensors';
import * as Location from 'expo-location';
import Constants, { ExecutionEnvironment } from 'expo-constants';

export type SensorState =
  | 'idle'
  | 'active'
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
      this.snapshot.pedometer = 'needs-dev-build';
      return;
    }

    try {
      const available = await Pedometer.isAvailableAsync();
      if (!available) {
        this.snapshot.pedometer = 'unavailable';
        return;
      }

      const { status } = await Pedometer.requestPermissionsAsync();
      if (status !== 'granted') {
        this.snapshot.pedometer = 'denied';
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

  const anyActive = snapshot.pedometer === 'active' || snapshot.gps === 'active';
  return anyActive ? parts.join(' · ') : `${parts.join(' · ')}. Enter totals at the end.`;
}
